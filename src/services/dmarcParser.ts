import { queryDns } from './dnsQuery';

export interface DMARCParseResult {
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
  warnings: string[];
  errors: string[];
}

const VALID_DMARC_TAGS = new Set(['v', 'p', 'sp', 'rua', 'ruf', 'fo', 'adkim', 'aspf', 'rf', 'ri', 'pct']);

const checkDmarcReportingAuthorization = async (reportingDomain: string, organizationDomain: string): Promise<boolean> => {
  if (reportingDomain === organizationDomain) {
    return true; 
  }

  const authorizationDomain = `${organizationDomain}._report._dmarc.${reportingDomain}`;
  try {
    const response = await queryDns(authorizationDomain, 'TXT');
    const authRecord = response.Answer?.find(a => a.data.includes(`v=DMARC1`));
    return !!authRecord;
  } catch (error) {
    console.error(`Error checking DMARC reporting authorization for ${authorizationDomain}:`, error);
    return false;
  }
};

export const parseDMARCRecord = async (record: string, domain: string): Promise<DMARCParseResult> => {
  const result: DMARCParseResult = {
    policy: 'none', subdomainPolicy: 'none', percentage: 100, adkim: 'r', aspf: 'r', fo: '0',
    rf: 'afrf', ri: '86400', reportingEmails: [], ruaEmails: [], rufEmails: [], warnings: [], errors: [],
  };
  
  const pairs = record.split(';').map(p => p.trim()).filter(p => p);

  // Check for sp tag on a subdomain
  if (domain.split('.').length > 2 && record.includes('sp=')) {
    result.warnings.push("The 'sp' tag is present on a subdomain. It will be ignored by receivers, as 'sp' only applies to subdomains of the top-level domain the policy is published on.");
  }

  for (const pair of pairs) {
    const parts = pair.split('=');
    const tag = parts[0]?.trim();
    const value = parts[1]?.trim();

    if (!tag) continue;

    if (!VALID_DMARC_TAGS.has(tag)) {
        result.errors.push(`'${tag}' is not a valid DMARC tag.`);
        continue;
    }

    if (!value) continue;

    switch (tag) {
        case 'p': result.policy = value; break;
        case 'sp': result.subdomainPolicy = value; break;
        case 'pct': result.percentage = parseInt(value) || 100; break;
        case 'adkim': result.adkim = value; break;
        case 'aspf': result.aspf = value; break;
        case 'fo': result.fo = value; break;
        case 'rf': result.rf = value; break;
        case 'ri': result.ri = value; break;
        case 'rua':
            result.ruaEmails = value.split(',').map(v => v.replace('mailto:', '').trim());
            break;
        case 'ruf':
            result.rufEmails = value.split(',').map(v => v.replace('mailto:', '').trim());
            break;
    }
  }

  result.reportingEmails = [...new Set([...result.ruaEmails, ...result.rufEmails])];

  for (const email of result.reportingEmails) {
    const emailParts = email.split('@');
    if (emailParts.length < 2) continue;
    
    const reportingDomain = emailParts[1];
    if (reportingDomain && reportingDomain !== domain) {
      const isAuthorized = await checkDmarcReportingAuthorization(domain, reportingDomain);
      if (!isAuthorized) {
        result.warnings.push(`External domain '${reportingDomain}' may not be authorized to receive DMARC reports for '${domain}'.`);
      }
    }
  }
  
  return result;
};
