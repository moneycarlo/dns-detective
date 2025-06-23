import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult, LookupDetail, LookupType } from '@/types/domain';
import { Shield, Mail, Image, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// A safe component to render the BIMI logo
const BimiLogo: React.FC<{ logoUrl: string | null; domain: string }> = ({ logoUrl, domain }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [logoUrl]);

  if (!logoUrl || hasError) {
    return (
      <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-xl">
        {domain ? domain.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }
  return <img src={logoUrl} alt={`${domain} BIMI logo`} className="w-full h-full object-contain" onError={() => setHasError(true)} />;
};

// A recursive component to display nested SPF lookups
const LookupDetails: React.FC<{ details: LookupDetail[] }> = ({ details }) => {
  if (!details?.length) return null;
  return (
    <div className="space-y-2 pt-2">
      {details.map((detail) => (
        <div key={`${detail.number}-${detail.domain}`} className="ml-4 pl-4 border-l-2">
          <div className="text-sm">
            <span className="font-mono text-gray-500">{detail.number}.</span> {detail.type}: <span className="font-medium">{detail.domain}</span>
          </div>
          {detail.record && <code className="block bg-gray-50 p-1.5 rounded-md text-xs mt-1 ml-4 break-all">{detail.record}</code>}
          {detail.nested && detail.nested.length > 0 && <div className="mt-1"><LookupDetails details={detail.nested} /></div>}
        </div>
      ))}
    </div>
  );
};

export const DnsResults: React.FC<{ results: DomainResult[] }> = ({ results }) => {
  if (results.length === 0) return null;

  const renderDomainCard = (result: DomainResult, children: React.ReactNode) => (
    <Card key={result.id + result.lookupType} className="overflow-hidden mb-4">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-gray-900">{result.domain}</span>
           <Badge variant="secondary">{result.lookupType}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {result.status === 'pending' ? (
          <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" /><p className="text-gray-600">Analyzing DNS records...</p></div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );

  const renderSPF = (result: DomainResult) => (
    <div>
        <h3 className="font-semibold text-lg flex items-center gap-2"><Shield size={16}/>SPF</h3>
        {result.spf.record ? (
            <div className="mt-2 space-y-2">
            <code className="block bg-gray-100 p-2 rounded-md text-sm break-all">{result.spf.record}</code>
            <p className="text-sm font-medium">DNS Lookups: <Badge variant={result.spf.exceedsLookupLimit ? 'destructive' : 'secondary'}>{result.spf.lookupCount} / 10</Badge></p>
            {result.spf.lookupDetails && result.spf.lookupDetails.length > 0 && <LookupDetails details={result.spf.lookupDetails} />}
            {result.spf.errors.map((e,i) => <Alert key={i} variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{e}</AlertDescription></Alert>)}
            </div>
        ) : <Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{result.spf.errors[0] || 'No SPF record found.'}</AlertDescription></Alert>}
    </div>
  );

  const renderDMARC = (result: DomainResult) => (
    <div>
        <h3 className="font-semibold text-lg flex items-center gap-2"><Mail size={16}/>DMARC</h3>
        {result.dmarc.record ? (
            <div className="mt-2 space-y-2">
            <code className="block bg-gray-100 p-2 rounded-md text-sm break-all">{result.dmarc.record}</code>
            {result.dmarc.errors.map((e,i) => <Alert key={i} variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{e}</AlertDescription></Alert>)}
            {result.dmarc.warnings.map((w,i) => <Alert key={i} variant="default" className="mt-2 bg-yellow-50 border-yellow-200 text-yellow-800"><AlertTriangle className="h-4 w-4" /><AlertDescription>{w}</AlertDescription></Alert>)}
            </div>
        ) : <Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{result.dmarc.errors[0] || 'No DMARC record found.'}</AlertDescription></Alert>}
    </div>
  );

  const renderBIMI = (result: DomainResult) => (
    <div>
      <h3 className="font-semibold text-lg flex items-center gap-2"><Image size={16}/>BIMI</h3>
      {result.bimi.record ? (
        <div className="mt-2 space-y-4">
          <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-base mb-4">VMC Certificate</h4>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                  <CheckCircle className="h-5 w-5 text-green-500"/>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">VMC</Badge>
                  <span>certificate from</span>
                  <Badge variant="outline">A-TAG</Badge>
                  {result.bimi.certificateUrl ? (
                      <a href={result.bimi.certificateUrl} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:underline font-mono text-xs'>pem-url</a>
                  ) : (
                      <span className='font-mono text-xs'>pem-url</span>
                  )}
                  <span>is valid</span>
              </div>
              
              {/* Light Background Preview */}
              <div className="my-4 p-4 rounded-lg bg-white border">
                  <div className="flex justify-around items-center text-center">
                      {[
                          {size: "1:1", dim: "56px"}, 
                          {size: "80x80", dim: "48px"},
                          {size: "60x60", dim: "40px"},
                          {size: "40x40", dim: "32px"},
                      ].map(s => (
                          <div key={s.size}>
                              <div className="mx-auto bg-gray-100 rounded-md flex items-center justify-center" style={{width: s.dim, height: s.dim}}>
                                  <div className="w-3/4 h-3/4"><BimiLogo logoUrl={result.bimi.logoUrl} domain={result.domain}/></div>
                              </div>
                              <p className="text-xs mt-1 text-gray-600">{s.size}</p>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Dark Background Preview */}
              <div className="my-4 p-4 rounded-lg bg-gray-800 text-white">
                   <div className="flex justify-around items-center text-center">
                      {[
                          {size: "1:1", dim: "56px"}, 
                          {size: "80x80", dim: "48px"},
                          {size: "60x60", dim: "40px"},
                          {size: "40x40", dim: "32px"},
                      ].map(s => (
                          <div key={s.size}>
                              <div className="mx-auto bg-gray-700 rounded-full flex items-center justify-center" style={{width: s.dim, height: s.dim}}>
                                  <div className="w-3/4 h-3/4"><BimiLogo logoUrl={result.bimi.logoUrl} domain={result.domain}/></div>
                              </div>
                              <p className="text-xs mt-1 text-gray-300">{s.size}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
        </div>
      ) : <Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{result.bimi.errors[0] || 'No BIMI record found.'}</AlertDescription></Alert>}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Lookup History</h2>
      <Tabs defaultValue="spf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-50">
          <TabsTrigger value="spf" className="flex items-center gap-2"><Shield className="h-4 w-4" />SPF</TabsTrigger>
          <TabsTrigger value="dmarc" className="flex items-center gap-2"><Mail className="h-4 w-4" />DMARC</TabsTrigger>
          <TabsTrigger value="bimi" className="flex items-center gap-2"><Image className="h-4 w-4" />BIMI</TabsTrigger>
        </TabsList>
        <TabsContent value="spf" className="mt-4">
            {results.filter(r => r.lookupType === 'ALL' || r.lookupType === 'SPF').map(result => renderDomainCard(result, renderSPF(result)))}
        </TabsContent>
        <TabsContent value="dmarc" className="mt-4">
            {results.filter(r => r.lookupType === 'ALL' || r.lookupType === 'DMARC').map(result => renderDomainCard(result, renderDMARC(result)))}
        </TabsContent>
        <TabsContent value="bimi" className="mt-4">
            {results.filter(r => r.lookupType === 'ALL' || r.lookupType === 'BIMI').map(result => renderDomainCard(result, renderBIMI(result)))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
