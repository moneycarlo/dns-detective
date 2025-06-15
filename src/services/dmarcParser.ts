
import { queryDnsRecord } from './dnsQuery';

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
}

// Check if external domain is authorized to receive DMARC reports
const checkDmarcReportingAuthorization = async (reportingDomain: string, organizationDomain: string): Promise<boolean> => {
  if (reportingDomain === organizationDomain) {
    return true; // Same domain, always authorized
  }
  
  // Check for authorization record at reportingDomain._report._dmarc.organizationDomain
  const authorizationDomain = `${reportingDomain}._report._dmarc.${organizationDomain}`;
  const authRecord = await queryDnsRecord(authorizationDomain, 'TXT');
  
  if (authRecord && authRecord.includes('v=DMARC1')) {
    return true;
  }
  
  return false;
};

export const parseDMARCRecord = async (record: string, domain: string): Promise<DMARCParseResult> => {
  const pairs = record.split(';').map(pair => pair.trim());
  let policy = '';
  let subdomainPolicy = '';
  let percentage = 100;
  let adkim = 'r'; // Default to relaxed
  let aspf = 'r'; // Default to relaxed
  let fo = '0'; // Default failure reporting option
  let rf = 'afrf'; // Default report format
  let ri = '86400'; // Default report interval (24 hours)
  const reportingEmails: string[] = [];
  const ruaEmails: string[] = [];
  const rufEmails: string[] = [];
  const warnings: string[] = [];
  
  for (const pair of pairs) {
    if (pair.startsWith('p=')) {
      policy = pair.substring(2);
    } else if (pair.startsWith('sp=')) {
      subdomainPolicy = pair.substring(3);
    } else if (pair.startsWith('pct=')) {
      percentage = parseInt(pair.substring(4)) || 100;
    } else if (pair.startsWith('adkim=')) {
      adkim = pair.substring(6);
    } else if (pair.startsWith('aspf=')) {
      aspf = pair.substring(5);
    } else if (pair.startsWith('fo=')) {
      fo = pair.substring(3);
    } else if (pair.startsWith('rf=')) {
      rf = pair.substring(3);
    } else if (pair.startsWith('ri=')) {
      ri = pair.substring(3);
    } else if (pair.startsWith('rua=')) {
      const emails = pair.substring(4).split(',').map(email => 
        email.replace('mailto:', '').trim()
      );
      ruaEmails.push(...emails);
      reportingEmails.push(...emails);
    } else if (pair.startsWith('ruf=')) {
      const emails = pair.substring(4).split(',').map(email => 
        email.replace('mailto:', '').trim()
      );
      rufEmails.push(...emails);
      reportingEmails.push(...emails);
    }
  }
  
  // Validate RUA and RUF domain authorizations
  const allReportingEmails = [...ruaEmails, ...rufEmails];
  for (const email of allReportingEmails) {
    const emailDomain = email.split('@')[1];
    if (emailDomain && emailDomain !== domain) {
      const isAuthorized = await checkDmarcReportingAuthorization(emailDomain, domain);
      if (!isAuthorized) {
        warnings.push(`External domain '${emailDomain}' may not be authorized to receive DMARC reports for '${domain}'. Check for authorization record at ${emailDomain}._report._dmarc.${domain}`);
      }
    }
  }
  
  return {
    policy,
    subdomainPolicy,
    percentage,
    adkim,
    aspf,
    fo,
    rf,
    ri,
    reportingEmails: [...new Set(reportingEmails)], // Remove duplicates
    ruaEmails,
    rufEmails,
    warnings
  };
};
