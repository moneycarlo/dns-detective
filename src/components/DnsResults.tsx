
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DomainResult } from '@/types/domain';
import { Shield, Mail, Image, Server } from 'lucide-react';
import { SpfSection } from './dns/SpfSection';
import { DmarcSection } from './dns/DmarcSection';
import { BimiSection } from './dns/BimiSection';

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
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing DNS records...</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );

  const renderSection = (result: DomainResult) => {
    if (result.lookupType === 'SPF' || (result.lookupType === 'CNAME' && result.spf.record)) {
      return <SpfSection result={result} />;
    }
    if (result.lookupType === 'DMARC' || (result.lookupType === 'CNAME' && result.dmarc.record)) {
      return <DmarcSection result={result} />;
    }
    if (result.lookupType === 'BIMI' || (result.lookupType === 'CNAME' && result.bimi.record)) {
      return <BimiSection result={result} />;
    }
    if (result.lookupType === 'MX') {
      return (
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Server size={16}/>
            MX Records
          </h3>
          {result.mx.records.length > 0 ? (
            <div className="mt-2 space-y-2">
              {result.mx.records.map((record, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 p-2 rounded-md text-sm">
                  <Badge variant="outline">{record.priority}</Badge>
                  <code>{record.exchange}</code>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-gray-600">{result.mx.errors[0] || 'No MX records found.'}</div>
          )}
        </div>
      );
    }
    if (result.lookupType === 'CNAME') {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">CNAME Record</h3>
            <p className="text-gray-600 mt-2">This domain has a CNAME record and will inherit DNS records from its target.</p>
          </div>
          {result.spf.record && <SpfSection result={result} />}
          {result.dmarc.record && <DmarcSection result={result} />}
          {result.bimi.record && <BimiSection result={result} />}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Lookup History</h2>
      <div className="space-y-4">
        {results.map(result => 
          renderDomainCard(result, renderSection(result))
        )}
      </div>
    </div>
  );
};
