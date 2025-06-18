import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult, LookupDetail } from '@/types/domain';
import { Shield, Mail, Image, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface DnsResultsProps {
  results: DomainResult[];
}

const LookupDetails: React.FC<{ details: LookupDetail[] }> = ({ details }) => {
  if (!details || details.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {details.map((detail, index) => (
        <div key={index} style={{ marginLeft: `${detail.indent * 20}px` }}>
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-sm flex items-center gap-2">
                <span className="text-gray-500 font-normal">#{detail.number}</span>
                <Badge variant="outline" className="text-xs">{detail.type}</Badge>
                <span>{detail.domain}</span>
              </div>
            </div>
            {detail.record && <code className="text-xs text-gray-600 break-all">{detail.record}</code>}
            {detail.nested && detail.nested.length > 0 && (
              <div className="mt-2">
                <LookupDetails details={detail.nested} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};


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

                      {result.spf.lookupDetails && result.spf.lookupDetails.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Nested Lookups</h4>
                          <LookupDetails details={result.spf.lookupDetails} />
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

                {result.spf.errors.length > 0 && (
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

                {result.dmarc.errors.length > 0 && (
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
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-medium">Record Details</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Logo URL</label>
                            <div className="mt-1 space-y-2">
                              {result.bimi.logoUrl ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <a 
                                      href={result.bimi.logoUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600
