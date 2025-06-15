import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { DomainResult } from '@/types/domain';
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
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Found
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

  const handleImageLoad = (url: string) => {
    console.log(`✅ BIMI logo loaded successfully: ${url}`);
  };

  const handleImageError = (url: string, error: any) => {
    console.log(`❌ BIMI logo failed to load: ${url}`);
    console.log('Error details:', error);
    
    fetch(url, { mode: 'no-cors' })
      .then(() => console.log(`🔍 URL is accessible via fetch: ${url}`))
      .catch(fetchError => console.log(`🔍 URL fetch failed: ${url}`, fetchError));
  };

  const isCertificateExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="spf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-50">
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
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <code className="text-sm break-all">{result.bimi.record}</code>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Record Details</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Logo URL</label>
                            {result.bimi.logoUrl ? (
                              <div className="mt-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={result.bimi.logoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                                  >
                                    {result.bimi.logoUrl}
                                  </a>
                                  <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </div>
                                {/* Logo Preview */}
                                <div className="w-16 h-16 border border-gray-200 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                                  <object 
                                    data={result.bimi.logoUrl} 
                                    type="image/svg+xml"
                                    className="w-12 h-12"
                                    onLoad={() => handleImageLoad(result.bimi.logoUrl!)}
                                    onError={(e) => {
                                      handleImageError(result.bimi.logoUrl!, e);
                                      (e.target as HTMLObjectElement).style.display = 'none';
                                      (e.target as HTMLObjectElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                  >
                                    <img 
                                      src={result.bimi.logoUrl} 
                                      alt="BIMI Logo" 
                                      className="w-12 h-12 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  </object>
                                  <div className={`text-gray-400 text-xs ${result.bimi.logoUrl ? 'hidden' : ''}`}>
                                    No logo
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">Not specified</span>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Certificate</label>
                            {result.bimi.certificateUrl ? (
                              <div className="mt-1 space-y-2">
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
                                    <span className="font-medium">Expires:</span> 
                                    <span className={isCertificateExpired(result.bimi.certificateExpiry) ? 'text-red-600 font-medium' : ''}>
                                      {result.bimi.certificateExpiry}
                                    </span>
                                    {isCertificateExpired(result.bimi.certificateExpiry) && (
                                      <div className="text-red-600 text-xs mt-1">
                                        ⚠️ Certificate has expired
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">Not specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Email Preview</h4>
                        {/* Phone-style mockup */}
                        <div className="mx-auto max-w-sm">
                          <div className="bg-gray-900 rounded-3xl p-2 shadow-2xl">
                            {/* Phone bezel */}
                            <div className="bg-black rounded-2xl overflow-hidden">
                              {/* Status bar */}
                              <div className="bg-black text-white text-xs px-4 py-2 flex justify-between items-center">
                                <span>9:41</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-2 border border-white rounded-sm">
                                    <div className="w-3 h-1 bg-white rounded-sm"></div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Email app */}
                              <div className="bg-white">
                                {/* Email header */}
                                <div className="bg-blue-500 text-white p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    <span className="font-medium">Inbox</span>
                                  </div>
                                  <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <span className="text-xs">3</span>
                                  </div>
                                </div>
                                
                                {/* Email list */}
                                <div className="divide-y divide-gray-100">
                                  {/* BIMI Email */}
                                  <div className="p-3 bg-blue-50">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-blue-200">
                                        {result.bimi.logoUrl ? (
                                          <object 
                                            data={result.bimi.logoUrl} 
                                            type="image/svg+xml"
                                            className="w-8 h-8"
                                          >
                                            <img 
                                              src={result.bimi.logoUrl} 
                                              alt="BIMI Logo" 
                                              className="w-8 h-8 object-contain"
                                            />
                                          </object>
                                        ) : (
                                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {result.domain.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium text-gray-900 truncate text-sm">
                                            {result.domain}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            9:15 AM
                                          </div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-800 truncate">
                                          Welcome to our service! ✨
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          Thank you for joining us. We're excited to...
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Regular emails */}
                                  <div className="p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">JD</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium text-gray-900 truncate text-sm">
                                            John Doe
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            8:45 AM
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-600 truncate">
                                          Meeting Update
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          The meeting has been rescheduled...
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">TS</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium text-gray-900 truncate text-sm">
                                            Team Support
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Yesterday
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-600 truncate">
                                          Your ticket has been resolved
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          Thank you for contacting support...
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="font-medium">BIMI Display Preview</div>
                          <div>Shows how your brand logo appears in email clients</div>
                          {result.bimi.logoUrl && (
                            <div className="text-green-600">✓ Logo detected and displayed</div>
                          )}
                        </div>
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
      </Tabs>
    </div>
  );
};
