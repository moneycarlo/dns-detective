export type LookupType = 'ALL' | 'SPF' | 'DMARC' | 'BIMI';

export interface LookupDetail {
  number: number;
  type: "include" | "redirect" | "a" | "mx" | "ptr" | "exists";
  domain: string;
  record?: string;
  nested?: LookupDetail[];
  indent: number;
}

export interface DomainResult {
  id: string; // For unique tracking
  lookupType: LookupType; // To know which lookup was run
  domain: string;
  spf: {
    record: string | null;
    valid: boolean;
    includes: string[];
    redirects: string[];
    mechanisms: string[];
    errors: string[];
    nestedLookups: { [key: string]: string };
    lookupCount: number;
    exceedsLookupLimit: boolean;
    lookupDetails: LookupDetail[];
  };
  dmarc: {
    record: string | null;
    valid: boolean;
    policy: string;
    subdomainPolicy: string;
    percentage: number;
    adkim: string;
    aspf: string;
    fo: string;
    rf: string;
    ri: string;
    reportingEmails: string[];
    ruaEmails: string[];
    rufEmails: string[];
    errors: string[];
    warnings: string[];
  };
  bimi: {
    record: string | null;
    valid: boolean;
    logoUrl: string | null;
    certificateUrl: string | null;
    certificateExpiry: string | null;
    certificateAuthority: string | null; // Added
    errors: string[];
  };
  websiteLogo: string | null;
  status: 'pending' | 'completed' | 'error';
}
