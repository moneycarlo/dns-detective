import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult, LookupDetail, LookupType } from '@/types/domain';
import { Shield, Mail, Image, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const BimiLogo: React.FC<{ logoUrl: string | null; domain: string }> = ({ logoUrl, domain }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [logoUrl]);

  if (!logoUrl || hasError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
        {domain.charAt(0).toUpperCase()}
      </div>
    );
  }
  return <img src={logoUrl} alt={`${domain} BIMI logo`} className="w-full h-full object-contain" onError={() => setHasError(true)} />;
};

const LookupDetails: React.FC<{ details: LookupDetail[] }> = ({ details }) => {
  if (!details?.length) return null;
  return (
    <div className="space-y-2 pt-2">
      {details.map((detail, index) => (
        <div key={`${detail.number}-${index}`} className="ml-4 pl-4 border-l-2">
          <div className="text-sm">
            <span className="font-mono text-gray-500">{detail.number}.</span> {detail.type}: <span className="font-medium">{detail.domain}</span>
          </div>
          {detail.record && <code className="block bg-gray-50 p-1.5 rounded-md text-xs mt-1 ml-4">{detail.record}</code>}
          {detail.nested && detail.nested.length > 0 && <div className="mt-1"><LookupDetails details={detail.nested} /></div>}
        </div>
      ))}
    </div>
  );
};

export const DnsResults: React.FC<{ results: DomainResult[] }> = ({ results }) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Lookup History</h2>
      {results.map((result) => (
        <Card key={result.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{result.domain}</CardTitle>
              <Badge variant="secondary">{result.lookupType}</Badge>
            </div>
            {result.status === 'pending' && <p className="text-sm text-gray-500 flex items-center gap-2"><Clock size={14}/>Analyzing...</p>}
          </CardHeader>
          {result.status !== 'pending' && (
            <CardContent className="space-y-6">
              {(result.lookupType === 'ALL' || result.lookupType === 'SPF') && (
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Shield size={16}/>SPF</h3>
                  {result.spf.record ? (
                    <div className="mt-2 space-y-2">
                      <code className="block bg-gray-100 p-2 rounded-md text-sm">{result.spf.record}</code>
                      <p className="text-sm font-medium">DNS Lookups: <Badge variant={result.spf.exceedsLookupLimit ? 'destructive' : 'secondary'}>{result.spf.lookupCount} / 10</Badge></p>
                      {result.spf.lookupDetails && result.spf.lookupDetails.length > 0 && <LookupDetails details={result.spf.lookupDetails} />}
                      {result.spf.errors.map((e,i) => <Alert key={i} variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{e}</AlertDescription></Alert>)}
                    </div>
                  ) : <Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{result.spf.errors[0] || 'No SPF record found.'}</AlertDescription></Alert>}
                </div>
              )}
              {(result.lookupType === 'ALL' || result.lookupType === 'DMARC') && (
                 <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Mail size={16}/>DMARC</h3>
                  {result.dmarc.record ? (
                     <div className="mt-2 space-y-2">
                      <code className="block bg-gray-100 p-2 rounded-md text-sm">{result.dmarc.record}</code>
                      {result.dmarc.errors.map((e,i) => <Alert key={i} variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{e}</AlertDescription></Alert>)}
                      {result.dmarc.warnings.map((w,i) => <Alert key={i} variant="default" className="mt-2 bg-yellow-50 border-yellow-200 text-yellow-800"><AlertTriangle className="h-4 w-4" /><AlertDescription>{w}</AlertDescription></Alert>)}
                    </div>
                  ) : <Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{result.dmarc.errors[0] || 'No DMARC record found.'}</AlertDescription></Alert>}
                </div>
              )}
               {(result.lookupType === 'ALL' || result.lookupType === 'BIMI') && (
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Image size={16}/>BIMI</h3>
                  {result.bimi.record ? (
                    <div className="mt-2 space-y-4">
                      <code className="block bg-gray-100 p-2 rounded-md text-sm">{result.bimi.record}</code>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                          <h4 className="font-medium mb-2">Certificate</h4>
                          {!result.bimi.certificateUrl ? (
                             <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>No certificate (`a=`) tag found. A VMC is required by most providers.</AlertDescription></Alert>
                          ) : (
                             <p className="text-sm">Certificate found, but expiration and authority cannot be checked.</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Email Client Preview</h4>
                          <div className="p-4 bg-gray-200 rounded-2xl">
                             <div className="p-1 bg-white rounded-xl shadow-inner">
                                <div className="flex items-center gap-3 p-3 border-b">
                                  <div className="w-10 h-10 flex-shrink-0 rounded-full"><BimiLogo logoUrl={result.bimi.logoUrl} domain={result.domain} /></div>
                                  <div className="flex-grow min-w-0">
                                    <p className="font-bold truncate text-sm">{result.domain}</p>
                                    <p className="text-xs text-gray-600 truncate">Welcome to our newsletter!</p>
                                  </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-gray-500">Hi there, thanks for signing up...</p>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                      {result.bimi.errors.map((e,i) => <Alert key={i} variant="destructive" className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{e}</AlertDescription></Alert>)}
                    </div>
                  ) : <Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{result.bimi.errors[0] || 'No BIMI record found.'}</AlertDescription></Alert>}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
