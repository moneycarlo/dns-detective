
export interface SPFParseResult {
  mechanisms: string[];
  includes: string[];
  redirects: string[];
  lookupCount: number;
  exceedsLookupLimit: boolean;
}

export const parseSPFRecord = (record: string): SPFParseResult => {
  const mechanisms = [];
  const includes = [];
  const redirects = [];
  let lookupCount = 0;
  
  // Split by spaces and analyze each mechanism
  const parts = record.split(/\s+/);
  
  for (const part of parts) {
    if (part.startsWith('include:')) {
      includes.push(part.substring(8));
      lookupCount++; // Each include counts as a lookup
    } else if (part.startsWith('redirect=')) {
      redirects.push(part.substring(9));
      lookupCount++; // Redirect counts as a lookup
    } else if (part.match(/^[+\-~?]?(a|mx|ptr|exists):/)) {
      lookupCount++; // These mechanisms require DNS lookups
    }
    mechanisms.push(part);
  }
  
  return {
    mechanisms,
    includes,
    redirects,
    lookupCount,
    exceedsLookupLimit: lookupCount > 10
  };
};
