import { DomainResult } from '@/types/domain';
import { queryDnsRecord } from './dnsQuery';
import { parseSPFRecord, countTotalSPFLookups } from './spfParser';
import { parseDMARCRecord } from './dmarcParser';
import { parseBIMIRecord } from './bimiParser';

export const performDnsLookup = async (domainList: string[]): Promise<DomainResult[]> => {
  const initialResults: DomainResult[] = domainList.map(domain => ({
    domain,
    spf: {
      record: null,
      valid: false,
      includes: [],
      redirects: [],
      mechanisms: [],
      errors: [],
      nestedLookups: {},
      lookupCount: 0,
      exceedsLookupLimit: false,
      lookupDetails: [], // Added initialization
    },
    dmarc: {
      record: null,
      valid: false,
      policy: '',
      subdomainPolicy: '',
      percentage: 0,
      adkim: 'r',
      aspf: 'r',
      fo: '0',
      rf: 'afrf',
      ri: '86400',
      reportingEmails: [],
      ruaEmails: [],
      rufEmails: [],
      errors: [],
      warnings: []
    },
    bimi: {
      record: null,
      valid: false,
      logoUrl: null,
      certificateUrl: null,
      certificateExpiry: null,
      errors: []
    },
    websiteLogo: null,
    status: 'pending' as const
  }));

  return initialResults;
};

export const performActualDnsLookup = async (domain: string): Promise<DomainResult> => {
  console.log(`🔍 Starting DNS lookup for: ${domain}`);
  
  let spfData: DomainResult['spf'] = {
    record: null,
    valid: false,
    includes: [],
    redirects: [],
    mechanisms: [],
    errors: [],
    nestedLookups: {},
    lookupCount: 0,
    exceedsLookupLimit: false,
    lookupDetails: [], // Added initialization
  };

  // ... (The rest of the function remains the same as my previous correct version)
  // The important part is that spfData is correctly initialized now.
  const spfRecord = await queryDnsRecord(domain, 'TXT');
  if (spfRecord && spfRecord.includes('v=spf1')) {
    const parsedSpf = parseSPFRecord(spfRecord);
    const counter = { current: 0 };
    const { lookupDetails, nestedLookups } = await countTotalSPFLookups(spfRecord, domain, new Set(), 0, counter);
    const totalLookups = counter.current;

    spfData = {
      record: spfRecord,
      valid: totalLookups <= 10,
      includes: parsedSpf.includes,
      redirects: parsedSpf.redirects,
      mechanisms: parsedSpf.mechanisms,
      errors: [],
      nestedLookups,
      lookupCount: totalLookups,
      exceedsLookupLimit: totalLookups > 10,
      lookupDetails,
    };
    if (spfData.exceedsLookupLimit) {
      spfData.errors.push(`SPF record exceeds 10 DNS lookup limit (${spfData.lookupCount}).`);
    }
  } else {
    spfData.errors.push('No SPF record found');
  }

  // DMARC and BIMI logic follows...
  let dmarcData: DomainResult['dmarc'] = {
    record: null,
    valid: false,
    policy: '',
    subdomainPolicy: '',
    percentage: 0,
    adkim: 'r',
    aspf: 'r',
    fo: '0',
    rf: 'afrf',
    ri: '86400',
    reportingEmails: [],
    ruaEmails: [],
    rufEmails: [],
    errors: [],
    warnings: []
  };

  const dmarcRecord = await queryDnsRecord(`_dmarc.${domain}`, 'TXT');
  if (dmarcRecord && dmarcRecord.includes('v=DMARC1')) {
    try {
        const parsedDmarc = await parseDMARCRecord(dmarcRecord, domain);
        dmarcData = {
            record: dmarcRecord,
            valid: true,
            ...parsedDmarc,
            errors: [],
        };
    } catch (e) {
        dmarcData.errors.push(`Failed to parse DMARC record: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
      dmarcData.errors.push('No DMARC record found');
  }
  
  let bimiData: DomainResult['bimi'] = {
    record: null,
    valid: false,
    logoUrl: null,
    certificateUrl: null,
    certificateExpiry: null,
    errors: []
  };

  const bimiRecord = await queryDnsRecord(`default._bimi.${domain}`, 'TXT');
  if (bimiRecord && bimiRecord.includes('v=BIMI1')) {
    try {
        const parsedBimi = parseBIMIRecord(bimiRecord);
        bimiData = {
            record: bimiRecord,
            valid: true,
            ...parsedBimi,
            errors: [],
        };
        if (!bimiData.certificateUrl) {
            bimiData.errors.push('No certificate present. A Verified Mark Certificate (VMC) is required for providers like Gmail.');
        }
    } catch (e) {
        bimiData.errors.push(`Failed to parse BIMI record: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
      bimiData.errors.push('No BIMI record found');
  }

  const overallStatus = (spfData.errors.length > 0 || dmarcData.errors.length > 0 || bimiData.errors.length > 0) ? 'error' : 'completed';

  return {
    domain,
    spf: spfData,
    dmarc: dmarcData,
    bimi: bimiData,
    websiteLogo: null,
    status: overallStatus,
  };
};

export const simulateDnsLookup = performActualDnsLookup;
