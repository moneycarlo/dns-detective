import { queryDnsRecord } from './dnsQuery';
import { LookupDetail } from '../types/domain';

export interface SPFParseResult {
  mechanisms: string[];
  includes: string[];
  redirects: string[];
  lookupCount: number;
  exceedsLookupLimit: boolean;
  nestedLookups: { [key: string]: string };
  lookupDetails: LookupDetail[];
}

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

export const countTotalSPFLookups = async (
  record: string,
  domain: string,
  visited: Set<string> = new Set(),
  indent: number = 0,
  counter: { current: number } = { current: 0 }
): Promise<{ lookupDetails: LookupDetail[]; nestedLookups: { [key: string]: string } }> => {
  if (indent === 0) {
    counter.current = 0;
  }

  const lookupDetails: LookupDetail[] = [];
  const nestedLookups: { [key: string]: string } = {};
  
  if (visited.has(domain)) {
    console.log(`${'  '.repeat(indent)}⚠️ Skipping already visited domain: ${domain}`);
    return { lookupDetails, nestedLookups };
  }
  visited.add(domain);

  const parts = record.split(/\s+/);

  for (const part of parts) {
    let isLookupMechanism = false;
    let lookupType: 'include' | 'redirect' | 'a' | 'mx' | 'ptr' | 'exists' | null = null;
    let lookupDomain: string | null = null;

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
      lookupDomain = mechanismMatch[2] || domain;
    }

    if (isLookupMechanism && lookupType && lookupDomain) {
      counter.current++;
      const currentLookupNumber = counter.current;

      const detail: LookupDetail = {
        number: currentLookupNumber,
        type: lookupType,
        domain: lookupDomain,
        indent: indent,
        nested: [],
      };

      if ((lookupType === 'include' || lookupType === 'redirect')) {
          const fetchedRecord = await queryDnsRecord(lookupDomain, 'TXT');
          detail.record = fetchedRecord || 'No TXT record found';

          if (fetchedRecord && fetchedRecord.includes('v=spf1')) {
            nestedLookups[lookupDomain] = fetchedRecord;
            const nestedResult = await countTotalSPFLookups(fetchedRecord, lookupDomain, new Set(visited), indent + 1, counter);
            detail.nested = nestedResult.lookupDetails;
            Object.assign(nestedLookups, nestedResult.nestedLookups);
          }
      }
      lookupDetails.push(detail);
    }
  }

  return { lookupDetails, nestedLookups };
};
