
export interface DomainResult {
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
    errors: string[];
  };
  websiteLogo: string | null;
  status: 'pending' | 'completed' | 'error';
}
