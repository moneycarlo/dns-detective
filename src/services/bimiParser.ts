
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

// Helper to parse ASN.1 DER encoded certificate data
const parseX509Certificate = (certData: Uint8Array): {
  authority: string | null;
  issuer: string | null;
  expiry: string | null;
  issueDate: string | null;
} => {
  try {
    // This is a simplified X.509 parser for demonstration
    // In a real implementation, you'd use a proper ASN.1 parser
    
    // For now, let's try to extract basic info using known patterns in DER format
    const certString = Array.from(certData).map(b => String.fromCharCode(b)).join('');
    
    // Look for common certificate authority patterns
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
    
    return { authority, issuer, expiry: null, issueDate: null };
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
    console.log("First 500 chars:", pemText.substring(0, 500));
    
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
      if (binaryResult.authority || binaryResult.issuer) {
        console.log("Extracted from binary:", binaryResult);
        return binaryResult;
      }
    } catch (decodeError) {
      console.log("Could not decode base64 certificate:", decodeError);
    }
    
    // Fallback: try to find text representations in the full PEM content
    // Sometimes certificates include human-readable text sections
    
    // Enhanced patterns for finding certificate information
    const patterns = {
      authority: [
        /Issuer:.*?O\s*=\s*([^,\n\r]+)/i,
        /Organization.*?:\s*([^\n\r,]+)/i,
        /O=([^,\n\r]+)/i,
        /Certificate Authority:\s*([^\n\r]+)/i
      ],
      issuer: [
        /Issuer:.*?CN\s*=\s*([^,\n\r]+)/i,
        /Common Name.*?:\s*([^\n\r,]+)/i,
        /CN=([^,\n\r]+)/i,
        /Issued by:\s*([^\n\r]+)/i
      ],
      expiry: [
        /Not After\s*:\s*([^\n\r]+)/i,
        /Valid until\s*:\s*([^\n\r]+)/i,
        /Expires?\s*:\s*([^\n\r]+)/i,
        /notAfter=([^\n\r,]+)/i,
        /Expiry Date:\s*([^\n\r]+)/i
      ],
      issueDate: [
        /Not Before\s*:\s*([^\n\r]+)/i,
        /Valid from\s*:\s*([^\n\r]+)/i,
        /Issued\s*:\s*([^\n\r]+)/i,
        /notBefore=([^\n\r,]+)/i,
        /Issue Date:\s*([^\n\r]+)/i
      ]
    };
    
    const extractField = (patterns: RegExp[], text: string): string | null => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return null;
    };
    
    const authority = extractField(patterns.authority, pemText);
    const issuer = extractField(patterns.issuer, pemText);
    const expiryStr = extractField(patterns.expiry, pemText);
    const issueDateStr = extractField(patterns.issueDate, pemText);
    
    console.log("Pattern extraction results:", { authority, issuer, expiryStr, issueDateStr });
    
    // Parse dates
    let expiryDate = null;
    let issueDate = null;
    
    if (expiryStr) {
      try {
        expiryDate = new Date(expiryStr).toISOString();
        console.log("Parsed expiry date:", expiryDate);
      } catch(e) { 
        console.log("Could not parse expiry date:", expiryStr);
      }
    }
    
    if (issueDateStr) {
      try {
        issueDate = new Date(issueDateStr).toISOString();
        console.log("Parsed issue date:", issueDate);
      } catch(e) { 
        console.log("Could not parse issue date:", issueDateStr);
      }
    }

    return {
      authority,
      issuer,
      expiry: expiryDate,
      issueDate,
    };
    
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
      
      // Try multiple fetching strategies
      let pemText = '';
      let fetchSuccess = false;
      
      // Strategy 1: Direct fetch
      try {
        const directResponse = await fetch(result.certificateUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/x-pem-file, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (compatible; BIMI-Checker/1.0)'
          }
        });
        
        if (directResponse.ok) {
          pemText = await directResponse.text();
          fetchSuccess = true;
          console.log("Direct fetch successful, content type:", directResponse.headers.get('content-type'));
        }
      } catch (directError) {
        console.log("Direct fetch failed:", directError);
      }
      
      // Strategy 2: CORS proxy fallback
      if (!fetchSuccess) {
        try {
          const proxyResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(result.certificateUrl)}`);
          if (proxyResponse.ok) {
            pemText = await proxyResponse.text();
            fetchSuccess = true;
            console.log("Proxy fetch successful");
          }
        } catch (proxyError) {
          console.log("Proxy fetch failed:", proxyError);
        }
      }
      
      // Strategy 3: Alternative CORS proxy
      if (!fetchSuccess) {
        try {
          const altProxyResponse = await fetch(`https://cors-anywhere.herokuapp.com/${result.certificateUrl}`, {
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          if (altProxyResponse.ok) {
            pemText = await altProxyResponse.text();
            fetchSuccess = true;
            console.log("Alternative proxy fetch successful");
          }
        } catch (altError) {
          console.log("Alternative proxy fetch failed:", altError);
        }
      }
      
      if (!fetchSuccess || !pemText) {
        throw new Error("Could not fetch certificate from any source");
      }
      
      console.log("Certificate content preview:", pemText.substring(0, 200) + "...");
      
      if (pemText.includes('-----BEGIN CERTIFICATE-----')) {
        const { authority, issuer, expiry, issueDate } = getCertDetailsFromPem(pemText);
        result.certificateAuthority = authority;
        result.certificateIssuer = issuer;
        result.certificateExpiry = expiry;
        result.certificateIssueDate = issueDate;
        
        console.log("Final certificate details:", { authority, issuer, expiry, issueDate });
        
        // Only show error if we couldn't extract any meaningful details
        if (!authority && !issuer && !expiry && !issueDate) {
          result.errors.push("Could not extract certificate details. Certificate may be in an unsupported format.");
        }
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
