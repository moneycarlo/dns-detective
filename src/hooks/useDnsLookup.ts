import { useState } from 'react';
import { DomainResult, LookupType } from '@/types/domain';
import { performDnsLookup, performActualDnsLookup } from '@/services/dnsLookupService';

export const useDnsLookup = () => {
  const [results, setResults] = useState<DomainResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLookup = async (domainList: string[], lookupType: LookupType) => {
    setIsLoading(true);
    
    const newLookups = await performDnsLookup(domainList, lookupType);
    setResults(prev => [...newLookups, ...prev]);

    for (const lookup of newLookups) {
      try {
        const actualResult = await performActualDnsLookup(lookup.domain, lookupType);
        setResults(prev => 
          prev.map(r => (r.id === lookup.id ? { ...actualResult, id: lookup.id, lookupType } : r))
        );
      } catch (error) {
        console.error(`❌ DNS lookup failed for ${lookup.domain}:`, error);
        setResults(prev => 
          prev.map(r => (r.id === lookup.id ? { ...r, status: 'error' } : r))
        );
      }
    }
    setIsLoading(false);
  };

  return { results, isLoading, handleLookup };
};
