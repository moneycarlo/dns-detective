import { DomainResult, LookupType } from '@/types/domain';
import { queryDns } from './dnsQuery';
import { parseSPFRecord, countTotalSPFLookups } from './spfParser';
import { parseDMARCRecord } from './dmarcParser';
import { parseBIMIRecord } from './bimiParser';

// Main function to perform all lookups for a domain
export const performActualDnsLookup = async (domain: string, lookupType: LookupType): Promise<DomainResult> => {
  // Initialize a result object
  const result: DomainResult = {
    id: crypto.randomUUID(),
    lookupType,
    domain,
    spf: { record: null, valid: false, includes: [], redirects: [], mechanisms: [], errors: [], nestedLookups: {}, lookupCount: 0, exceedsLookupLimit: false, lookupDetails: [] },
    dmarc: { record: null, valid: false, policy: '', subdomainPolicy: '', percentage: 100, adkim: 'r', aspf: 'r', fo: '0', rf: 'afrf', ri: '86400', reportingEmails: [], ruaEmails: [], rufEmails: [], errors: [], warnings: [] },
    bimi: { record: null, valid: false, logoUrl: null, certificateUrl: null, certificateExpiry: null, certificateAuthority: null, errors: [] },
    websiteLogo: `https://logo.clearbit.com/${domain}`,
    status: 'completed'
  };

  // SPF Lookup
  if (lookupType === 'ALL' || lookupType === 'SPF') {
    try {
      const response = await queryDns(domain, 'TXT');
      const spfRecord = response.Answer?.find(a => a.data.includes('v=spf1'))?.data.replace(/"/g, '');
      
      if (spfRecord) {
        result.spf.record = spfRecord;
        const lookupData = await countTotalSPFLookups(spfRecord, domain);
        const parsedSpf = parseSPFRecord(spfRecord);
        
        result.spf.includes = parsedSpf.includes;
        result.spf.redirects = parsedSpf.redirects;
        result.spf.mechanisms = parsedSpf.mechanisms;
        result.spf.lookupCount = lookupData.lookupCount;
        result.spf.lookupDetails = lookupData.lookupDetails;
        result.spf.nestedLookups = lookupData.nestedLookups;
        result.spf.exceedsLookupLimit = lookupData.lookupCount > 10;
        result.spf.valid = !result.spf.exceedsLookupLimit;

        if (result.spf.exceedsLookupLimit) {
          result.spf.errors.push(`Exceeds 10 DNS lookup limit (${result.spf.lookupCount})`);
        }
      } else {
        result.spf.errors.push('No SPF record found.');
      }
    } catch (e) {
      result.spf.errors.push(e instanceof Error ? e.message : 'Failed to query/parse SPF record.');
    }
  }

  // DMARC and BIMI lookups remain unchanged...
  // DMARC Lookup
  if (lookupType === 'ALL' || lookupType === 'DMARC') {
     try {
      const response = await queryDns(`_dmarc.${domain}`, 'TXT');
      const dmarcRecord = response.Answer?.find(a => a.data.includes('v=DMARC1'))?.data.replace(/"/g, '');
      if (dmarcRecord) {
        result.dmarc.record = dmarcRecord;
        const parsed = await parseDMARCRecord(dmarcRecord, domain);
        Object.assign(result.dmarc, parsed);
        result.dmarc.valid = parsed.errors.length === 0;
      } else {
        result.dmarc.errors.push('No DMARC record found.');
      }
    } catch (e) {
      result.dmarc.errors.push(e instanceof Error ? e.message : 'Failed to query/parse DMARC record.');
    }
  }

  // BIMI Lookup
  if (lookupType === 'ALL' || lookupType === 'BIMI') {
    try {
      const response = await queryDns(`default._bimi.${domain}`, 'TXT');
      const bimiRecord = response.Answer?.find(a => a.data.includes('v=BIMI1'))?.data.replace(/"/g, '');
      if (bimiRecord) {
        result.bimi.record = bimiRecord;
        const parsed = await parseBIMIRecord(bimiRecord);
        Object.assign(result.bimi, parsed);
        result.bimi.valid = parsed.errors.length === 0;
      } else {
        result.bimi.errors.push('No BIMI record found.');
      }
    } catch (e) {
       result.bimi.errors.push(e instanceof Error ? e.message : 'Failed to query/parse BIMI record.');
    }
  }

  return result;
};


export const performDnsLookup = async (domainList: string[], lookupType: LookupType): Promise<DomainResult[]> => {
  return domainList.map(domain => ({
    id: crypto.randomUUID(),
    lookupType,
    domain,
    spf: { record: null, valid: false, includes: [], redirects: [], mechanisms: [], errors: [], nestedLookups: {}, lookupCount: 0, exceedsLookupLimit: false, lookupDetails: [] },
    dmarc: { record: null, valid: false, policy: '', subdomainPolicy: '', percentage: 100, adkim: 'r', aspf: 'r', fo: '0', rf: 'afrf', ri: '86400', reportingEmails: [], ruaEmails: [], rufEmails: [], errors: [], warnings: [] },
    bimi: { record: null, valid: false, logoUrl: null, certificateUrl: null, certificateExpiry: null, certificateAuthority: null, errors: [] },
    websiteLogo: null,
    status: 'pending'
  }));
};
