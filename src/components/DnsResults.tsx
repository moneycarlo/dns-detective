import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult, LookupDetail, LookupType } from '@/types/domain';
import { Shield, Mail, Image, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

// A safe component to render the BIMI logo
const BimiLogo: React.FC<{ logoUrl: string | null; domain: string }> = ({ logoUrl, domain }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [logoUrl]);

  if (!logoUrl || hasError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
        {domain.charAt(0).toUpperCase()}
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
  
// A component to format and color-code the expiration date
const ExpiryDate: React.FC<{ date: string | null }> = ({ date }) => {
  if (!date) return <span className="text-gray-500">Not Available</span>;
  try {
    const expiry = new Date(date);
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    let textColor = 'text-green-600 font-medium';
    if (expiry < now) textColor = 'text-red-600 font-medium';
    else if (expiry < oneMonthFromNow) textColor = 'text-yellow-600 font-medium';
    
    return <span className={textColor}>{expiry.toLocaleDateString()}</span>;
  } catch(e) {
    return <span className="text-gray-500">Invalid Date</span>
  }
};


export const DnsResults: React.FC<{ results: DomainResult[] }> = ({ results }) => {
  if (results.length === 0) return null;

  const renderDomainCard = (result: DomainResult, children: React.ReactNode) => (
    <Card key={result.id} className="overflow-hidden">
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

  const renderContentForTab = (result: DomainResult, tab: 'SPF' | 'DMARC' | 'BIMI') => {
    if (result.status === 'pending') return null;
    if (result.lookupType !== 'ALL' && result.lookupType !== tab) return null;

    switch (tab) {
      case 'SPF':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Shield size={16}/>SPF</h3>
            {result.spf.record ? (
              <div className="space-y-2">
                <code className="block bg-gray-100 p-2 rounded-md text-sm break-all">{result.spf.record}</code>
                <p className="text-sm font-medium">DNS Lookups: <Badge variant={result.spf.exceedsLookupLimit ? 'destructive' : 'secondary'}>{result.spf.lookupCount} / 10</Badge></p>
                {result.spf.lookupDetails && result.spf.lookupDetails.length > 0 && <LookupDetails details={result.spf.lookupDetails} />}
                {result.spf.errors.map((e,i) => <Alert key={i} variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{e}</AlertDescription></Alert>)}
              </div>
            ) : <Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{result.spf.errors[0] || 'No SPF record found.'}</AlertDescription></Alert>}
          </div>
        );
      case 'DMARC':
        return (
          <div className="space-y-4">
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
      case 'BIMI':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Image size={16}/>BIMI</h3>
            {result.bimi.record ? (
              <div className="mt-2 space-y-4">
                <code className="block bg-gray-100 p-2 rounded-md text-sm break-all">{result.bimi.record}</code>
                {result.bimi.errors.map((e,i) => <Alert key={i} variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{e}</AlertDescription></Alert>)}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <h4 className="font-medium mb-2">Certificate Details</h4>
                    {!result.bimi.certificateUrl ? (
                       <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>No certificate (`a=`) tag found. A VMC is required by most email providers.</AlertDescription></Alert>
                    ) : (
                      <div className="text-sm space-y-2 border p-3 rounded-md bg-gray-50">
                          <p><strong>CA:</strong> <span className="font-mono text-xs">{result.bimi.certificateAuthority || 'Could not determine'}</span></p>
                          <p><strong>Expires:</strong> <ExpiryDate date={result.bimi.certificateExpiry} /></p>
                          <a href={result.bimi.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">View Certificate</a>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Email Client Preview</h4>
                    <div className="mx-auto max-w-xs">
                        <div className="bg-black rounded-[2.5rem] p-2 shadow-2xl">
                          <div className="bg-black rounded-[2rem] relative overflow-hidden">
                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10"></div>
                            <div className="bg-white rounded-[1.8rem] overflow-hidden min-h-[28rem]">
                              <div className="divide-y divide-gray-100 pt-12">
                                <div className="px-4 py-4 bg-blue-50">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                                      <BimiLogo logoUrl={result.bimi.logoUrl} domain={result.domain} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-900 text-sm truncate">{result.domain}</div>
                                      <div className="text-sm font-medium text-gray-800 truncate mb-1">Welcome to our newsletter!</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="px-4 py-4">
                                  <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div><div className="flex-1"><div className="font-semibold text-gray-900 text-sm">Another Sender</div><div className="text-sm text-gray-600">A regular email example</div></div></div>
                                </div>
                                <div className="px-4 py-4">
                                  <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div><div className="flex-1"><div className="font-semibold text-gray-900 text-sm">Third Email</div><div className="text-sm text-gray-600">Another regular email</div></div></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            ) : <Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{result.bimi.errors[0] || 'No BIMI record found.'}</AlertDescription></Alert>}
          </div>
        );
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Lookup History</h2>
      <Tabs defaultValue="spf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-50">
          <TabsTrigger value="spf" className="flex items-center gap-2"><Shield className="h-4 w-4" />SPF</TabsTrigger>
          <TabsTrigger value="dmarc" className="flex items-center gap-2"><Mail className="h-4 w-4" />DMARC</TabsTrigger>
          <TabsTrigger value="bimi" className="flex items-center gap-2"><Image className="h-4 w-4" />BIMI</TabsTrigger>
        </TabsList>
        <div className="mt-4 space-y-4">
          {results.map(result => (
            <div key={result.id}>
                <TabsContent value="spf" className="m-0">{renderDomainCard(result, renderContentForTab(result, 'SPF'))}</TabsContent>
                <TabsContent value="dmarc" className="m-0">{renderDomainCard(result, renderContentForTab(result, 'DMARC'))}</TabsContent>
                <TabsContent value="bimi" className="m-0">{renderDomainCard(result, renderContentForTab(result, 'BIMI'))}</TabsContent>
            </div>
          ))}
        </div>
      </Tabs>
    </div>
  );
};
