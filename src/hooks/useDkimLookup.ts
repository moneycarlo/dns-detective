import { useState } from 'react';
import { DkimEntry, DkimResult } from '@/types/dkim';
import { performDkimLookup } from '@/services/dkimService';

type DkimFormat = 'selector:domain' | 'domain:selector' | 'entirestring';

export const useDkimLookup = () => {
  const [results, setResults] = useState<DkimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const parseDkimEntries = (input: string, format: DkimFormat): DkimEntry[] => {
    const lines = input.trim().split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      let selector: string;
      let domain: string;
      
      // Auto-detect format mismatches
      const hasColon = trimmedLine.includes(':');
      const hasDomainkey = trimmedLine.includes('._domainkey.');
      
      if (format === 'entirestring') {
        if (hasDomainkey) {
          const parts = trimmedLine.split('._domainkey.');
          if (parts.length !== 2) {
            throw new Error(`Invalid format on line ${index + 1}: "${trimmedLine}". Expected format: selector._domainkey.domain.com`);
          }
          selector = parts[0];
          domain = parts[1];
        } else if (hasColon) {
          // Auto-detect colon format in entire string mode
          throw new Error(`Format mismatch on line ${index + 1}: Found colon format but entire string mode is selected. Try switching to Selector:Domain or Domain:Selector format.`);
        } else {
          throw new Error(`Invalid format on line ${index + 1}: "${trimmedLine}". Expected format: selector._domainkey.domain.com`);
        }
      } else if (format === 'selector:domain') {
        if (hasColon) {
          const parts = trimmedLine.split(':');
          if (parts.length !== 2) {
            throw new Error(`Invalid format on line ${index + 1}: "${trimmedLine}". Expected format: selector:domain.com`);
          }
          selector = parts[0].trim();
          domain = parts[1].trim();
        } else if (hasDomainkey) {
          throw new Error(`Format mismatch on line ${index + 1}: Found entire string format but Selector:Domain mode is selected. Try switching to Entire String format.`);
        } else {
          throw new Error(`Invalid format on line ${index + 1}: "${trimmedLine}". Expected format: selector:domain.com`);
        }
      } else if (format === 'domain:selector') {
        if (hasColon) {
          const parts = trimmedLine.split(':');
          if (parts.length !== 2) {
            throw new Error(`Invalid format on line ${index + 1}: "${trimmedLine}". Expected format: domain.com:selector`);
          }
          domain = parts[0].trim();
          selector = parts[1].trim();
        } else if (hasDomainkey) {
          throw new Error(`Format mismatch on line ${index + 1}: Found entire string format but Domain:Selector mode is selected. Try switching to Entire String format.`);
        } else {
          throw new Error(`Invalid format on line ${index + 1}: "${trimmedLine}". Expected format: domain.com:selector`);
        }
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

  const handleLookup = async (input: string, format: DkimFormat) => {
    try {
      setIsLoading(true);
      const entries = parseDkimEntries(input, format);
      
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