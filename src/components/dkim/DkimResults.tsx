import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { DkimResult } from '@/types/dkim';

interface DkimResultsProps {
  results: DkimResult[];
}

export const DkimResults: React.FC<DkimResultsProps> = ({ results }) => {
  const getStatusIcon = (result: DkimResult) => {
    if (result.status === 'pending') {
      return <Clock className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
    if (result.status === 'error') {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    return result.valid ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = (result: DkimResult) => {
    if (result.status === 'pending') {
      return <Badge variant="secondary">Checking...</Badge>;
    }
    if (result.status === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    }
    return result.valid ? 
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid</Badge> : 
      <Badge variant="destructive">Invalid</Badge>;
  };

  const validCount = results.filter(r => r.valid && r.status === 'completed').length;
  const errorCount = results.filter(r => !r.valid && r.status === 'completed').length;
  const pendingCount = results.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{validCount}</p>
                <p className="text-sm text-muted-foreground">Valid Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{errorCount}</p>
                <p className="text-sm text-muted-foreground">Invalid/Missing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <Card key={result.id} className={`transition-colors ${
            result.status === 'completed' ? 
              (result.valid ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50') : 
              'border-muted'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(result)}
                  <span className="font-mono text-base">
                    {result.selector}._domainkey.{result.domain}
                  </span>
                </CardTitle>
                {getStatusBadge(result)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Selector: 
                  <code className="text-sm bg-muted px-2 py-1 rounded">{result.selector}</code> </p>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Domain: 
                  <code className="text-sm bg-muted px-2 py-1 rounded">{result.domain}</code> </p>
                </div>
                
                {result.record && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">DKIM Record:</p>
                    <code className="text-xs bg-muted p-2 rounded block break-all whitespace-pre-wrap">
                      {result.record}
                    </code>
                  </div>
                )}
                
                {result.error && (
                  <div>
                    <p className="text-sm font-medium text-destructive mb-1">Error:</p>
                    <p className="text-sm text-destructive">{result.error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
