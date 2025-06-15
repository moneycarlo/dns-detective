
import { useState } from 'react';
import { DomainResult } from '@/types/domain';
import { performDnsLookup, performActualDnsLookup } from '@/services/dnsLookupService';

export const useDnsLookup = () => {
  const [results, setResults] = useState<DomainResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLookup = async (domainList: string[]) => {
    setIsLoading(true);
    
    const initialResults = await performDnsLookup(domainList);
    setResults(initialResults);

    // Perform actual DNS lookups
    for (let i = 0; i < domainList.length; i++) {
      const domain = domainList[i];
      
      try {
        console.log(`🔍 Looking up DNS records for: ${domain}`);
        const actualResult = await performActualDnsLookup(domain);
        
        setResults(prev => 
          prev.map((result, index) => 
            index === i ? actualResult : result
          )
        );
      } catch (error) {
        console.error(`❌ DNS lookup failed for ${domain}:`, error);
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
