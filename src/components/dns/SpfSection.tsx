
import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DomainResult } from '@/types/domain';
import { LookupDetails } from './LookupDetails';

interface SpfSectionProps {
  result: DomainResult;
}

export const SpfSection: React.FC<SpfSectionProps> = ({ result }) => {
  return (
    <div>
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Shield size={16}/>
        SPF
      </h3>
      {result.spf.record ? (
        <div className="mt-2 space-y-2">
          <code className="block bg-gray-100 p-2 rounded-md text-sm break-all">{result.spf.record}</code>
          <div className="text-sm font-medium">
            DNS Lookups: <Badge variant={result.spf.exceedsLookupLimit ? 'destructive' : 'secondary'}>{result.spf.lookupCount} / 10</Badge>
          </div>
          {result.spf.lookupDetails && result.spf.lookupDetails.length > 0 && <LookupDetails details={result.spf.lookupDetails} />}
          {result.spf.errors.map((e,i) => 
            <Alert key={i} variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{e}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <Alert className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{result.spf.errors[0] || 'No SPF record found.'}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
