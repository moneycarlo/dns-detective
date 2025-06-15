import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainInput } from '@/components/DomainInput';
import { DnsResults } from '@/components/DnsResults';
import { ExportButton } from '@/components/ExportButton';
import { Legend } from '@/components/Legend';
import { Shield, Search, FileText } from 'lucide-react';

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
    reportingEmails: string[];
    errors: string[];
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

const Index = () => {
  const [domains, setDomains] = useState<string[]>([]);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLookup = async (domainList: string[]) => {
    setIsLoading(true);
    
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
    
    setResults(initialResults);

    // Simulate DNS lookups (in a real app, this would call actual DNS APIs)
    for (let i = 0; i < domainList.length; i++) {
      const domain = domainList[i];
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const mockResult = generateMockResult(domain);
        
        setResults(prev => 
          prev.map((result, index) => 
            index === i ? { ...mockResult, status: 'completed' as const } : result
          )
        );
      } catch (error) {
        setResults(prev => 
          prev.map((result, index) => 
            index === i ? { ...result, status: 'error' as const } : result
          )
        );
      }
    }
    
    setIsLoading(false);
  };

  const generateMockResult = (domain: string): DomainResult => {
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
    
    if (hasSpf) {
      // Generate realistic nested lookups based on domain type
      const includes = ['_spf.google.com', 'spf.protection.outlook.com', '_spf.salesforce.com'];
      
      // Calculate lookup count: 1 for main record + number of includes + nested lookups
      let totalLookups = 1; // Main SPF record
      
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
        exceedsLookupLimit: exceedsLimit
      },
      dmarc: {
        record: hasDmarc ? `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; ruf=mailto:dmarc@${domain}; pct=100` : null,
        valid: hasDmarc,
        policy: hasDmarc ? 'quarantine' : '',
        subdomainPolicy: hasDmarc ? 'quarantine' : '',
        percentage: hasDmarc ? 100 : 0,
        reportingEmails: hasDmarc ? [`dmarc@${domain}`] : [],
        errors: hasDmarc ? [] : ['No DMARC record found']
      },
      bimi: {
        record: hasBimi ? `v=BIMI1; l=${bimiLogoUrl}; a=https://${domain}/cert.pem` : null,
        valid: hasBimi,
        logoUrl: bimiLogoUrl,
        certificateUrl: hasBimi ? `https://${domain}/cert.pem` : null,
        certificateExpiry: hasBimi ? '2025-12-31' : null,
        errors: hasBimi ? [] : ['No BIMI record found']
      },
      websiteLogo: `https://logo.clearbit.com/${domain}`,
      status: 'completed'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-3">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">DNS Security Lookup</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive DNS analysis for SPF, DMARC, and BIMI records with nested lookups and certificate validation
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Domain Lookup
                </CardTitle>
                <CardDescription>
                  Enter up to 10 domains to analyze their DNS security records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainInput
                  domains={domains}
                  onDomainsChange={setDomains}
                  onLookup={handleLookup}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Export Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExportButton results={results} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3 space-y-6">
            {results.length > 0 && (
              <DnsResults results={results} />
            )}
            
            <Legend />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
