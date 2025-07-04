
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

// Enhanced helper to extract more certificate details from PEM text
const getCertDetailsFromPem = (pemText: string): { 
  authority: string | null; 
  expiry: string | null; 
  issueDate: string | null;
  issuer: string | null;
} => {
  try {
    // Extract Organization (O=) for authority
    const authorityMatch = pemText.match(/O\s?=\s?"?([^,"]+)/);
    
    // Extract Common Name (CN=) for issuer
    const issuerMatch = pemText.match(/CN\s?=\s?"?([^,"]+)/);
    
    // Extract Not After date
    const expiryMatch = pemText.match(/Not After\s?:\s?([^\n]+)/);
    
    // Extract Not Before date
    const issueDateMatch = pemText.match(/Not Before\s?:\s?([^\n]+)/);
    
    let expiryDate = null;
    let issueDate = null;
    
    if (expiryMatch && expiryMatch[1]) {
      try {
        expiryDate = new Date(expiryMatch[1].trim()).toISOString();
      } catch(e) { 
        console.error("Could not parse expiry date:", expiryMatch[1]);
      }
    }
    
    if (issueDateMatch && issueDateMatch[1]) {
      try {
        issueDate = new Date(issueDateMatch[1].trim()).toISOString();
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
      const certResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(result.certificateUrl)}`);
      if (certResponse.ok) {
        const pemText = await certResponse.text();
        if (pemText.includes('-----BEGIN CERTIFICATE-----')) {
          const { authority, issuer, expiry, issueDate } = getCertDetailsFromPem(pemText);
          result.certificateAuthority = authority;
          result.certificateIssuer = issuer;
          result.certificateExpiry = expiry;
          result.certificateIssueDate = issueDate;
        } else {
          result.errors.push("VMC URL did not return a valid PEM certificate.");
        }
      } else {
        result.errors.push("Failed to fetch BIMI Verified Mark Certificate (VMC).");
      }
    } catch (e) {
      result.errors.push("Error fetching or parsing BIMI certificate.");
      console.error("BIMI VMC Error:", e);
    }
  }
  
  return result;
};
