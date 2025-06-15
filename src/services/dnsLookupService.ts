import { DomainResult } from '@/types/domain';

// Cloudflare DNS over HTTPS API
const DNS_API_BASE = 'https://cloudflare-dns.com/dns-query';

interface DnsResponse {
  Status: number;
  Answer?: Array<{
    name: string;
    type: number;
    data: string;
  }>;
}

const queryDnsRecord = async (domain: string, recordType: string): Promise<string | null> => {
  try {
    const response = await fetch(`${DNS_API_BASE}?name=${domain}&type=${recordType}`, {
      headers: {
        'Accept': 'application/dns-json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status}`);
    }
    
    const data: DnsResponse = await response.json();
    
    if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
      return null;
    }
    
    // For TXT records, we need to find the specific record we're looking for
    if (recordType === 'TXT') {
      // For SPF records on the main domain, look for v=spf1
      if (!domain.startsWith('_dmarc.') && !domain.startsWith('default._bimi.')) {
        const spfRecord = data.Answer.find(record => 
          record.data.replace(/"/g, '').includes('v=spf1')
        );
        if (spfRecord) {
          return spfRecord.data.replace(/"/g, '');
        }
      }
      
      // For DMARC records, look for v=DMARC1
      if (domain.startsWith('_dmarc.')) {
        const dmarcRecord = data.Answer.find(record => 
          record.data.replace(/"/g, '').includes('v=DMARC1')
        );
        if (dmarcRecord) {
          return dmarcRecord.data.replace(/"/g, '');
        }
      }
      
      // For BIMI records, look for v=BIMI1
      if (domain.startsWith('default._bimi.')) {
        const bimiRecord = data.Answer.find(record => 
          record.data.replace(/"/g, '').includes('v=BIMI1')
        );
        if (bimiRecord) {
          return bimiRecord.data.replace(/"/g, '');
        }
      }
      
      return null;
    }
    
    // For other record types, return the first record
    return data.Answer[0].data.replace(/"/g, '');
  } catch (error) {
    console.error(`DNS query error for ${domain} (${recordType}):`, error);
    return null;
  }
};

const parseSPFRecord = (record: string) => {
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
    }
    mechanisms.push(part);
  }
  
  return {
    mechanisms,
    includes,
    redirects,
    lookupCount,
    exceedsLookupLimit: lookupCount > 10
  };
};

const parseDMARCRecord = (record: string) => {
  const pairs = record.split(';').map(pair => pair.trim());
  let policy = '';
  let subdomainPolicy = '';
  let percentage = 100;
  const reportingEmails: string[] = [];
  
  for (const pair of pairs) {
    if (pair.startsWith('p=')) {
      policy = pair.substring(2);
    } else if (pair.startsWith('sp=')) {
      subdomainPolicy = pair.substring(3);
    } else if (pair.startsWith('pct=')) {
      percentage = parseInt(pair.substring(4)) || 100;
    } else if (pair.startsWith('rua=') || pair.startsWith('ruf=')) {
      const emails = pair.substring(4).split(',').map(email => 
        email.replace('mailto:', '').trim()
      );
      reportingEmails.push(...emails);
    }
  }
  
  return {
    policy,
    subdomainPolicy,
    percentage,
    reportingEmails: [...new Set(reportingEmails)] // Remove duplicates
  };
};

const parseBIMIRecord = (record: string) => {
  const pairs = record.split(';').map(pair => pair.trim());
  let logoUrl: string | null = null;
  let certificateUrl: string | null = null;
  
  for (const pair of pairs) {
    if (pair.startsWith('l=')) {
      logoUrl = pair.substring(2);
    } else if (pair.startsWith('a=')) {
      certificateUrl = pair.substring(2);
    }
  }
  
  return {
    logoUrl,
    certificateUrl,
    certificateExpiry: certificateUrl ? '2025-12-31' : null // Mock expiry for now
  };
};

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
      reportingEmails: [],
      errors: []
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
    spfData = {
      record: spfRecord,
      valid: true,
      includes: parsed.includes,
      redirects: parsed.redirects,
      mechanisms: parsed.mechanisms,
      errors: [],
      nestedLookups: {},
      lookupCount: parsed.lookupCount,
      exceedsLookupLimit: parsed.exceedsLookupLimit
    };
    
    // Query nested includes for demonstration
    for (const include of parsed.includes.slice(0, 3)) { // Limit to 3 to avoid too many requests
      const nestedRecord = await queryDnsRecord(include, 'TXT');
      if (nestedRecord && nestedRecord.includes('v=spf1')) {
        spfData.nestedLookups[include] = nestedRecord;
      }
    }
  }
  
  // Query DMARC record
  const dmarcRecord = await queryDnsRecord(`_dmarc.${domain}`, 'TXT');
  let dmarcData = {
    record: null as string | null,
    valid: false,
    policy: '',
    subdomainPolicy: '',
    percentage: 0,
    reportingEmails: [] as string[],
    errors: [] as string[]
  };
  
  if (dmarcRecord && dmarcRecord.includes('v=DMARC1')) {
    const parsed = parseDMARCRecord(dmarcRecord);
    dmarcData = {
      record: dmarcRecord,
      valid: true,
      policy: parsed.policy,
      subdomainPolicy: parsed.subdomainPolicy,
      percentage: parsed.percentage,
      reportingEmails: parsed.reportingEmails,
      errors: []
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
