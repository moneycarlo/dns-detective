import { queryDns } from './dnsQuery';
import { LookupDetail } from '../types/domain';

export const countTotalSPFLookups = async (
  initialRecord: string,
  initialDomain: string
): Promise<{ lookupDetails: LookupDetail[]; nestedLookups: { [key: string]: string }; lookupCount: number }> => {
  const lookupDetails: LookupDetail[] = [];
  const nestedLookups: { [key: string]: string } = {};
  let lookupCount = 0;

  const queue: { record: string; domain: string; indent: number, parentDetails: LookupDetail[] }[] = 
    [{ record: initialRecord, domain: initialDomain, indent: 0, parentDetails: lookupDetails }];
  
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { record, domain, indent, parentDetails } = queue.shift()!;

    if (visited.has(domain)) continue;
    visited.add(domain);

    const parts = record.split(/\s+/);

    for (const part of parts) {
      let lookupType: 'include' | 'redirect' | 'a' | 'mx' | 'ptr' | 'exists' | null = null;
      let lookupDomain: string | null = null;

      const includeMatch = part.match(/^include:(.+)$/);
      const redirectMatch = part.match(/^redirect=(.+)$/);
      const mechanismMatch = part.match(/^[+\-~?]?(a|mx|ptr|exists)(?::([^ ]+))?$/);

      if (includeMatch) {
        lookupType = 'include';
        lookupDomain = includeMatch[1];
      } else if (redirectMatch) {
        lookupType = 'redirect';
        lookupDomain = redirectMatch[1];
      } else if (mechanismMatch) {
        lookupType = mechanismMatch[1] as 'a' | 'mx' | 'ptr' | 'exists';
        lookupDomain = mechanismMatch[2] || domain;
      }

      if (lookupType && lookupDomain) {
        lookupCount++;
        const currentDetail: LookupDetail = {
          number: lookupCount,
          type: lookupType,
          domain: lookupDomain,
          indent,
          nested: [],
        };
        parentDetails.push(currentDetail);

        if (lookupCount >= 10) continue;

        if (lookupType === 'include' || lookupType === 'redirect') {
          try {
            const response = await queryDns(lookupDomain, 'TXT');
            const fetchedRecord = response.Answer?.find(a => a.data.includes('v=spf1'))?.data.replace(/"/g, '');

            if (fetchedRecord) {
              currentDetail.record = fetchedRecord;
              nestedLookups[lookupDomain] = fetchedRecord;
              queue.push({ record: fetchedRecord, domain: lookupDomain, indent: indent + 1, parentDetails: currentDetail.nested! });
            } else {
              currentDetail.record = 'No valid SPF record found';
            }
          } catch (error) {
            currentDetail.record = `Error: ${error instanceof Error ? error.message : 'Unknown'}`;
          }
        }
      }
    }
  }

  return { lookupDetails, nestedLookups, lookupCount };
};

export const parseSPFRecord = (record: string) => {
    const mechanisms = record.split(/\s+/);
    const includes = mechanisms.filter(p => p.startsWith('include:')).map(p => p.substring(8));
    const redirects = mechanisms.filter(p => p.startsWith('redirect=')).map(p => p.substring(9));
    return { mechanisms, includes, redirects };
};
