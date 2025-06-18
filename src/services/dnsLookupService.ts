
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
  
  let spfData: DomainResult['spf'] = {
    record: null,
    valid: false,
    includes: [],
    redirects: [],
    mechanisms: [],
    errors: [],
    nestedLookups: {},
    lookupCount: 0,
    exceedsLookupLimit: false
  };

  // 1. Query SPF record
  const spfRecord = await queryDnsRecord(domain, 'TXT');
  console.log(`🔍 SPF record found for ${domain}:`, spfRecord || 'None');
  
  if (spfRecord && spfRecord.includes('v=spf1')) {
    const parsedSpf = parseSPFRecord(spfRecord);
    
    console.log(`🔍 Counting total SPF lookups for ${domain}...`);
    // Pass a new Set for each domain lookup session to ensure independent visited tracking
    const lookupResult = await countTotalSPFLookups(spfRecord, domain, new Set(), 0);
    console.log(`📊 Total SPF lookups for ${domain}: ${lookupResult.totalLookups}`);
    
    spfData = {
      record: spfRecord,
      valid: true, // Assume valid unless errors are found during parsing/validation
      includes: parsedSpf.includes,
      redirects: parsedSpf.redirects,
      mechanisms: parsedSpf.mechanisms,
      errors: [], // Initialize empty, add specific errors below
      nestedLookups: lookupResult.nestedLookups,
      lookupCount: lookupResult.totalLookups,
      exceedsLookupLimit: lookupResult.totalLookups > 10
    };

    if (spfData.exceedsLookupLimit) {
        spfData.errors.push(`SPF record exceeds 10 DNS lookup limit (${spfData.lookupCount}). This may cause SPF authentication failures.`);
    }

  } else {
      spfData.errors.push('No SPF record found');
  }
  
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

  // 2. Query DMARC record
  const dmarcRecord = await queryDnsRecord(`_dmarc.${domain}`, 'TXT');
  console.log(`🔍 DMARC record found for ${domain}:`, dmarcRecord || 'None');

  if (dmarcRecord && dmarcRecord.includes('v=DMARC1')) {
    try {
        const parsedDmarc = await parseDMARCRecord(dmarcRecord, domain);
        dmarcData = {
            record: dmarcRecord,
            valid: true,
            policy: parsedDmarc.policy,
            subdomainPolicy: parsedDmarc.subdomainPolicy,
            percentage: parsedDmarc.percentage,
            adkim: parsedDmarc.adkim,
            aspf: parsedDmarc.aspf,
            fo: parsedDmarc.fo,
            rf: parsedDmarc.rf,
            ri: parsedDmarc.ri,
            reportingEmails: parsedDmarc.reportingEmails,
            ruaEmails: parsedDmarc.ruaEmails,
            rufEmails: parsedDmarc.rufEmails,
            errors: [], // Initialize empty, parsing errors from dmarcParser already in warnings/errors
            warnings: parsedDmarc.warnings
        };
        // Add additional DMARC validation logic here if needed, setting dmarcData.valid to false
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

  // 3. Query BIMI record
  const bimiRecord = await queryDnsRecord(`default._bimi.${domain}`, 'TXT');
  console.log(`🔍 BIMI record found for ${domain}:`, bimiRecord || 'None');
  
  if (bimiRecord && bimiRecord.includes('v=BIMI1')) {
    try {
        const parsedBimi = parseBIMIRecord(bimiRecord);
        bimiData = {
            record: bimiRecord,
            valid: true, // Assume valid unless errors are found during parsing/validation
            logoUrl: parsedBimi.logoUrl,
            certificateUrl: parsedBimi.certificateUrl,
            certificateExpiry: parsedBimi.certificateExpiry,
            errors: [] // Initialize empty, add specific errors below
        };

        if (!bimiData.certificateUrl) {
            bimiData.errors.push('No certificate present. BIMI logo may not display for some providers like Gmail without a Verified Mark Certificate (VMC).');
        } else if (bimiData.certificateExpiry && new Date(bimiData.certificateExpiry) < new Date()) {
            bimiData.errors.push(`BIMI certificate expired on ${bimiData.certificateExpiry}.`);
        }
        // Add additional BIMI validation logic here if needed, setting bimiData.valid to false
    } catch (e) {
        bimiData.errors.push(`Failed to parse BIMI record: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else {
      bimiData.errors.push('No BIMI record found');
  }
  
  console.log(`✅ DNS lookup completed for: ${domain}`);
  console.log('SPF:', spfData.record ? '✓' : '✗', spfData.errors.length > 0 ? `(${spfData.errors.length} errors)` : '');
  console.log('DMARC:', dmarcData.record ? '✓' : '✗', dmarcData.errors.length > 0 ? `(${dmarcData.errors.length} errors)` : '');
  console.log('BIMI:', bimiData.record ? '✓' : '✗', bimiData.errors.length > 0 ? `(${bimiData.errors.length} errors)` : '');
  
  // Determine overall status based on record presence and validity
  let overallStatus: 'completed' | 'error' = 'completed';
  if (!spfData.record && !dmarcData.record && !bimiData.record) {
    overallStatus = 'completed'; // No records found, but still a completed analysis
  } else if (spfData.errors.length > 0 || dmarcData.errors.length > 0 || bimiData.errors.length > 0) {
    overallStatus = 'error'; // At least one record had an error or was missing when expected
  }

  return {
    domain,
    spf: spfData,
    dmarc: dmarcData,
    bimi: bimiData,
    websiteLogo: null, // This is not implemented in the provided code, so it remains null
    status: overallStatus
  };
};

// Keep the old function for backward compatibility
export const simulateDnsLookup = performActualDnsLookup;
