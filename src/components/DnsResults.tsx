
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DomainResult } from '@/types/domain';
import { Shield, Mail, Image } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Lookup History</h2>
      <Tabs defaultValue="spf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-50">
          <TabsTrigger value="spf" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            SPF
          </TabsTrigger>
          <TabsTrigger value="dmarc" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            DMARC
          </TabsTrigger>
          <TabsTrigger value="bimi" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            BIMI
          </TabsTrigger>
        </TabsList>
        <TabsContent value="spf" className="mt-4">
          {results.filter(r => r.lookupType === 'SPF' || r.lookupType === 'CNAME').map(result => 
            renderDomainCard(result, <SpfSection result={result} />)
          )}
        </TabsContent>
        <TabsContent value="dmarc" className="mt-4">
          {results.filter(r => r.lookupType === 'DMARC' || r.lookupType === 'CNAME').map(result => 
            renderDomainCard(result, <DmarcSection result={result} />)
          )}
        </TabsContent>
        <TabsContent value="bimi" className="mt-4">
          {results.filter(r => r.lookupType === 'BIMI' || r.lookupType === 'CNAME').map(result => 
            renderDomainCard(result, <BimiSection result={result} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
