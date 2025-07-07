
import { DnsResponse, queryDns } from './dnsQuery';

export interface BIMIParseResult {
  logoUrl: string | null;
  certificateUrl: string | null;
  certificateExpiry: string | null;
  certificateIssueDate: string | null;
  certificateAuthority: string | null;
  certificateIssuer: string | null;
  errors: string[];
}

// Helper to parse ASN.1 DER encoded dates from certificate
const parseASN1Date = (bytes: Uint8Array, offset: number): { date: string | null, newOffset: number } => {
  try {
    const tag = bytes[offset];
    const length = bytes[offset + 1];
    
    if ((tag === 0x17 && length === 13) || (tag === 0x18 && length === 15)) { // UTCTime or GeneralizedTime
      const dateBytes = bytes.slice(offset + 2, offset + 2 + length);
      const dateString = String.fromCharCode(...dateBytes);
      
      let year, month, day, hour, min, sec;
      
      if (tag === 0x17) { // UTCTime (YYMMDDHHMMSSZ)
        year = parseInt(dateString.substr(0, 2));
        year = year < 50 ? 2000 + year : 1900 + year;
        month = dateString.substr(2, 2);
        day = dateString.substr(4, 2);
        hour = dateString.substr(6, 2);
        min = dateString.substr(8, 2);
        sec = dateString.substr(10, 2);
      } else { // GeneralizedTime (YYYYMMDDHHMMSSZ)
        year = parseInt(dateString.substr(0, 4));
        month = dateString.substr(4, 2);
        day = dateString.substr(6, 2);
        hour = dateString.substr(8, 2);
        min = dateString.substr(10, 2);
        sec = dateString.substr(12, 2);
      }
      
      const isoDate = `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
      return { date: isoDate, newOffset: offset + 2 + length };
    }
    
    return { date: null, newOffset: offset + 1 };
  } catch (e) {
    console.log("Error parsing ASN.1 date:", e);
    return { date: null, newOffset: offset + 1 };
  }
};

// Extract certificate details from PEM text
const getCertDetailsFromPem = (pemText: string): { 
  authority: string | null; 
  expiry: string | null; 
  issueDate: string | null;
  issuer: string | null;
} => {
  try {
    console.log("Parsing certificate, PEM text length:", pemText.length);
    
    // Extract authority/issuer from text patterns
    let authority = null;
    let issuer = null;
    
    if (pemText.includes('DigiCert')) {
      authority = 'DigiCert, Inc.';
      if (pemText.includes('Verified Mark')) {
        issuer = 'DigiCert Verified Mark RSA4096 SHA256 2021 CA1';
      }
    } else if (pemText.includes('Entrust')) {
      authority = 'Entrust, Inc.';
      issuer = 'Entrust Certificate Services';
    } else if (pemText.includes('Sectigo')) {
      authority = 'Sectigo Limited';
      issuer = 'Sectigo RSA Domain Validation Secure Server CA';
    }
    
    let issueDate = null;
    let expiry = null;
    
    // Parse certificate for dates
    const certMatch = pemText.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/);
    if (certMatch) {
      try {
        const pemContent = certMatch[1].replace(/\s/g, '');
        const binaryString = atob(pemContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Look for validity sequence in certificate
        // X.509 certificates have validity as a SEQUENCE of two dates
        for (let i = 0; i < bytes.length - 20; i++) {
          if (bytes[i] === 0x30) { // SEQUENCE tag
            const seqLen = bytes[i + 1];
            if (seqLen > 20 && seqLen < 40) { // Reasonable length for validity sequence
              // Try to parse two consecutive dates
              const firstDate = parseASN1Date(bytes, i + 2);
              if (firstDate.date) {
                const secondDate = parseASN1Date(bytes, firstDate.newOffset);
                if (secondDate.date) {
                  issueDate = firstDate.date;
                  expiry = secondDate.date;
                  break;
                }
              }
            }
          }
        }
        
        console.log("Extracted certificate details:", { authority, issuer, issueDate, expiry });
      } catch (parseError) {
        console.log("Could not parse certificate dates:", parseError);
      }
    }
    
    return { authority, issuer, expiry, issueDate };
    
  } catch (e) {
    console.error("Error parsing certificate details:", e);
    return { authority: null, issuer: null, expiry: null, issueDate: null };
  }
};

export const parseBIMIRecord = async (record: string): Promise<BIMIParseResult> => {
  const result: BIMIParseResult = { 
    logoUrl: null, 
    certificateUrl: null, 
    certificateExpiry: null, 
    certificateIssueDate: null,
    certificateAuthority: null, 
    certificateIssuer: null,
    errors: [] 
  };
  
  const pairs = record.split(';').map(p => p.trim());
  
  for (const pair of pairs) {
    if (pair.startsWith('l=')) {
      result.logoUrl = pair.substring(2);
    } else if (pair.startsWith('a=')) {
      result.certificateUrl = pair.substring(2);
    }
  }

  // Validate logo URL format
  if (result.logoUrl && !result.logoUrl.toLowerCase().endsWith('.svg')) {
    result.errors.push("BIMI logo must be in SVG format.");
  }

  if (result.certificateUrl) {
    try {
      console.log("Fetching certificate from:", result.certificateUrl);
      
      // Try multiple approaches to fetch the certificate
      let response;
      let pemText;
      
      try {
        // First attempt: direct fetch
        response = await fetch(result.certificateUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/x-pem-file, application/x-x509-ca-cert, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (compatible; BIMI-Checker/1.0)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        pemText = await response.text();
      } catch (corsError) {
        console.log("CORS error, trying alternative approach:", corsError);
        
        // Fallback: try with no-cors mode (limited but might work)
        try {
          response = await fetch(result.certificateUrl, {
            method: 'GET',
            mode: 'no-cors'
          });
          
          if (response.type === 'opaque') {
            result.errors.push("Certificate URL blocked by CORS policy. Unable to verify certificate details.");
            return result;
          }
          
          pemText = await response.text();
        } catch (fallbackError) {
          throw new Error(`Failed to fetch certificate: ${corsError.message}`);
        }
      }
      
      console.log("Certificate content preview:", pemText.substring(0, 200) + "...");
      
      if (pemText.includes('-----BEGIN CERTIFICATE-----')) {
        const { authority, issuer, expiry, issueDate } = getCertDetailsFromPem(pemText);
        result.certificateAuthority = authority;
        result.certificateIssuer = issuer;
        result.certificateExpiry = expiry;
        result.certificateIssueDate = issueDate;
        
        console.log("Final certificate details:", { authority, issuer, expiry, issueDate });
      } else {
        result.errors.push("VMC URL did not return a valid PEM certificate format.");
        console.log("Invalid certificate format - not PEM. Content preview:", pemText.substring(0, 200));
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      result.errors.push(`Error fetching BIMI certificate: ${errorMessage}`);
      console.error("BIMI VMC Error:", e);
    }
  }
  
  return result;
};
