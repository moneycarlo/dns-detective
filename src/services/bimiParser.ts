import { DnsResponse, queryDns } from './dnsQuery';

export interface BIMIParseResult {
  logoUrl: string | null;
  certificateUrl: string | null;
  certificateExpiry: string | null;
  certificateAuthority: string | null;
  errors: string[];
}

// Helper to parse PEM and find O and expiry. A full ASN.1 parser is too heavy.
const quickParsePem = (pem: string): { authority: string | null; expiry: string | null } => {
  try {
    // A very basic regex to find the most common 'O=' fields for authority
    const authorityMatch = pem.match(/Organization: O = ([^\n\r]+)/) ?? pem.match(/O = ([^\n\r]+)/);
    const expiryMatch = pem.match(/Not After : ([^\n\r]+)/);
    
    return {
      authority: authorityMatch ? authorityMatch[1] : 'Unknown',
      expiry: expiryMatch ? new Date(expiryMatch[1]).toISOString() : null
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
      // Use a proxy to fetch the certificate to avoid CORS issues
      const certResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(result.certificateUrl)}`);
      if (certResponse.ok) {
        const pemText = await certResponse.text();
        // This is a placeholder for a real parsing logic.
        // A full client-side X.509 parser is needed for production use.
        if(pemText.includes('-----BEGIN CERTIFICATE-----')) {
            const { authority, expiry } = quickParsePem(pemText);
            result.certificateAuthority = authority;
            result.certificateExpiry = expiry;
        } else {
             result.errors.push("Fetched VMC URL content does not appear to be a valid PEM certificate.");
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
