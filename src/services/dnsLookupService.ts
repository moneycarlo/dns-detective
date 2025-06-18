import { DomainResult } from '@/types/domain';
import { queryDnsRecord } from './dnsQuery';
import { parseSPFRecord, countTotalSPFLookups } from './spfParser';
import { parseDMARCRecord } from './dmarcParser';
import { parseBIMIRecord } from './bimiParser';

export const performDnsLookup = async (domainList: string[]): Promise<DomainResult[]> => {
  // Initialize results with pending status
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
      exceedsLookupLimit: false
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
  
  // Query SPF record
  const spfRecord = await queryDnsRecord(domain, 'TXT');
  let spfData = {
    record: null as string | null,
    valid: false,
    includes: [] as string[],
    redirects: [] as string[],
    mechanisms: [] as string[],
    errors: [] as string[],
    nestedLookups: {} as { [key: string]: string },
    lookupCount: 0,
    exceedsLookupLimit: false
  };
  
  console.log(`🔍 SPF record found for ${domain}:`, spfRecord);
  
  if (spfRecord && spfRecord.includes('v=spf1')) {
    const parsed = parseSPFRecord(spfRecord);
    
    // Get accurate lookup count with recursive nested lookups
    console.log(`🔍 Counting total SPF lookups for ${domain}...`);
    const lookupResult = await countTotalSPFLookups(spfRecord);
    console.log(`📊 Total SPF lookups for ${domain}: ${lookupResult.totalLookups}`);
    
    spfData = {
      record: spfRecord,
      valid: true,
      includes: parsed.includes,
      redirects: parsed.redirects,
      mechanisms: parsed.mechanisms,
      errors: [],
      nestedLookups: lookupResult.nestedLookups,
      lookupCount: lookupResult.totalLookups, // Use the total count from the recursive function
      exceedsLookupLimit: lookupResult.totalLookups > 10
    };
    
    // Remove the duplicate nested lookup fetching since it's already done in countTotalSPFLookups
  }
  
  // Query DMARC record
  const dmarcRecord = await queryDnsRecord(`_dmarc.${domain}`, 'TXT');
  let dmarcData = {
    record: null as string | null,
    valid: false,
    policy: '',
    subdomainPolicy: '',
    percentage: 0,
    adkim: 'r',
    aspf: 'r',
    fo: '0',
    rf: 'afrf',
    ri: '86400',
    reportingEmails: [] as string[],
    ruaEmails: [] as string[],
    rufEmails: [] as string[],
    errors: [] as string[],
    warnings: [] as string[]
  };
  
  if (dmarcRecord && dmarcRecord.includes('v=DMARC1')) {
    const parsed = await parseDMARCRecord(dmarcRecord, domain);
    dmarcData = {
      record: dmarcRecord,
      valid: true,
      policy: parsed.policy,
      subdomainPolicy: parsed.subdomainPolicy,
      percentage: parsed.percentage,
      adkim: parsed.adkim,
      aspf: parsed.aspf,
      fo: parsed.fo,
      rf: parsed.rf,
      ri: parsed.ri,
      reportingEmails: parsed.reportingEmails,
      ruaEmails: parsed.ruaEmails,
      rufEmails: parsed.rufEmails,
      errors: [],
      warnings: parsed.warnings
    };
  }
  
  // Query BIMI record
  const bimiRecord = await queryDnsRecord(`default._bimi.${domain}`, 'TXT');
  let bimiData = {
    record: null as string | null,
    valid: false,
    logoUrl: null as string | null,
    certificateUrl: null as string | null,
    certificateExpiry: null as string | null,
    errors: [] as string[]
  };
  
  if (bimiRecord && bimiRecord.includes('v=BIMI1')) {
    const parsed = parseBIMIRecord(bimiRecord);
    bimiData = {
      record: bimiRecord,
      valid: true,
      logoUrl: parsed.logoUrl,
      certificateUrl: parsed.certificateUrl,
      certificateExpiry: parsed.certificateExpiry,
      errors: []
    };
  }
  
  console.log(`✅ DNS lookup completed for: ${domain}`);
  console.log('SPF:', spfData.record ? '✓' : '✗');
  console.log('DMARC:', dmarcData.record ? '✓' : '✗');
  console.log('BIMI:', bimiData.record ? '✓' : '✗');
  
  return {
    domain,
    spf: spfData,
    dmarc: dmarcData,
    bimi: bimiData,
    websiteLogo: null,
    status: 'completed' as const
  };
};

// Keep the old function for backward compatibility
export const simulateDnsLookup = performActualDnsLookup;
