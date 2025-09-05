import { DomainResult, LookupType } from '@/types/domain';
import { queryDns } from './dnsQuery';
import { parseSPFRecord, countTotalSPFLookups } from './spfParser';
import { parseDMARCRecord } from './dmarcParser';
import { parseBIMIRecord } from './bimiParser';

export const performActualDnsLookup = async (domain: string, lookupType: LookupType): Promise<DomainResult> => {
  const result: DomainResult = {
    id: crypto.randomUUID(), lookupType, domain, status: 'completed',
    spf: { record: null, valid: false, includes: [], redirects: [], mechanisms: [], errors: [], nestedLookups: {}, lookupCount: 0, directLookupCount: 0, nestedLookupCount: 0, exceedsLookupLimit: false, lookupDetails: [], isCnameInherited: false },
    dmarc: { record: null, valid: false, policy: '', subdomainPolicy: '', percentage: 100, adkim: 'r', aspf: 'r', fo: '0', rf: 'afrf', ri: '86400', reportingEmails: [], ruaEmails: [], rufEmails: [], errors: [], warnings: [] },
    bimi: { record: null, valid: false, logoUrl: null, certificateUrl: null, certificateExpiry: null, certificateIssueDate: null, certificateAuthority: null, certificateIssuer: null, errors: [] },
    mx: { records: [], errors: [] },
    websiteLogo: `https://logo.clearbit.com/${domain}`,
  };

  // Check for CNAME record first
  let isCname = false;
  let cnameTarget = '';
  try {
    const cnameResponse = await queryDns(domain, 'CNAME');
    if (cnameResponse.Answer && cnameResponse.Answer.length > 0) {
      isCname = true;
      cnameTarget = cnameResponse.Answer[0].data;
      result.spf.isCnameInherited = true;
      
      // Check for conflicting TXT records
      try {
        const txtResponse = await queryDns(domain, 'TXT');
        if (txtResponse.Answer && txtResponse.Answer.length > 0) {
          result.spf.errors.push('⚠️ CNAME conflict: TXT records found alongside CNAME. This violates DNS standards.');
          result.dmarc.errors.push('⚠️ CNAME conflict: TXT records found alongside CNAME. This violates DNS standards.');
          result.bimi.errors.push('⚠️ CNAME conflict: TXT records found alongside CNAME. This violates DNS standards.');
        }
      } catch (e) {
        // TXT query failed, which is expected if CNAME is properly configured
      }
    }
  } catch (e) {
    // No CNAME record found, continue with normal processing
  }

  if (lookupType === 'SPF' || lookupType === 'CNAME') {
    try {
      // Check for deprecated SPF record type first
      try {
        const spfTypeResponse = await queryDns(domain, 'SPF');
        if (spfTypeResponse.Answer && spfTypeResponse.Answer.length > 0) {
          result.spf.errors.push('🚨 DEPRECATED: SPF record type found. Use TXT records instead. SPF record type is obsolete (RFC 7208).');
        }
      } catch (e) {
        // No SPF record type found, which is good
      }

      let queryDomain = domain;
      if (isCname && cnameTarget) {
        queryDomain = cnameTarget;
      }

      const response = await queryDns(queryDomain, 'TXT');
      const spfRecord = response.Answer?.find(a => a.data.includes('v=spf1'))?.data.replace(/"/g, '');
      if (spfRecord) {
        result.spf.record = spfRecord;
        const lookupData = await countTotalSPFLookups(spfRecord, queryDomain);
        const parsedSpf = parseSPFRecord(spfRecord);
        result.spf = { ...result.spf, ...parsedSpf, ...lookupData, lookupCount: lookupData.lookupCount };
        
        // Calculate direct vs nested lookups
        result.spf.directLookupCount = lookupData.lookupDetails.filter(detail => detail.indent === 0).length;
        result.spf.nestedLookupCount = lookupData.lookupCount - result.spf.directLookupCount;
        
        result.spf.exceedsLookupLimit = lookupData.lookupCount > 10;
        result.spf.valid = !result.spf.exceedsLookupLimit;
        if (result.spf.exceedsLookupLimit) {
          result.spf.errors.push(`Exceeds 10 DNS lookup limit (${result.spf.lookupCount}).`);
        }
      } else if (!isCname) { 
        result.spf.errors.push('No SPF record found.'); 
      }
    } catch (e) { 
      if (!isCname) {
        result.spf.errors.push(e instanceof Error ? e.message : 'Failed to query/parse SPF record.'); 
      }
    }
  }

  if (lookupType === 'DMARC' || lookupType === 'CNAME') {
     try {
      const response = await queryDns(`_dmarc.${domain}`, 'TXT');
      const dmarcRecord = response.Answer?.find(a => a.data.includes('v=DMARC1'))?.data.replace(/"/g, '');
      if (dmarcRecord && !isCname) {
        result.dmarc.record = dmarcRecord;
        const parsed = await parseDMARCRecord(dmarcRecord, domain);
        result.dmarc = { ...result.dmarc, ...parsed, valid: parsed.errors.length === 0 };
      } else if (!isCname) { 
        result.dmarc.errors.push('No DMARC record found.'); 
      }
    } catch (e) { 
      if (!isCname) {
        result.dmarc.errors.push(e instanceof Error ? e.message : 'Failed to query/parse DMARC record.'); 
      }
    }
  }

  if (lookupType === 'BIMI' || lookupType === 'CNAME') {
    try {
      const response = await queryDns(`default._bimi.${domain}`, 'TXT');
      const bimiRecord = response.Answer?.find(a => a.data.includes('v=BIMI1'))?.data.replace(/"/g, '');
      if (bimiRecord && !isCname) {
        result.bimi.record = bimiRecord;
        const parsed = await parseBIMIRecord(bimiRecord);
        result.bimi = { ...result.bimi, ...parsed, valid: parsed.errors.length === 0 };
      } else if (!isCname) { 
        result.bimi.errors.push('No BIMI record found.'); 
      }
    } catch (e) { 
      if (!isCname) {
        result.bimi.errors.push(e instanceof Error ? e.message : 'Failed to query/parse BIMI record.'); 
      }
    }
  }

  if (lookupType === 'MX') {
    try {
      const response = await queryDns(domain, 'MX');
      if (response.Answer && response.Answer.length > 0) {
        result.mx.records = response.Answer.map(record => {
          const parts = record.data.split(' ');
          return {
            priority: parseInt(parts[0]),
            exchange: parts[1]
          };
        }).sort((a, b) => a.priority - b.priority);
      } else {
        result.mx.errors.push('No MX records found.');
      }
    } catch (e) {
      result.mx.errors.push(e instanceof Error ? e.message : 'Failed to query MX records.');
    }
  }

  return result;
};

export const performDnsLookup = async (domainList: string[], lookupType: LookupType): Promise<DomainResult[]> => {
  return domainList.map(domain => ({
    id: crypto.randomUUID(), lookupType, domain, status: 'pending',
    spf: { record: null, valid: false, includes: [], redirects: [], mechanisms: [], errors: [], nestedLookups: {}, lookupCount: 0, directLookupCount: 0, nestedLookupCount: 0, exceedsLookupLimit: false, lookupDetails: [], isCnameInherited: false },
    dmarc: { record: null, valid: false, policy: '', subdomainPolicy: '', percentage: 100, adkim: 'r', aspf: 'r', fo: '0', rf: 'afrf', ri: '86400', reportingEmails: [], ruaEmails: [], rufEmails: [], errors: [], warnings: [] },
    bimi: { record: null, valid: false, logoUrl: null, certificateUrl: null, certificateExpiry: null, certificateIssueDate: null, certificateAuthority: null, certificateIssuer: null, errors: [] },
    mx: { records: [], errors: [] },
    websiteLogo: null,
  }));
};
