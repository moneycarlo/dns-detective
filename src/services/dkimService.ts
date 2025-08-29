import { queryDns } from './dnsQuery';
import { DkimEntry, DkimResult } from '@/types/dkim';

export const validateDkimRecord = (record: string): boolean => {
  if (!record) return false;
  
  // DKIM records should contain key parameters
  const requiredParams = ['k=', 'p='];
  const hasRequiredParams = requiredParams.some(param => record.includes(param));
  
  // Check for valid key type and public key
  const hasValidStructure = record.includes('k=rsa') || record.includes('k=ed25519');
  const hasPublicKey = record.includes('p=') && record.split('p=')[1]?.trim().length > 10;
  
  return hasRequiredParams && (hasValidStructure || hasPublicKey);
};

export const performDkimLookup = async (entry: DkimEntry): Promise<DkimResult> => {
  const dkimHost = `${entry.selector}._domainkey.${entry.domain}`;
  
  try {
    const response = await queryDns(dkimHost, 'TXT');
    
    if (response.Status !== 0 || !response.Answer || response.Answer.length === 0) {
      return {
        ...entry,
        record: null,
        valid: false,
        status: 'completed',
        error: 'No DKIM record found'
      };
    }

    // Find DKIM record (should contain k= or p=)
    const dkimRecord = response.Answer.find(answer => 
      answer.data && (answer.data.includes('k=') || answer.data.includes('p='))
    );

    if (!dkimRecord) {
      return {
        ...entry,
        record: null,
        valid: false,
        status: 'completed',
        error: 'No valid DKIM record found'
      };
    }

    const record = dkimRecord.data.replace(/['"]/g, '');
    const isValid = validateDkimRecord(record);

    return {
      ...entry,
      record,
      valid: isValid,
      status: 'completed',
      error: isValid ? undefined : 'Invalid DKIM record format'
    };
  } catch (error) {
    return {
      ...entry,
      record: null,
      valid: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'DNS lookup failed'
    };
  }
};