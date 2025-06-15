
import { useState } from 'react';
import { DomainResult } from '@/types/domain';
import { performDnsLookup, simulateDnsLookup } from '@/services/dnsLookupService';

export const useDnsLookup = () => {
  const [results, setResults] = useState<DomainResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLookup = async (domainList: string[]) => {
    setIsLoading(true);
    
    const initialResults = await performDnsLookup(domainList);
    setResults(initialResults);

    // Simulate DNS lookups (in a real app, this would call actual DNS APIs)
    for (let i = 0; i < domainList.length; i++) {
      const domain = domainList[i];
      
      try {
        const mockResult = await simulateDnsLookup(domain);
        
        setResults(prev => 
          prev.map((result, index) => 
            index === i ? { ...mockResult, status: 'completed' as const } : result
          )
        );
      } catch (error) {
        setResults(prev => 
          prev.map((result, index) => 
            index === i ? { ...result, status: 'error' as const } : result
          )
        );
      }
    }
    
    setIsLoading(false);
  };

  return {
    results,
    isLoading,
    handleLookup
  };
};
