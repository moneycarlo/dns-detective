
import { queryDnsRecord } from './dnsQuery';

export interface SPFParseResult {
  mechanisms: string[];
  includes: string[];
  redirects: string[];
  // These are derived from countTotalSPFLookups, not directly parsed from the record string
  lookupCount: number;
  exceedsLookupLimit: boolean;
  nestedLookups: { [key: string]: string };
  lookupDetails: LookupDetail[];
}

export interface LookupDetail {
  number: number;
  type: 'include' | 'redirect' | 'a' | 'mx' | 'ptr' | 'exists';
  domain: string;
  record?: string;
  nested?: LookupDetail[];
  indent?: number;
}

/**
 * Parses the raw SPF record string to extract mechanisms, includes, and redirects.
 * This function does NOT count lookups; counting is handled by countTotalSPFLookups.
 */
export const parseSPFRecord = (record: string): Pick<SPFParseResult, 'mechanisms' | 'includes' | 'redirects'> => {
  const mechanisms = [];
  const includes = [];
  const redirects = [];
  
  const parts = record.split(/\s+/);
  
  for (const part of parts) {
    if (part.startsWith('include:')) {
      includes.push(part.substring(8));
    } else if (part.startsWith('redirect=')) {
      redirects.push(part.substring(9));
    }
    mechanisms.push(part);
  }
  
  return {
    mechanisms,
    includes,
    redirects
  };
};

// Global counter for sequential numbering across all recursive calls for a single domain analysis session.
// It's reset for each new domain analysis session (when indent === 0).
let globalLookupCounter = 0;

/**
 * Recursively counts and tracks all DNS lookups required by an SPF record, including nested ones.
 * Provides sequential numbering and indentation for clarity.
 * @param record The current SPF record string to analyze.
 * @param domain The domain associated with the current SPF record. Used for logging and 'a'/'mx' lookups.
 * @param visited A Set of domains already visited in the current lookup chain to prevent infinite recursion.
 * @param indent The current indentation level for console logging.
 * @returns An object containing the total lookup count, detailed lookup information, and nested SPF records.
 */
export const countTotalSPFLookups = async (
  record: string,
  domain: string,
  visited: Set<string> = new Set(),
  indent: number = 0
): Promise<{ totalLookups: number; lookupDetails: LookupDetail[]; nestedLookups: { [key: string]: string } }> => {
  
  // Reset global counter only for the initial call (top-level domain lookup)
  if (indent === 0) {
    globalLookupCounter = 0;
  }
  
  const currentLookupDetails: LookupDetail[] = [];
  const nestedLookups: { [key: string]: string } = {};
  const parts = record.split(/\s+/);
  
  // Add the current domain to the visited set to prevent immediate re-processing
  // in case of self-references or circular dependencies within the same record.
  // Note: For 'include' and 'redirect', we check 'visited.has(lookupDomain)' before recursing.
  const currentVisitedForRecursion = new Set(visited); // Create a new set for this recursion level
  currentVisitedForRecursion.add(domain);

  for (const part of parts) {
    // Check for mechanisms that explicitly require a DNS lookup as per RFC 7208 (Section 4.6.4)
    // These are 'a', 'mx', 'ptr', 'exists', 'include', and 'redirect'.
    // The 'all', 'ip4', 'ip6' mechanisms do not count as lookups.
    
    let isLookupMechanism = false;
    let lookupType: 'include' | 'redirect' | 'a' | 'mx' | 'ptr' | 'exists' | null = null;
    let lookupDomain: string | null = null;
    let fetchedRecord: string | null = null;
    let nestedLookupResults: LookupDetail[] | undefined;

    const includeMatch = part.match(/^include:(.+)$/);
    const redirectMatch = part.match(/^redirect=(.+)$/);
    const mechanismMatch = part.match(/^[+\-~?]?(a|mx|ptr|exists)(?::([^ ]+))?$/);

    if (includeMatch) {
      isLookupMechanism = true;
      lookupType = 'include';
      lookupDomain = includeMatch[1];
    } else if (redirectMatch) {
      isLookupMechanism = true;
      lookupType = 'redirect';
      lookupDomain = redirectMatch[1];
    } else if (mechanismMatch) {
      isLookupMechanism = true;
      lookupType = mechanismMatch[1] as 'a' | 'mx' | 'ptr' | 'exists';
      lookupDomain = mechanismMatch[2] || domain; // Use captured domain or current domain if not specified
    }

    if (isLookupMechanism && lookupType && lookupDomain !== null) {
      // Increment global counter for every new lookup found
      globalLookupCounter++;
      const currentLookupNumber = globalLookupCounter;

      const logPrefix = '  '.repeat(indent);
      
      console.log(`${logPrefix}🔍 Lookup #${currentLookupNumber}: ${lookupType} ${lookupDomain === domain ? '(current domain)' : lookupDomain}`);

      // Handle 'include' and 'redirect' mechanisms recursively
      if ((lookupType === 'include' || lookupType === 'redirect')) {
        // Only recurse if the domain has not been visited in the current path to prevent infinite loops
        if (!visited.has(lookupDomain)) {
          // Add the domain to the visited set for the next level of recursion
          currentVisitedForRecursion.add(lookupDomain);

          try {
            fetchedRecord = await queryDnsRecord(lookupDomain, 'TXT');
            
            if (fetchedRecord) {
              nestedLookups[lookupDomain] = fetchedRecord; // Store the fetched record
              
              // Only parse/recurse if it's a valid SPF record (starts with v=spf1)
              if (fetchedRecord.includes('v=spf1')) {
                const nestedResult = await countTotalSPFLookups(fetchedRecord, lookupDomain, currentVisitedForRecursion, indent + 1);
                nestedLookupResults = nestedResult.lookupDetails;
                // Merge nestedLookups from recursive calls into the current level's nestedLookups
                Object.assign(nestedLookups, nestedResult.nestedLookups);
              } else {
                console.log(`${logPrefix}   - Record for ${lookupDomain} is not an SPF record.`);
              }
            } else {
              console.log(`${logPrefix}   - No TXT record found for ${lookupDomain}.`);
              fetchedRecord = `No TXT record found`; // Indicate no record was found
            }
          } catch (error) {
            console.error(`${logPrefix}❌ Error fetching ${lookupType} SPF for ${lookupDomain}:`, error);
            fetchedRecord = `Error fetching record: ${error instanceof Error ? error.message : String(error)}`;
          }
        } else {
          console.log(`${logPrefix}⚠️ Lookup #${currentLookupNumber}: ${lookupType} ${lookupDomain} (already visited, skipping recursion)`);
          fetchedRecord = `Skipped (circular reference)`;
        }
      }
      
      // Add details for the current lookup to the list
      currentLookupDetails.push({
        number: currentLookupNumber,
        type: lookupType,
        domain: lookupDomain,
        record: fetchedRecord || undefined,
        nested: nestedLookupResults,
        indent: indent
      });
    }
  }
  
  return {
    totalLookups: globalLookupCounter, // The cumulative count for this entire domain lookup session
    lookupDetails: currentLookupDetails,
    nestedLookups: nestedLookups
  };
};
