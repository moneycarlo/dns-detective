import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DkimInput } from '@/components/dkim/DkimInput';
import { DkimResults } from '@/components/dkim/DkimResults';
import { DkimExport } from '@/components/dkim/DkimExport';
import { useDkimLookup } from '@/hooks/useDkimLookup';
import { FileText, Key } from 'lucide-react';

const DkimLookup = () => {
  const { results, isLoading, handleLookup } = useDkimLookup();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-3">
            <Key className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Bulk DKIM Lookup</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Validate DKIM records for up to 40 domains
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">DKIM Record Validator</CardTitle>
            <CardDescription className="text-center">
              Enter domains and DKIM selectors to validate their DNS records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <DkimInput onLookup={handleLookup} isLoading={isLoading} />
              </div>
              
              {results.length > 0 && (
                <div className="lg:col-span-1 flex flex-col justify-center">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Export Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DkimExport results={results} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <DkimResults results={results} />
        )}
      </div>
    </div>
  );
};

export default DkimLookup;
