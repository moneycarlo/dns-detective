
import React from 'react';
import { Shield } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center items-center gap-3">
        <Shield className="h-12 w-12 text-blue-600" />
        <h1 className="text-4xl font-bold text-gray-900">DNS Security Lookup</h1>
      </div>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Comprehensive DNS analysis for SPF, DMARC, and BIMI records with nested lookups and certificate validation
      </p>
    </div>
  );
};
