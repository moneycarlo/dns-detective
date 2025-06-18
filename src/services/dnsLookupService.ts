import { DomainResult } from '@/types/domain';
import { queryDns } from './dnsQuery';
import { parseSPFRecord, countTotalSPFLookups } from './spfParser';
import { parseDMARCRecord } from './dmarcParser';
import { parseBIMIRecord } from './bimiParser';

export const performDnsLookup = async (domainList: string[]): Promise<DomainResult[]> => {
  return domainList.map(domain => ({
    domain,
    spf: { record: null, valid: false, includes: [], redirects: [], mechanisms: [], errors: [], nestedLookups: {}, lookupCount: 0, exceedsLookupLimit: false, lookupDetails: [] },
    dmarc: { record: null, valid: false, policy: '', subdomainPolicy: '', percentage: 0, adkim: 'r', aspf: 'r', fo: '0', rf: 'afrf', ri: '86400', reportingEmails: [], ruaEmails: [], rufEmails: [], errors: [], warnings: [] },
    bimi: { record: null, valid: false, logoUrl: null, certificateUrl: null, certificateExpiry: null, errors: [] },
    websiteLogo: null,
    status: 'pending'
  }));
};

export const performActualDnsLookup = async (domain: string): Promise<DomainResult> => {
  const result: DomainResult = {
    domain,
    spf: { record: null, valid: false, includes: [], redirects: [], mechanisms: [], errors: [], nestedLookups: {}, lookupCount: 0, exceedsLookupLimit: false, lookupDetails: [] },
    dmarc: { record: null, valid: false, policy: '', subdomainPolicy: '', percentage: 0, adkim: 'r', aspf: 'r', fo: '0', rf: 'afrf', ri: '86400', reportingEmails: [], ruaEmails: [], rufEmails: [], errors: [], warnings: [] },
    bimi: { record: null, valid: false, logoUrl: null, certificateUrl: null, certificateExpiry: null, errors: [] },
    websiteLogo: `https://logo.clearbit.com/${domain}`,
    status: 'completed'
  };

  // SPF
  try {
    const spfResponse = await queryDns(domain, 'TXT');
    const spfRecord = spfResponse.Answer?.find(a => a.data.includes('v=spf1'))?.data.replace(/"/g, '');
    if (spfRecord) {
      result.spf.record = spfRecord;
      const parsedSpf = parseSPFRecord(spfRecord);
      result.spf.includes = parsedSpf.includes;
      result.spf.redirects = parsedSpf.redirects;
      result.spf.mechanisms = parsedSpf.mechanisms;

      const lookupData = await countTotalSPFLookups(spfRecord, domain);
      result.spf.lookupCount = lookupData.totalLookups;
      result.spf.lookupDetails = lookupData.lookupDetails;
      result.spf.nestedLookups = lookupData.nestedLookups;
      result.spf.exceedsLookupLimit = lookupData.totalLookups > 10;
      if (result.spf.exceedsLookupLimit) {
        result.spf.errors.push(`Exceeds 10 DNS lookup limit (${result.spf.lookupCount})`);
      }
      result.spf.valid = !result.spf.exceedsLookupLimit;
    } else {
      result.spf.errors.push('No SPF record found');
    }
  } catch (e) {
    result.spf.errors.push(e instanceof Error ? e.message : 'Failed to query SPF record');
  }

  // DMARC
  try {
    const dmarcResponse = await queryDns(`_dmarc.${domain}`, 'TXT');
    const dmarcRecord = dmarcResponse.Answer?.find(a => a.data.includes('v=DMARC1'))?.data.replace(/"/g, '');
    if (dmarcRecord) {
      result.dmarc.record = dmarcRecord;
      const parsedDmarc = await parseDMARCRecord(dmarcRecord, domain);
      Object.assign(result.dmarc, parsedDmarc);
      result.dmarc.valid = true;
    } else {
      result.dmarc.errors.push('No DMARC record found');
    }
  } catch (e) {
    result.dmarc.errors.push(e instanceof Error ? e.message : 'Failed to query DMARC record');
  }
  
  // BIMI
  try {
    const bimiResponse = await queryDns(`default._bimi.${domain}`, 'TXT');
    const bimiRecord = bimiResponse.Answer?.find(a => a.data.includes('v=BIMI1'))?.data.replace(/"/g, '');
    if (bimiRecord) {
      result.bimi.record = bimiRecord;
      const parsedBimi = parseBIMIRecord(bimiRecord);
      Object.assign(result.bimi, parsedBimi);
      result.bimi.valid = true;
    } else {
      result.bimi.errors.push('No BIMI record found');
    }
  } catch(e) {
     result.bimi.errors.push(e instanceof Error ? e.message : 'Failed to query BIMI record');
  }
  
  return result;
};

export const simulateDnsLookup = performActualDnsLookup;
