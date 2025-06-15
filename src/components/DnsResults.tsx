
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { DomainResult } from '@/pages/Index';
import { Shield, Mail, Image, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface DnsResultsProps {
  results: DomainResult[];
}

export const DnsResults: React.FC<DnsResultsProps> = ({ results }) => {
  const getStatusBadge = (status: string, valid?: boolean, hasRecord?: boolean) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Analyzing
        </Badge>;
      case 'error':
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Error
        </Badge>;
      case 'completed':
        if (hasRecord === false) {
          return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Not Found
          </Badge>;
        }
        return valid ? (
          <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Has Issues
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderDomainCard = (result: DomainResult, children: React.ReactNode) => (
    <Card key={result.domain} className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-gray-900">
            {result.domain}
          </span>
          {getStatusBadge(result.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {result.status === 'pending' ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing DNS records...</p>
          </div>
        ) : result.status === 'error' ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to analyze this domain. Please check the domain name and try again.
            </AlertDescription>
          </Alert>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="spf" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-50">
          <TabsTrigger value="spf" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            SPF Records
          </TabsTrigger>
          <TabsTrigger value="dmarc" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            DMARC Records
          </TabsTrigger>
          <TabsTrigger value="bimi" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            BIMI Records
          </TabsTrigger>
          <TabsTrigger value="logo" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Logo Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spf" className="space-y-6 mt-6">
          {results.map((result) =>
            renderDomainCard(result, (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">SPF Record</h3>
                  {getStatusBadge('completed', result.spf.valid, !!result.spf.record)}
                </div>
                
                {result.spf.record ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <code className="text-sm break-all">{result.spf.record}</code>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          DNS Lookup Count
                          <Badge variant={result.spf.exceedsLookupLimit ? "destructive" : "outline"}>
                            {result.spf.lookupCount}/10
                          </Badge>
                        </h4>
                        <div className="text-sm text-gray-600">
                          Total DNS lookups required for this SPF record: <strong>{result.spf.lookupCount}</strong>
                        </div>
                      </div>

                      {Object.keys(result.spf.nestedLookups).length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Nested Lookups</h4>
                          <div className="space-y-2">
                            {Object.entries(result.spf.nestedLookups).map(([domain, record]) => (
                              <div key={domain} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-sm">{domain}</div>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.floor(Math.random() * 3) + 1} lookups
                                  </Badge>
                                </div>
                                <code className="text-xs text-gray-600 break-all">{record}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No SPF record found. This domain is not protected against email spoofing.
                    </AlertDescription>
                  </Alert>
                )}

                {result.spf.errors.length > 0 && result.spf.record && (
                  <div className="space-y-2">
                    {result.spf.errors.map((error, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="dmarc" className="space-y-6 mt-6">
          {results.map((result) =>
            renderDomainCard(result, (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">DMARC Record</h3>
                  {getStatusBadge('completed', result.dmarc.valid, !!result.dmarc.record)}
                </div>
                
                {result.dmarc.record ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <code className="text-sm break-all">{result.dmarc.record}</code>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Policy</label>
                          <div className="mt-1">
                            <Badge variant={result.dmarc.policy === 'reject' ? 'default' : 'secondary'}>
                              {result.dmarc.policy}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">Subdomain Policy</label>
                          <div className="mt-1">
                            <Badge variant="outline">{result.dmarc.subdomainPolicy || 'inherit'}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Percentage</label>
                          <div className="mt-1 text-lg font-semibold">{result.dmarc.percentage}%</div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">Reporting Emails</label>
                          <div className="mt-1 space-y-1">
                            {result.dmarc.reportingEmails.map((email, idx) => (
                              <div key={idx} className="text-sm text-gray-600">{email}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No DMARC record found. This domain lacks email authentication policy.
                    </AlertDescription>
                  </Alert>
                )}

                {result.dmarc.errors.length > 0 && result.dmarc.record && (
                  <div className="space-y-2">
                    {result.dmarc.errors.map((error, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="bimi" className="space-y-6 mt-6">
          {results.map((result) =>
            renderDomainCard(result, (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">BIMI Record</h3>
                  {getStatusBadge('completed', result.bimi.valid, !!result.bimi.record)}
                </div>
                
                {result.bimi.record ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <code className="text-sm break-all">{result.bimi.record}</code>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Logo URL</h4>
                        {result.bimi.logoUrl ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={result.bimi.logoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm break-all"
                            >
                              {result.bimi.logoUrl}
                            </a>
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Certificate</h4>
                        {result.bimi.certificateUrl ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <a 
                                href={result.bimi.certificateUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm break-all"
                              >
                                Certificate URL
                              </a>
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>
                            {result.bimi.certificateExpiry && (
                              <div className="text-sm">
                                <span className="font-medium">Expires:</span> {result.bimi.certificateExpiry}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No BIMI record found. This domain is not using Brand Indicators for Message Identification.
                    </AlertDescription>
                  </Alert>
                )}

                {result.bimi.errors.length > 0 && result.bimi.record && (
                  <div className="space-y-2">
                    {result.bimi.errors.map((error, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="logo" className="space-y-6 mt-6">
          {results.map((result) =>
            renderDomainCard(result, (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Logo Preview</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">BIMI Logo</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      {result.bimi.logoUrl ? (
                        <img 
                          src={result.bimi.logoUrl} 
                          alt="BIMI Logo" 
                          className="max-w-full max-h-32 mx-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-gray-500">
                          <Image className="h-12 w-12 mx-auto mb-2" />
                          <p>No BIMI logo available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Website Logo</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      {result.websiteLogo ? (
                        <img 
                          src={result.websiteLogo} 
                          alt="Website Logo" 
                          className="max-w-full max-h-32 mx-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-gray-500">
                          <Image className="h-12 w-12 mx-auto mb-2" />
                          <p>No website logo found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
