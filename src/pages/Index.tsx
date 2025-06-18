
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainInput } from '@/components/DomainInput';
import { DnsResults } from '@/components/DnsResults';
import { ExportButton } from '@/components/ExportButton';
import { Legend } from '@/components/Legend';
import { Header } from '@/components/Header';
import { useDnsLookup } from '@/hooks/useDnsLookup';
import { FileText } from 'lucide-react';

const Index = () => {
  const [domains, setDomains] = useState<string[]>([]);
  const { results, isLoading, handleLookup } = useDnsLookup();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header />

        {/* Domain Input Section - Now at the top */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">DNS Security Analyzer</CardTitle>
            <CardDescription className="text-center">
              Enter up to 10 domains to analyze their DNS security records (SPF, DMARC, BIMI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DomainInput
                  domains={domains}
                  onDomainsChange={setDomains}
                  onLookup={handleLookup}
                  isLoading={isLoading}
                />
              </div>
              
              {results.length > 0 && (
                <div className="flex flex-col justify-center">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Export Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ExportButton results={results} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {results.length > 0 && (
            <DnsResults results={results} />
          )}
          
          <Legend />
        </div>
      </div>
    </div>
  );
};

export default Index;
