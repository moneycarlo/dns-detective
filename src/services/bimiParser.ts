
export interface BIMIParseResult {
  logoUrl: string | null;
  certificateUrl: string | null;
  certificateExpiry: string | null;
}

export const parseBIMIRecord = (record: string): BIMIParseResult => {
  const pairs = record.split(';').map(pair => pair.trim());
  let logoUrl: string | null = null;
  let certificateUrl: string | null = null;
  
  for (const pair of pairs) {
    if (pair.startsWith('l=')) {
      logoUrl = pair.substring(2);
    } else if (pair.startsWith('a=')) {
      certificateUrl = pair.substring(2);
    }
  }
  
  return {
    logoUrl,
    certificateUrl,
    certificateExpiry: certificateUrl ? '2025-12-31' : null // Mock expiry for now
  };
};
