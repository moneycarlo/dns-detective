
import { DomainResult } from '@/types/domain';
import { generateMockResult } from '@/utils/mockDataGenerator';

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

export const simulateDnsLookup = async (domain: string): Promise<DomainResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  return generateMockResult(domain);
};
