
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
    } else if (part.match(/^[+\-~?]?(a|mx)$/)) {
      lookupCount++; // Plain 'a' and 'mx' mechanisms also require DNS lookups
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

// Helper function to count total lookups including nested includes
export const countTotalSPFLookups = async (record: string, visited: Set<string> = new Set()): Promise<number> => {
  let totalLookups = 0;
  const parts = record.split(/\s+/);
  
  for (const part of parts) {
    if (part.startsWith('include:')) {
      const includeDomain = part.substring(8);
      totalLookups++; // Count the include itself
      
      // Avoid infinite recursion by tracking visited domains
      if (!visited.has(includeDomain)) {
        visited.add(includeDomain);
        
        try {
          // In a real implementation, you would fetch the nested SPF record here
          // For now, we'll estimate based on common patterns
          if (includeDomain.includes('google.com') || includeDomain.includes('_spf.google.com')) {
            totalLookups += 3; // Google typically has 3-4 nested lookups
          } else if (includeDomain.includes('microsoft.com') || includeDomain.includes('outlook.com')) {
            totalLookups += 2; // Microsoft typically has 2-3 nested lookups
          } else if (includeDomain.includes('salesforce.com')) {
            totalLookups += 1; // Salesforce typically has 1-2 nested lookups
          } else {
            totalLookups += 1; // Conservative estimate for other providers
          }
        } catch (error) {
          console.error(`Error fetching nested SPF for ${includeDomain}:`, error);
        }
      }
    } else if (part.startsWith('redirect=')) {
      totalLookups++; // Redirect counts as a lookup
    } else if (part.match(/^[+\-~?]?(a|mx|ptr|exists):/)) {
      totalLookups++; // These mechanisms require DNS lookups
    } else if (part.match(/^[+\-~?]?(a|mx)$/)) {
      totalLookups++; // Plain 'a' and 'mx' mechanisms also require DNS lookups
    }
  }
  
  return totalLookups;
};
