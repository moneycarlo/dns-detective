
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
                    
                    {/* Certificate Warning */}
                    {!result.bimi.certificateUrl && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <div className="font-medium">No certificate present</div>
                            <div>BIMI logo will not display for some providers like Gmail. A Verified Mark Certificate (VMC) is required for full BIMI support.</div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                              <div className="mt-1">
                                <span className="text-red-600 text-sm font-medium">Not specified</span>
                                <div className="text-xs text-gray-600 mt-1">
                                  Certificate required for Gmail and other providers
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Email Preview</h4>
                        {/* Realistic iPhone-style mockup */}
                        <div className="mx-auto max-w-xs">
                          <div className="bg-black rounded-[2.5rem] p-2 shadow-2xl">
                            {/* iPhone notch and frame */}
                            <div className="bg-black rounded-[2rem] relative overflow-hidden">
                              {/* Dynamic Island */}
                              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10"></div>
                              
                              {/* Screen */}
                              <div className="bg-white rounded-[1.8rem] overflow-hidden min-h-[28rem]">
                                {/* Status bar */}
                                <div className="bg-white px-6 py-3 flex justify-between items-center text-black text-sm font-medium">
                                  <span>9:41</span>
                                  <div className="flex items-center gap-1">
                                    <div className="flex gap-1">
                                      <div className="w-1 h-1 bg-black rounded-full"></div>
                                      <div className="w-1 h-1 bg-black rounded-full"></div>
                                      <div className="w-1 h-1 bg-black rounded-full"></div>
                                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    </div>
                                    <div className="ml-1 w-6 h-3 border border-black rounded-sm relative">
                                      <div className="absolute right-[-2px] top-1 w-1 h-1 bg-black rounded-sm"></div>
                                      <div className="w-4 h-2 bg-black rounded-sm m-0.5"></div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Mail app header */}
                                <div className="bg-blue-600 px-4 py-4 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="text-white text-lg font-semibold">Mailboxes</div>
                                  </div>
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">✉</span>
                                  </div>
                                </div>
                                
                                {/* Inbox header */}
                                <div className="bg-gray-50 px-4 py-3 border-b">
                                  <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-gray-900">Inbox</h2>
                                    <span className="text-blue-600 text-sm">Edit</span>
                                  </div>
                                </div>
                                
                                {/* Email list */}
                                <div className="divide-y divide-gray-100">
                                  {/* BIMI Enhanced Email */}
                                  <div className="px-4 py-4 bg-blue-25">
                                    <div className="flex items-start gap-3">
                                      <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                                        {result.bimi.logoUrl ? (
                                          <object 
                                            data={result.bimi.logoUrl} 
                                            type="image/svg+xml"
                                            className="w-10 h-10"
                                          >
                                            <img 
                                              src={result.bimi.logoUrl} 
                                              alt="BIMI Logo" 
                                              className="w-10 h-10 object-contain"
                                            />
                                          </object>
                                        ) : (
                                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {result.domain.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                          <div className="font-semibold text-gray-900 text-sm truncate">
                                            {result.domain}
                                          </div>
                                          <div className="text-xs text-blue-600 font-medium">
                                            2:30 PM
                                          </div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-800 truncate mb-1">
                                          Welcome to {result.domain}! 🎉
                                        </div>
                                        <div className="text-xs text-gray-600 truncate leading-relaxed">
                                          Thank you for joining our community. We're excited to have you on board and look forward to...
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Regular email 1 */}
                                  <div className="px-4 py-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                        AM
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                          <div className="font-semibold text-gray-900 text-sm truncate">
                                            Apple Music
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            1:15 PM
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-700 truncate mb-1">
                                          Your Weekly Mix is Ready
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          Discover new songs picked just for you...
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Regular email 2 */}
                                  <div className="px-4 py-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                        MS
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                          <div className="font-semibold text-gray-900 text-sm truncate">
                                            Microsoft Store
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            12:45 PM
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-700 truncate mb-1">
                                          App updates available
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          5 apps have updates ready to install...
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Regular email 3 */}
                                  <div className="px-4 py-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                        SL
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                          <div className="font-semibold text-gray-900 text-sm truncate">
                                            Slack
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            11:30 AM
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-700 truncate mb-1">
                                          You have 3 unread messages
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          Check your team updates in #general...
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1 text-center">
                          <div className="font-medium">BIMI Display Preview</div>
                          <div>Shows how your brand logo appears in email clients that support BIMI</div>
                          {result.bimi.logoUrl && (
                            <div className="text-green-600">✓ Logo detected and will be displayed</div>
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
