
import { DomainResult, LookupDetail } from '@/types/domain';

export const generateMockResult = (domain: string): DomainResult => {
  // Create a simple hash from domain name for consistent results
  const domainHash = domain.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
  
  // Well-known domains that should always have SPF records
  const wellKnownDomains = [
    'google.com', 'microsoft.com', 'salesforce.com', 'mailchimp.com',
    'sendgrid.com', 'constantcontact.com', 'campaignmonitor.com',
    'iterable.com', 'bluehornet.com', 'hubspot.com', 'marketo.com'
  ];
  
  // Real BIMI logo URLs for known domains
  const bimiLogos: { [key: string]: string } = {
    'iterable.com': 'https://iterable.com/wp-content/uploads/2021/01/iterable-logo-purple.svg',
    'mailchimp.com': 'https://eep.io/images/yzp4yrjcwpkr/c5ggvwjABLrjGVD7dNJFcx/c91c7a7a17/mailchimp-logo.svg',
    'sendgrid.com': 'https://sendgrid.com/wp-content/themes/sgdotcom/pages/resource/brand/2016/SendGrid-Logomark.svg',
    'constantcontact.com': 'https://www.constantcontact.com/images/ctct-logo.svg',
    'hubspot.com': 'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.svg',
    'salesforce.com': 'https://c1.sfdcstatic.com/etc/clientlibs/sfdc-aem-master/clientlibs_base/images/salesforce-logo.svg'
  };
  
  // Determine if domain has records based on consistent logic
  const hasSpf = wellKnownDomains.includes(domain.toLowerCase()) || Math.abs(domainHash) % 10 > 1; // 80% chance
  const hasDmarc = wellKnownDomains.includes(domain.toLowerCase()) || Math.abs(domainHash) % 10 > 2; // 70% chance  
  const hasBimi = !!bimiLogos[domain.toLowerCase()] || Math.abs(domainHash) % 10 > 6; // 30% chance or if we have a real logo
  
  let spfLookupCount = 0;
  let exceedsLimit = false;
  let spfErrors: string[] = [];
  let nestedLookups: { [key: string]: string } = {};
  let lookupDetails: LookupDetail[] = [];
  
  if (hasSpf) {
    // Generate realistic nested lookups based on domain type
    const includes = ['_spf.google.com', 'spf.protection.outlook.com', '_spf.salesforce.com'];
    
    // Calculate lookup count: 1 for main record + number of includes + nested lookups
    let totalLookups = 1; // Main SPF record
    
    // Generate mock lookup details
    lookupDetails = includes.map((include, index) => ({
      number: index + 1,
      type: 'include' as const,
      domain: include,
      record: `v=spf1 include:${include} ~all`,
      nested: [],
      indent: 0
    }));
    
    includes.forEach(include => {
      // Each include adds 1 lookup
      totalLookups += 1;
      
      // Generate nested SPF records with their own includes
      if (include === '_spf.google.com') {
        nestedLookups[include] = 'v=spf1 include:_netblocks.google.com include:_netblocks2.google.com include:_netblocks3.google.com ~all';
        totalLookups += 3; // 3 additional nested includes
      } else if (include === 'spf.protection.outlook.com') {
        nestedLookups[include] = 'v=spf1 include:spf-a.outlook.com include:spf-b.outlook.com ~all';
        totalLookups += 2; // 2 additional nested includes
      } else if (include === '_spf.salesforce.com') {
        nestedLookups[include] = 'v=spf1 include:_spf1.salesforce.com include:_spf2.salesforce.com ~all';
        totalLookups += 2; // 2 additional nested includes
      }
    });
    
    // Add some variation based on domain hash but keep it realistic
    const hashVariation = Math.abs(domainHash) % 3; // 0, 1, or 2
    spfLookupCount = totalLookups + hashVariation;
    exceedsLimit = spfLookupCount > 10;
    
    if (exceedsLimit) {
      spfErrors.push(`Too many DNS lookups (${spfLookupCount}/10). This may cause SPF to fail.`);
    }
  } else {
    // No SPF record means no lookups
    spfErrors.push('No SPF record found');
    spfLookupCount = 0;
    exceedsLimit = false;
  }
  
  // Get the actual BIMI logo URL for known domains
  const bimiLogoUrl = bimiLogos[domain.toLowerCase()] || (hasBimi ? `https://${domain}/logo.svg` : null);
  
  return {
    id: crypto.randomUUID(),
    lookupType: 'SPF',
    domain,
    spf: {
      record: hasSpf ? `v=spf1 include:_spf.google.com include:spf.protection.outlook.com include:_spf.salesforce.com ~all` : null,
      valid: hasSpf && !exceedsLimit,
      includes: hasSpf ? ['_spf.google.com', 'spf.protection.outlook.com', '_spf.salesforce.com'] : [],
      redirects: [],
      mechanisms: hasSpf ? ['include', 'include', 'include', '~all'] : [],
      errors: spfErrors,
      nestedLookups: nestedLookups,
      lookupCount: spfLookupCount,
      directLookupCount: hasSpf ? 3 : 0,
      nestedLookupCount: hasSpf ? spfLookupCount - 3 - 1 : 0, // Total minus direct minus main record
      exceedsLookupLimit: exceedsLimit,
      lookupDetails: lookupDetails,
      isCnameInherited: false,
    },
    dmarc: {
      record: hasDmarc ? `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; ruf=mailto:dmarc@${domain}; pct=100` : null,
      valid: hasDmarc,
      policy: hasDmarc ? 'quarantine' : '',
      subdomainPolicy: hasDmarc ? 'quarantine' : '',
      percentage: hasDmarc ? 100 : 0,
      adkim: 'r',
      aspf: 'r',
      fo: '0',
      rf: 'afrf',
      ri: '86400',
      reportingEmails: hasDmarc ? [`dmarc@${domain}`] : [],
      ruaEmails: hasDmarc ? [`dmarc@${domain}`] : [],
      rufEmails: hasDmarc ? [`dmarc@${domain}`] : [],
      errors: hasDmarc ? [] : ['No DMARC record found'],
      warnings: []
    },
    bimi: {
      record: hasBimi ? `v=BIMI1; l=${bimiLogoUrl}; a=https://${domain}/cert.pem` : null,
      valid: hasBimi,
      logoUrl: bimiLogoUrl,
      certificateUrl: hasBimi ? `https://${domain}/cert.pem` : null,
      certificateExpiry: hasBimi ? '2025-12-31T23:59:59Z' : null,
      certificateIssueDate: hasBimi ? '2024-01-01T00:00:00Z' : null,
      certificateAuthority: hasBimi ? 'DigiCert Inc' : null,
      certificateIssuer: hasBimi ? `${domain} Certificate Authority` : null,
      errors: hasBimi ? [] : ['No BIMI record found']
    },
    mx: { records: [], errors: [] },
    websiteLogo: `https://logo.clearbit.com/${domain}`,
    status: 'completed' as const,
  };
};
