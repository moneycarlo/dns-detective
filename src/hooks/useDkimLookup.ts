import { useState } from 'react';
import { DkimEntry, DkimResult } from '@/types/dkim';
import { performDkimLookup } from '@/services/dkimService';

export const useDkimLookup = () => {
  const [results, setResults] = useState<DkimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const parseDkimEntries = (input: string, useEntireString: boolean = false): DkimEntry[] => {
    const lines = input.trim().split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      let selector: string;
      let domain: string;
      
      if (useEntireString) {
        // Parse entire string format: selector._domainkey.domain.com
        const parts = trimmedLine.split('._domainkey.');
        if (parts.length !== 2) {
          throw new Error(`Invalid format on line ${index + 1}: "${trimmedLine}". Expected format: selector._domainkey.domain.com`);
        }
        selector = parts[0];
        domain = parts[1];
      } else {
        // Parse domain:selector format
        const parts = trimmedLine.split(':');
        if (parts.length !== 2) {
          throw new Error(`Invalid format on line ${index + 1}: "${trimmedLine}". Expected format: domain.com:selector`);
        }
        domain = parts[0].trim();
        selector = parts[1].trim();
      }
      
      if (!selector || !domain) {
        throw new Error(`Invalid format on line ${index + 1}: Both selector and domain are required.`);
      }
      
      return {
        id: `dkim-${Date.now()}-${index}`,
        selector,
        domain,
        originalInput: trimmedLine
      };
    });
  };

  const handleLookup = async (input: string, useEntireString: boolean = false) => {
    try {
      setIsLoading(true);
      const entries = parseDkimEntries(input, useEntireString);
      
      if (entries.length > 40) {
        throw new Error('Maximum 40 domains allowed');
      }

      // Initialize results with pending status
      const pendingResults: DkimResult[] = entries.map(entry => ({
        ...entry,
        record: null,
        valid: false,
        status: 'pending' as const
      }));
      
      setResults(pendingResults);

      // Perform lookups in parallel with some concurrency control
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < entries.length; i += batchSize) {
        batches.push(entries.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (entry) => {
          const result = await performDkimLookup(entry);
          
          setResults(prev => 
            prev.map(r => r.id === entry.id ? result : r)
          );
          
          return result;
        });

        await Promise.all(batchPromises);
      }
    } catch (error) {
      console.error('DKIM lookup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, handleLookup };
};