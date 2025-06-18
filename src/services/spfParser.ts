import { queryDnsRecord } from './dnsQuery';
import { LookupDetail } from '../types/domain';

export interface SPFParseResult {
  mechanisms: string[];
  includes: string[];
  redirects: string[];
  // These are derived from countTotalSPFLookups, not directly parsed from the record string
  lookupCount: number;
  exceedsLookupLimit: boolean;
  nestedLookups: { [key: string]: string };
  lookupDetails: LookupDetail[];
}

/**
 * Parses the raw SPF record string to extract mechanisms, includes, and redirects.
 * This function does NOT count lookups; counting is handled by countTotalSPFLookups.
 */
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

/**
 * Recursively counts and tracks all DNS lookups required by an SPF record, including nested ones.
 * @param record The current SPF record string to analyze.
 * @param domain The domain associated with the current SPF record.
 * @param visited A Set of domains already visited in the current lookup chain to prevent infinite recursion.
 * @param indent The current indentation level for rendering.
 * @param counter A mutable counter object to track the total number of lookups.
 * @returns An object containing detailed lookup information and nested SPF records.
 */
export const countTotalSPFLookups = async (
  record: string,
  domain: string,
  visited: Set<string> = new Set(),
  indent
