import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult, LookupDetail } from '@/types/domain';
import { Shield, Mail, Image, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const BimiLogo: React.FC<{ logoUrl: string | null; domain: string }> = ({ logoUrl, domain }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  if (!logoUrl || hasError) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-bold text-xl">
        {domain.charAt(0).toUpperCase()}
      </div>
    );
  }

  return <img src={logoUrl} alt={`${domain} BIMI logo`} className="w-full h-full object-contain" onError={() => setHasError(true)} />;
};

const LookupDetails: React.FC<{ details: LookupDetail[] }> = ({ details }) => {
  if (!details?.length) return null;
  return (
    <div className="space-y-1">
      {details.map((detail, index) => (
        <div key={`${detail.number}-${index}`} className="ml-4 pl-4 border-l-2">
          <div className="text-sm">
            <span className="font-mono text-gray-500">{detail.number}.</span> {detail.type}: <span className="font-medium">{detail.domain}</span>
          </div>
          {detail.nested && <LookupDetails details={detail.nested} />}
        </div>
      ))}
    </div>
  );
};

export const DnsResults: React.FC<{ results: DomainResult[] }> = ({ results }) => {
  const renderStatus = (record: { record: string | null, errors: string[], valid: boolean }) => {
    if (record.errors.length > 0 && !record.record) return <Badge variant="outline">Not Found</Badge>;
    if (record.errors.length > 0) return <Badge variant="destructive">Error</Badge>;
    if (record.valid) return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    return <Badge>Found</Badge>;
  }

  return (
    <div className="space-y-6">
      {results.map((result) => (
        <Card key={result.domain}>
          <CardHeader>
            <CardTitle>{result.domain}</CardTitle>
            {result.status === 'pending' && <p className="text-sm text-gray-500">Loading...</p>}
          </CardHeader>
          {result.status !== 'pending' && (
            <CardContent className="space-y-6">
              <div id="spf">
                <h3 className="font-semibold flex items-center gap-2"><Shield size={16}/>SPF {renderStatus(result.spf)}</h3>
                {result.spf.record && <code className="block bg-gray-100 p-2 rounded-md text-xs mt-2">{result.spf.record}</code>}
                {result.spf.errors.map((e,i) => <p key={i} className="text-red-600 text-sm mt-1">{e}</p>)}
                {result.spf.lookupCount > 0 && 
                  <div className="mt-2">
                    <p className="text-sm">DNS Lookups: <Badge variant={result.spf.exceedsLookupLimit ? 'destructive' : 'secondary'}>{result.spf.lookupCount} / 10</Badge></p>
                    <LookupDetails details={result.spf.lookupDetails} />
                  </div>
                }
              </div>
              <div id="dmarc">
                <h3 className="font-semibold flex items-center gap-2"><Mail size={16}/>DMARC {renderStatus(result.dmarc)}</h3>
                {result.dmarc.record && <code className="block bg-gray-100 p-2 rounded-md text-xs mt-2">{result.dmarc.record}</code>}
                {result.dmarc.errors.map((e,i) => <p key={i} className="text-red-600 text-sm mt-1">{e}</p>)}
                {result.dmarc.warnings.map((w,i) => <p key={i} className="text-yellow-600 text-sm mt-1">{w}</p>)}
              </div>
              <div id="bimi">
                <h3 className="font-semibold flex items-center gap-2"><Image size={16}/>BIMI {renderStatus(result.bimi)}</h3>
                {result.bimi.record && <code className="block bg-gray-100 p-2 rounded-md text-xs mt-2">{result.bimi.record}</code>}
                {result.bimi.errors.map((e,i) => <p key={i} className="text-red-600 text-sm mt-1">{e}</p>)}
                {result.bimi.logoUrl && <div className="mt-2 w-24 h-24"><BimiLogo logoUrl={result.bimi.logoUrl} domain={result.domain}/></div>}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
