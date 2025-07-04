
import React from 'react';
import { Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult } from '@/types/domain';

interface DmarcSectionProps {
  result: DomainResult;
}

export const DmarcSection: React.FC<DmarcSectionProps> = ({ result }) => {
  return (
    <div>
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Mail size={16}/>
        DMARC
      </h3>
      {result.dmarc.record ? (
        <div className="mt-2 space-y-2">
          <code className="block bg-gray-100 p-2 rounded-md text-sm break-all">{result.dmarc.record}</code>
          {result.dmarc.errors.map((e,i) => 
            <Alert key={i} variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{e}</AlertDescription>
            </Alert>
          )}
          {result.dmarc.warnings.map((w,i) => 
            <Alert key={i} variant="default" className="mt-2 bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{w}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <Alert className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{result.dmarc.errors[0] || 'No DMARC record found.'}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
