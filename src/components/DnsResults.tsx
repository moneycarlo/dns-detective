import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult, LookupDetail } from '@/types/domain';
import { Shield, Mail, Image, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// A new, safe component to render the BIMI logo
const BimiLogo: React.FC<{ logoUrl: string | null, domain: string }> = ({ logoUrl, domain }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  if (!logoUrl || hasError) {
    return (
      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
        {domain.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${domain} BIMI logo`}
      className="w-12 h-12 object-contain"
      onError={() => setHasError(true)}
    />
  );
};

const LookupDetails: React.FC<{ details: LookupDetail[] }> = ({ details }) => {
  if (!details || details.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {details.map((detail, index) => (
        <div key={`${detail.number}-${index}`} style={{ marginLeft: `${detail.indent * 20}px` }}>
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                <span className="text-gray-500 font-normal">#{detail.number}</span>
                <Badge variant="outline" className="text-xs">{detail.type}</Badge>
                <span className="break-all">{detail.domain}</span>
              </div>
            </div>
            {detail.record && <code className="text-xs text-gray-600 break-all">{detail.record}</code>}
            {detail.nested && detail.nested.length > 0 && (
              <div className="mt-2 pl-4 border-l-2 border-gray-200">
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
  const getStatusBadge = (status: string, valid: boolean = false, errors: string[] = []) => {
    if (status === 'pending') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Analyzing</Badge>;
    }
    if (status === 'error' || errors.length > 0) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Issues Found</Badge>;
    }
    if (valid) {
      return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>;
    }
    return <Badge variant="outline">Not Found</Badge>;
  };

  const renderDomainCard = (result: DomainResult, children: React.ReactNode) => (
    <Card key={result.domain} className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-gray-900">
            {result.domain}
          </span>
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
              Failed to analyze this domain. An unexpected error occurred. Please try again.
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
        <TabsList className="grid w-full grid-cols-3 bg-gray-50">
          <TabsTrigger value="spf" className="flex items-center gap-2"><Shield className="h-4 w-4" />SPF</TabsTrigger>
          <TabsTrigger value="dmarc" className="flex items-center gap-2"><Mail className="h-4 w-4" />DMARC</TabsTrigger>
          <TabsTrigger value="bimi" className="flex items-center gap-2"><Image className="h-4 w-4" />BIMI</TabsTrigger>
        </TabsList>

        <TabsContent value="spf" className="space-y-6 mt-6">
          {results.map((result) =>
            renderDomainCard(result, (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">SPF Record</h3>
                  {getStatusBadge(result.status, result.spf.valid && result.spf.errors.length === 0, result.spf.errors)}
                </div>
                {result.spf.record ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg"><code className="text-sm break-all">{result.spf.record}</code></div>
                    <h4 className="font-medium">Lookup Count: 
                      <Badge variant={result.spf.exceedsLookupLimit ? "destructive" : "outline"} className="ml-2">
                        {result.spf.lookupCount}/10
                      </Badge>
                    </h4>
                    {result.spf.lookupDetails && result.spf.lookupDetails.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Lookup Details</h4>
                        <LookupDetails details={result.spf.lookupDetails} />
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>No SPF record found.</AlertDescription></Alert>
                )}
                {result.spf.errors.map((error, idx) => (<Alert key={idx} variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>))}
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
                  {getStatusBadge(result.status, result.dmarc.valid, result.dmarc.errors)}
                </div>
                {result.dmarc.record ? (
                  <div className="bg-gray-50 p-4 rounded-lg"><code className="text-sm break-all">{result.dmarc.record}</code></div>
                ) : (
                  <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>No DMARC record found.</AlertDescription></Alert>
                )}
                {result.dmarc.errors.map((error, idx) => (<Alert key={idx} variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>))}
                {result.dmarc.warnings.map((warning, idx) => (<Alert key={idx} variant="default"><AlertTriangle className="h-4 w-4" /><AlertDescription>{warning}</AlertDescription></Alert>))}
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
                   {getStatusBadge(result.status, result.bimi.valid, result.bimi.errors)}
                </div>
                {result.bimi.record ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg"><code className="text-sm break-all">{result.bimi.record}</code></div>
                    <div className="flex items-center gap-8">
                      <div>
                        <h4 className="font-medium mb-2">Logo Preview</h4>
                        <div className="w-20 h-20 border rounded-lg p-2 flex items-center justify-center">
                          <BimiLogo logoUrl={result.bimi.logoUrl} domain={result.domain} />
                        </div>
                      </div>
                      {/* Preview could go here if needed */}
                    </div>
                  </div>
                ) : (
                  <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>No BIMI record found.</AlertDescription></Alert>
                )}
                {result.bimi.errors.map((error, idx) => (<Alert key={idx} variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>))}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
