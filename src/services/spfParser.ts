
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

// Recursive function to count and track all SPF lookups
export const countTotalSPFLookups = async (
  record: string, 
  visited: Set<string> = new Set(),
  lookupNumber: { current: number } = { current: 0 }
): Promise<{ totalLookups: number; lookupDetails: LookupDetail[]; nestedLookups: { [key: string]: string } }> => {
  const lookupDetails: LookupDetail[] = [];
  const nestedLookups: { [key: string]: string } = {};
  const parts = record.split(/\s+/);
  
  for (const part of parts) {
    if (part.startsWith('include:')) {
      const includeDomain = part.substring(8);
      lookupNumber.current++;
      const currentLookupNumber = lookupNumber.current;
      
      const lookupDetail: LookupDetail = {
        number: currentLookupNumber,
        type: 'include',
        domain: includeDomain
      };
      
      // Avoid infinite recursion by tracking visited domains
      if (!visited.has(includeDomain)) {
        visited.add(includeDomain);
        
        try {
          console.log(`🔍 Fetching nested SPF for ${includeDomain} (lookup #${currentLookupNumber})`);
          const nestedRecord = await queryDnsRecord(includeDomain, 'TXT');
          
          if (nestedRecord && nestedRecord.includes('v=spf1')) {
            lookupDetail.record = nestedRecord;
            nestedLookups[includeDomain] = nestedRecord;
            
            // Recursively process nested includes
            const nestedResult = await countTotalSPFLookups(nestedRecord, visited, lookupNumber);
            lookupDetail.nested = nestedResult.lookupDetails;
            
            // Merge nested lookups
            Object.assign(nestedLookups, nestedResult.nestedLookups);
          }
        } catch (error) {
          console.error(`❌ Error fetching nested SPF for ${includeDomain}:`, error);
        }
      }
      
      lookupDetails.push(lookupDetail);
      
    } else if (part.startsWith('redirect=')) {
      const redirectDomain = part.substring(9);
      lookupNumber.current++;
      
      const lookupDetail: LookupDetail = {
        number: lookupNumber.current,
        type: 'redirect',
        domain: redirectDomain
      };
      
      if (!visited.has(redirectDomain)) {
        visited.add(redirectDomain);
        
        try {
          const redirectRecord = await queryDnsRecord(redirectDomain, 'TXT');
          
          if (redirectRecord && redirectRecord.includes('v=spf1')) {
            lookupDetail.record = redirectRecord;
            nestedLookups[redirectDomain] = redirectRecord;
            
            // Recursively process redirect
            const nestedResult = await countTotalSPFLookups(redirectRecord, visited, lookupNumber);
            lookupDetail.nested = nestedResult.lookupDetails;
            
            // Merge nested lookups
            Object.assign(nestedLookups, nestedResult.nestedLookups);
          }
        } catch (error) {
          console.error(`❌ Error fetching redirect SPF for ${redirectDomain}:`, error);
        }
      }
      
      lookupDetails.push(lookupDetail);
      
    } else if (part.match(/^[+\-~?]?(a|mx|ptr|exists):/)) {
      lookupNumber.current++;
      const mechanism = part.match(/^[+\-~?]?(a|mx|ptr|exists):/);
      const domain = part.split(':')[1];
      
      lookupDetails.push({
        number: lookupNumber.current,
        type: mechanism![1] as 'a' | 'mx' | 'ptr' | 'exists',
        domain: domain
      });
      
    } else if (part.match(/^[+\-~?]?(a|mx)$/)) {
      lookupNumber.current++;
      const mechanism = part.match(/^[+\-~?]?(a|mx)$/);
      
      lookupDetails.push({
        number: lookupNumber.current,
        type: mechanism![1] as 'a' | 'mx',
        domain: 'current domain'
      });
    }
  }
  
  return {
    totalLookups: lookupNumber.current,
    lookupDetails,
    nestedLookups
  };
};
