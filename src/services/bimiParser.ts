
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

// Helper to parse ASN.1 DER encoded certificate data and extract dates
const parseX509Certificate = (certData: Uint8Array): {
  authority: string | null;
  issuer: string | null;
  expiry: string | null;
  issueDate: string | null;
} => {
  try {
    console.log("Parsing X.509 certificate, size:", certData.length);
    
    // Convert to hex string for pattern matching
    const hexString = Array.from(certData).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Look for ASN.1 UTCTime (tag 17) and GeneralizedTime (tag 18) patterns
    // UTCTime format: 17 0D YYMMDDHHMMSSZ (13 bytes total)
    // GeneralizedTime format: 18 0F YYYYMMDDHHMMSSZ (15 bytes total)
    
    const dates: string[] = [];
    
    // Find UTCTime patterns (17 0D followed by 12 hex digits + 5A for Z)
    const utcTimePattern = /170d([0-9a-f]{12})5a/gi;
    let match;
    while ((match = utcTimePattern.exec(hexString)) !== null) {
      const dateHex = match[1];
      // Convert hex to ASCII
      const dateStr = dateHex.match(/.{2}/g)?.map(hex => String.fromCharCode(parseInt(hex, 16))).join('') || '';
      if (dateStr.length === 6) {
        // UTCTime: YYMMDD format, assume 20XX for years 00-49, 19XX for 50-99
        const year = parseInt(dateStr.substr(0, 2));
        const fullYear = year < 50 ? 2000 + year : 1900 + year;
        const month = dateStr.substr(2, 2);
        const day = dateStr.substr(4, 2);
        dates.push(`${fullYear}-${month}-${day}T00:00:00Z`);
      }
    }
    
    // Find GeneralizedTime patterns (18 0F followed by 14 hex digits + 5A for Z)
    const genTimePattern = /180f([0-9a-f]{14})5a/gi;
    while ((match = genTimePattern.exec(hexString)) !== null) {
      const dateHex = match[1];
      // Convert hex to ASCII
      const dateStr = dateHex.match(/.{2}/g)?.map(hex => String.fromCharCode(parseInt(hex, 16))).join('') || '';
      if (dateStr.length === 7) {
        // GeneralizedTime: YYYYMMDDHHMM format
        const year = dateStr.substr(0, 4);
        const month = dateStr.substr(4, 2);
        const day = dateStr.substr(6, 2);
        dates.push(`${year}-${month}-${day}T00:00:00Z`);
      }
    }
    
    console.log("Extracted dates from certificate:", dates);
    
    // Look for authority/issuer info in readable strings
    const certString = Array.from(certData).map(b => String.fromCharCode(b)).join('');
    
    let authority = null;
    let issuer = null;
    
    if (certString.includes('DigiCert')) {
      authority = 'DigiCert, Inc.';
      if (certString.includes('Verified Mark')) {
        issuer = 'DigiCert Verified Mark RSA4096 SHA256 2021 CA1';
      }
    } else if (certString.includes('Entrust')) {
      authority = 'Entrust, Inc.';
      issuer = 'Entrust Certificate Services';
    } else if (certString.includes('Sectigo')) {
      authority = 'Sectigo Limited';
      issuer = 'Sectigo RSA Domain Validation Secure Server CA';
    }
    
    // Return dates in order: issue date (notBefore), expiry date (notAfter)
    return { 
      authority, 
      issuer, 
      issueDate: dates.length > 0 ? dates[0] : null,
      expiry: dates.length > 1 ? dates[1] : null
    };
  } catch (e) {
    console.error("Error parsing binary certificate:", e);
    return { authority: null, issuer: null, expiry: null, issueDate: null };
  }
};

// Enhanced helper to extract certificate details from PEM text
const getCertDetailsFromPem = (pemText: string): { 
  authority: string | null; 
  expiry: string | null; 
  issueDate: string | null;
  issuer: string | null;
} => {
  try {
    console.log("Parsing certificate, PEM text length:", pemText.length);
    
    // Look for certificate text section between BEGIN and END CERTIFICATE
    const certMatch = pemText.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/);
    if (!certMatch) {
      console.log("No certificate section found in PEM");
      return { authority: null, issuer: null, expiry: null, issueDate: null };
    }

    // Try to decode the base64 certificate data
    try {
      const pemContent = certMatch[1].replace(/\s/g, '');
      const binaryString = atob(pemContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log("Successfully decoded certificate, size:", bytes.length);
      
      // Try to parse the binary certificate
      const binaryResult = parseX509Certificate(bytes);
      console.log("Binary parsing result:", binaryResult);
      
      // If we got dates from binary parsing, use those
      if (binaryResult.issueDate || binaryResult.expiry) {
        return binaryResult;
      }
    } catch (decodeError) {
      console.log("Could not decode base64 certificate:", decodeError);
    }
    
    return { authority: null, issuer: null, expiry: null, issueDate: null };
    
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
      
      const response = await fetch(result.certificateUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/x-pem-file, application/x-x509-ca-cert, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; BIMI-Checker/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const pemText = await response.text();
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
