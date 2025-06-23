import { DnsResponse, queryDns } from './dnsQuery';

export interface BIMIParseResult {
  logoUrl: string | null;
  certificateUrl: string | null;
  certificateExpiry: string | null;
  certificateAuthority: string | null;
  errors: string[];
}

// A simple helper to find the expiration date and issuer from a PEM certificate text.
const getCertDetailsFromPem = (pemText: string): { authority: string | null; expiry: string | null } => {
  try {
    // This is a simplified approach. A proper library would be needed for full validation.
    const authorityMatch = pemText.match(/O\s?=\s?"?([^,"]+)/);
    const expiryMatch = pemText.match(/Not After\s?:\s?([^\n]+)/);
    
    let expiryDate = null;
    if (expiryMatch && expiryMatch[1]) {
        try {
            expiryDate = new Date(expiryMatch[1].trim()).toISOString();
        } catch(e) { console.error("Could not parse date:", expiryMatch[1])}
    }

    return {
      authority: authorityMatch ? authorityMatch[1] : 'Unknown',
      expiry: expiryDate,
    };
  } catch (e) {
    return { authority: null, expiry: null };
  }
}


export const parseBIMIRecord = async (record: string): Promise<BIMIParseResult> => {
  const result: BIMIParseResult = { logoUrl: null, certificateUrl: null, certificateExpiry: null, certificateAuthority: null, errors: [] };
  const pairs = record.split(';').map(p => p.trim());
  
  for (const pair of pairs) {
    if (pair.startsWith('l=')) {
      result.logoUrl = pair.substring(2);
    } else if (pair.startsWith('a=')) {
      result.certificateUrl = pair.substring(2);
    }
  }

  if (result.certificateUrl) {
    try {
      const certResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(result.certificateUrl)}`);
      if (certResponse.ok) {
        const pemText = await certResponse.text();
        if(pemText.includes('-----BEGIN CERTIFICATE-----')) {
            const { authority, expiry } = getCertDetailsFromPem(pemText);
            result.certificateAuthority = authority;
            result.certificateExpiry = expiry;
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
