
import React from 'react';
import { LookupDetail } from '@/types/domain';

interface LookupDetailsProps {
  details: LookupDetail[];
}

export const LookupDetails: React.FC<LookupDetailsProps> = ({ details }) => {
  if (!details?.length) return null;
  
  return (
    <div className="space-y-2 pt-2">
      {details.map((detail) => (
        <div key={`${detail.number}-${detail.domain}`} className="ml-4 pl-4 border-l-2">
          <div className="text-sm">
            <span className="font-mono text-gray-500">{detail.number}.</span> {detail.type}: <span className="font-medium">{detail.domain}</span>
          </div>
          {detail.record && <code className="block bg-gray-50 p-1.5 rounded-md text-xs mt-1 ml-4 break-all">{detail.record}</code>}
          {detail.nested && detail.nested.length > 0 && <div className="mt-1"><LookupDetails details={detail.nested} /></div>}
        </div>
      ))}
    </div>
  );
};
