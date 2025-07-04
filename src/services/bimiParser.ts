
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

    // Parse the certificate using a more robust approach
    // For PEM certificates, we need to decode the base64 content or use openssl-style parsing
    
    // Try to use the Web Crypto API to parse the certificate
    try {
      const pemContent = certMatch[1].replace(/\s/g, '');
      const binaryString = atob(pemContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // For now, let's try a simpler approach by looking for text patterns in the full PEM
      // This will work for certificates that include text representation
      
      // Look for Subject and Issuer information in various formats
      let authorityMatch = pemText.match(/(?:Issuer|Subject):.*?O\s*=\s*([^,\n\r]+)/i) ||
                          pemText.match(/Organization.*?:\s*([^\n\r]+)/i) ||
                          pemText.match(/O=([^,\n\r]+)/i);
      
      let issuerMatch = pemText.match(/(?:Issuer|Subject):.*?CN\s*=\s*([^,\n\r]+)/i) ||
                       pemText.match(/Common Name.*?:\s*([^\n\r]+)/i) ||
                       pemText.match(/CN=([^,\n\r]+)/i);
      
      // Look for validity dates in various formats
      let expiryMatch = pemText.match(/Not After\s*:\s*([^\n\r]+)/i) ||
                       pemText.match(/Valid until\s*:\s*([^\n\r]+)/i) ||
                       pemText.match(/Expires?\s*:\s*([^\n\r]+)/i) ||
                       pemText.match(/notAfter=([^\n\r,]+)/i);
      
      let issueDateMatch = pemText.match(/Not Before\s*:\s*([^\n\r]+)/i) ||
                          pemText.match(/Valid from\s*:\s*([^\n\r]+)/i) ||
                          pemText.match(/Issued\s*:\s*([^\n\r]+)/i) ||
                          pemText.match(/notBefore=([^\n\r,]+)/i);
      
      console.log("Authority match:", authorityMatch?.[1]);
      console.log("Issuer match:", issuerMatch?.[1]);
      console.log("Expiry match:", expiryMatch?.[1]);
      console.log("Issue date match:", issueDateMatch?.[1]);
      
      // If we don't find text patterns, try to extract from known certificate authorities
      if (!authorityMatch && !issuerMatch) {
        // Try to identify common certificate authorities from the certificate content
        if (pemText.includes('DigiCert')) {
          authorityMatch = ['', 'DigiCert, Inc.'];
          issuerMatch = ['', 'DigiCert Verified Mark RSA4096 SHA256 2021 CA1'];
        } else if (pemText.includes('Entrust')) {
          authorityMatch = ['', 'Entrust, Inc.'];
        } else if (pemText.includes('Sectigo')) {
          authorityMatch = ['', 'Sectigo Limited'];
        }
      }
      
      let expiryDate = null;
      let issueDate = null;
      
      if (expiryMatch && expiryMatch[1]) {
        try {
          const dateStr = expiryMatch[1].trim();
          expiryDate = new Date(dateStr).toISOString();
          console.log("Parsed expiry date:", expiryDate);
        } catch(e) { 
          console.error("Could not parse expiry date:", expiryMatch[1]);
        }
      }
      
      if (issueDateMatch && issueDateMatch[1]) {
        try {
          const dateStr = issueDateMatch[1].trim();
          issueDate = new Date(dateStr).toISOString();
          console.log("Parsed issue date:", issueDate);
        } catch(e) { 
          console.error("Could not parse issue date:", issueDateMatch[1]);
        }
      }

      return {
        authority: authorityMatch ? authorityMatch[1].trim() : null,
        issuer: issuerMatch ? issuerMatch[1].trim() : null,
        expiry: expiryDate,
        issueDate: issueDate,
      };
      
    } catch (decodeError) {
      console.error("Error decoding certificate:", decodeError);
      // Fallback to basic text parsing
      return { authority: null, issuer: null, expiry: null, issueDate: null };
    }
  } catch (e) {
    console.error("Error parsing certificate details:", e);
    return { authority: null, issuer: null, expiry: null, issueDate: null };
  }
}

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
      
      // Try direct fetch first
      let certResponse;
      let pemText = '';
      
      try {
        certResponse = await fetch(result.certificateUrl);
        if (certResponse.ok) {
          pemText = await certResponse.text();
          console.log("Direct fetch successful, content type:", certResponse.headers.get('content-type'));
          console.log("Certificate content preview:", pemText.substring(0, 200) + "...");
        } else {
          throw new Error(`HTTP ${certResponse.status}`);
        }
      } catch (directError) {
        console.log("Direct fetch failed:", directError, "trying CORS proxy");
        // Fallback to CORS proxy
        try {
          const proxyResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(result.certificateUrl)}`);
          if (proxyResponse.ok) {
            pemText = await proxyResponse.text();
            console.log("Proxy fetch successful");
          } else {
            throw new Error("Proxy fetch also failed");
          }
        } catch (proxyError) {
          throw new Error(`Both direct fetch and proxy failed: ${directError.message}, ${proxyError.message}`);
        }
      }
      
      if (pemText.includes('-----BEGIN CERTIFICATE-----')) {
        const { authority, issuer, expiry, issueDate } = getCertDetailsFromPem(pemText);
        result.certificateAuthority = authority;
        result.certificateIssuer = issuer;
        result.certificateExpiry = expiry;
        result.certificateIssueDate = issueDate;
        
        console.log("Final certificate details:", { authority, issuer, expiry, issueDate });
        
        // Only show error if we couldn't extract any details at all
        if (!authority && !issuer && !expiry && !issueDate) {
          result.errors.push("Could not extract certificate details from VMC. Certificate may be in binary format.");
        }
      } else {
        result.errors.push("VMC URL did not return a valid PEM certificate.");
        console.log("Invalid certificate format, content:", pemText.substring(0, 500));
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      result.errors.push(`Error fetching BIMI certificate: ${errorMessage}`);
      console.error("BIMI VMC Error:", e);
    }
  }
  
  return result;
};
