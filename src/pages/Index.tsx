
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DomainInput } from '@/components/DomainInput';
import { DnsResults } from '@/components/DnsResults';
import { ExportButton } from '@/components/ExportButton';
import { Legend } from '@/components/Legend';
import { Header } from '@/components/Header';
import { useDnsLookup } from '@/hooks/useDnsLookup';
import { Search, FileText } from 'lucide-react';

const Index = () => {
  const [domains, setDomains] = useState<string[]>([]);
  const { results, isLoading, handleLookup } = useDnsLookup();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Domain Lookup
                </CardTitle>
                <CardDescription>
                  Enter up to 10 domains to analyze their DNS security records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainInput
                  domains={domains}
                  onDomainsChange={setDomains}
                  onLookup={handleLookup}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Export Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExportButton results={results} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3 space-y-6">
            {results.length > 0 && (
              <DnsResults results={results} />
            )}
            
            <Legend />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
