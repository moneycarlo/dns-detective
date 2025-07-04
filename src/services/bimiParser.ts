
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

    // Try different patterns for certificate details
    // Pattern 1: Standard certificate text output
    let authorityMatch = pemText.match(/Issuer:.*?O\s*=\s*([^,\n]+)/i);
    let issuerMatch = pemText.match(/Issuer:.*?CN\s*=\s*([^,\n]+)/i);
    
    // Pattern 2: Alternative formats
    if (!authorityMatch) {
      authorityMatch = pemText.match(/Organization.*?:\s*([^\n]+)/i) || 
                     pemText.match(/O=([^,\n]+)/i);
    }
    
    if (!issuerMatch) {
      issuerMatch = pemText.match(/Common Name.*?:\s*([^\n]+)/i) || 
                   pemText.match(/CN=([^,\n]+)/i);
    }
    
    // Look for validity dates
    let expiryMatch = pemText.match(/Not After\s*:\s*([^\n]+)/i) ||
                     pemText.match(/Validity[\s\S]*?Not After\s*:\s*([^\n]+)/i) ||
                     pemText.match(/notAfter=([^\n,]+)/i);
    
    let issueDateMatch = pemText.match(/Not Before\s*:\s*([^\n]+)/i) ||
                        pemText.match(/Validity[\s\S]*?Not Before\s*:\s*([^\n]+)/i) ||
                        pemText.match(/notBefore=([^\n,]+)/i);
    
    console.log("Authority match:", authorityMatch?.[1]);
    console.log("Issuer match:", issuerMatch?.[1]);
    console.log("Expiry match:", expiryMatch?.[1]);
    console.log("Issue date match:", issueDateMatch?.[1]);
    
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
      const certResponse = await fetch(result.certificateUrl);
      let pemText = '';
      
      if (certResponse.ok) {
        pemText = await certResponse.text();
        console.log("Direct fetch successful, content type:", certResponse.headers.get('content-type'));
      } else {
        console.log("Direct fetch failed, trying CORS proxy");
        // Fallback to CORS proxy
        const proxyResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(result.certificateUrl)}`);
        if (proxyResponse.ok) {
          pemText = await proxyResponse.text();
          console.log("Proxy fetch successful");
        } else {
          throw new Error("Both direct and proxy fetch failed");
        }
      }
      
      console.log("Certificate content preview:", pemText.substring(0, 200) + "...");
      
      if (pemText.includes('-----BEGIN CERTIFICATE-----')) {
        const { authority, issuer, expiry, issueDate } = getCertDetailsFromPem(pemText);
        result.certificateAuthority = authority;
        result.certificateIssuer = issuer;
        result.certificateExpiry = expiry;
        result.certificateIssueDate = issueDate;
        
        if (!authority && !issuer && !expiry && !issueDate) {
          result.errors.push("Could not extract certificate details from VMC.");
        }
      } else {
        result.errors.push("VMC URL did not return a valid PEM certificate.");
        console.log("Invalid certificate format, content:", pemText.substring(0, 500));
      }
    } catch (e) {
      result.errors.push("Error fetching or parsing BIMI certificate.");
      console.error("BIMI VMC Error:", e);
    }
  }
  
  return result;
};
