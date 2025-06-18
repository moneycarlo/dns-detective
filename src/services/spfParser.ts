
import { queryDnsRecord } from './dnsQuery';

export interface SPFParseResult {
  mechanisms: string[];
  includes: string[];
  redirects: string[];
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
    exceedsLookupLimit: lookupCount > 10,
    nestedLookups: {},
    lookupDetails: []
  };
};

// Global counter for sequential numbering across all recursive calls
let globalLookupCounter = 0;

// Recursive function to count and track all SPF lookups with proper sequential numbering
export const countTotalSPFLookups = async (
  record: string, 
  visited: Set<string> = new Set(),
  indent: number = 0
): Promise<{ totalLookups: number; lookupDetails: LookupDetail[]; nestedLookups: { [key: string]: string } }> => {
  
  // Reset global counter only for the initial call (indent 0)
  if (indent === 0) {
    globalLookupCounter = 0;
  }
  
  const lookupDetails: LookupDetail[] = [];
  const nestedLookups: { [key: string]: string } = {};
  const parts = record.split(/\s+/);
  
  for (const part of parts) {
    if (part.startsWith('include:')) {
      const includeDomain = part.substring(8);
      globalLookupCounter++;
      const currentLookupNumber = globalLookupCounter;
      
      const lookupDetail: LookupDetail = {
        number: currentLookupNumber,
        type: 'include',
        domain: includeDomain,
        indent: indent
      };
      
      // Avoid infinite recursion by tracking visited domains
      if (!visited.has(includeDomain)) {
        visited.add(includeDomain);
        
        try {
          console.log(`${'  '.repeat(indent)}🔍 Lookup #${currentLookupNumber}: include ${includeDomain}`);
          const nestedRecord = await queryDnsRecord(includeDomain, 'TXT');
          
          if (nestedRecord && nestedRecord.includes('v=spf1')) {
            lookupDetail.record = nestedRecord;
            nestedLookups[includeDomain] = nestedRecord;
            
            // Recursively process nested includes with increased indent
            const nestedResult = await countTotalSPFLookups(nestedRecord, visited, indent + 1);
            lookupDetail.nested = nestedResult.lookupDetails;
            
            // Merge nested lookups
            Object.assign(nestedLookups, nestedResult.nestedLookups);
          }
        } catch (error) {
          console.error(`${'  '.repeat(indent)}❌ Error fetching nested SPF for ${includeDomain}:`, error);
        }
      }
      
      lookupDetails.push(lookupDetail);
      
    } else if (part.startsWith('redirect=')) {
      const redirectDomain = part.substring(9);
      globalLookupCounter++;
      const currentLookupNumber = globalLookupCounter;
      
      const lookupDetail: LookupDetail = {
        number: currentLookupNumber,
        type: 'redirect',
        domain: redirectDomain,
        indent: indent
      };
      
      if (!visited.has(redirectDomain)) {
        visited.add(redirectDomain);
        
        try {
          console.log(`${'  '.repeat(indent)}🔍 Lookup #${currentLookupNumber}: redirect ${redirectDomain}`);
          const redirectRecord = await queryDnsRecord(redirectDomain, 'TXT');
          
          if (redirectRecord && redirectRecord.includes('v=spf1')) {
            lookupDetail.record = redirectRecord;
            nestedLookups[redirectDomain] = redirectRecord;
            
            // Recursively process redirect with increased indent
            const nestedResult = await countTotalSPFLookups(redirectRecord, visited, indent + 1);
            lookupDetail.nested = nestedResult.lookupDetails;
            
            // Merge nested lookups
            Object.assign(nestedLookups, nestedResult.nestedLookups);
          }
        } catch (error) {
          console.error(`${'  '.repeat(indent)}❌ Error fetching redirect SPF for ${redirectDomain}:`, error);
        }
      }
      
      lookupDetails.push(lookupDetail);
      
    } else if (part.match(/^[+\-~?]?(a|mx|ptr|exists):/)) {
      globalLookupCounter++;
      const currentLookupNumber = globalLookupCounter;
      const mechanism = part.match(/^[+\-~?]?(a|mx|ptr|exists):/);
      const domain = part.split(':')[1];
      
      console.log(`${'  '.repeat(indent)}🔍 Lookup #${currentLookupNumber}: ${mechanism![1]} ${domain}`);
      
      lookupDetails.push({
        number: currentLookupNumber,
        type: mechanism![1] as 'a' | 'mx' | 'ptr' | 'exists',
        domain: domain,
        indent: indent
      });
      
    } else if (part.match(/^[+\-~?]?(a|mx)$/)) {
      globalLookupCounter++;
      const currentLookupNumber = globalLookupCounter;
      const mechanism = part.match(/^[+\-~?]?(a|mx)$/);
      
      console.log(`${'  '.repeat(indent)}🔍 Lookup #${currentLookupNumber}: ${mechanism![1]} (current domain)`);
      
      lookupDetails.push({
        number: currentLookupNumber,
        type: mechanism![1] as 'a' | 'mx',
        domain: 'current domain',
        indent: indent
      });
    }
  }
  
  // Return the final global counter only from the top-level call
  return {
    totalLookups: globalLookupCounter,
    lookupDetails,
    nestedLookups
  };
};
