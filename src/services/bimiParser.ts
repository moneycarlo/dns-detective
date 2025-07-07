
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

// Simple helper to extract certificate details from PEM text
const getCertDetailsFromPem = (pemText: string): { 
  authority: string | null; 
  expiry: string | null; 
  issueDate: string | null;
  issuer: string | null;
} => {
  try {
    console.log("Parsing certificate, PEM text length:", pemText.length);
    
    // Look for authority/issuer info in the certificate text
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
    
    // Try to extract dates using a simple regex approach for common date formats
    // Look for certificate validity dates in the PEM structure
    let issueDate = null;
    let expiry = null;
    
    try {
      // Look for certificate section
      const certMatch = pemText.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/);
      if (certMatch) {
        const pemContent = certMatch[1].replace(/\s/g, '');
        const binaryString = atob(pemContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Convert to string and look for readable date patterns
        const certString = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
        
        // Look for date patterns like "241016" (YYMMDD) or "20241016" (YYYYMMDD)
        const datePatterns = certString.match(/(\d{6,8})/g);
        if (datePatterns && datePatterns.length >= 2) {
          // Try to parse the first two date-like patterns
          const firstDate = datePatterns[0];
          const secondDate = datePatterns[1];
          
          if (firstDate.length === 6) {
            // YYMMDD format
            const year = parseInt(firstDate.substr(0, 2));
            const fullYear = year < 50 ? 2000 + year : 1900 + year;
            const month = firstDate.substr(2, 2);
            const day = firstDate.substr(4, 2);
            issueDate = `${fullYear}-${month}-${day}T00:00:00Z`;
          } else if (firstDate.length === 8) {
            // YYYYMMDD format
            const year = firstDate.substr(0, 4);
            const month = firstDate.substr(4, 2);
            const day = firstDate.substr(6, 2);
            issueDate = `${year}-${month}-${day}T00:00:00Z`;
          }
          
          if (secondDate.length === 6) {
            // YYMMDD format
            const year = parseInt(secondDate.substr(0, 2));
            const fullYear = year < 50 ? 2000 + year : 1900 + year;
            const month = secondDate.substr(2, 2);
            const day = secondDate.substr(4, 2);
            expiry = `${fullYear}-${month}-${day}T00:00:00Z`;
          } else if (secondDate.length === 8) {
            // YYYYMMDD format
            const year = secondDate.substr(0, 4);
            const month = secondDate.substr(4, 2);
            const day = secondDate.substr(6, 2);
            expiry = `${year}-${month}-${day}T00:00:00Z`;
          }
        }
        
        console.log("Extracted certificate details:", { authority, issuer, issueDate, expiry });
      }
    } catch (parseError) {
      console.log("Could not parse certificate dates:", parseError);
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
