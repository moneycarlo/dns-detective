import { queryDns } from './dnsQuery';
import { DkimEntry, DkimResult } from '@/types/dkim';

const parseDkimRecord = (record: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const cleanRecord = record.replace(/\s+/g, '');
  
  // Split by semicolon and parse key=value pairs
  const pairs = cleanRecord.split(';').filter(pair => pair.trim());
  
  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length > 0) {
      params[key.trim()] = valueParts.join('=').trim();
    }
  }
  
  return params;
};

const isValidBase64 = (str: string): boolean => {
  try {
    // Remove any whitespace
    const cleaned = str.replace(/\s+/g, '');
    // Check if it matches base64 pattern
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(cleaned)) return false;
    
    // Try to decode
    atob(cleaned);
    return true;
  } catch {
    return false;
  }
};

const validatePublicKey = (publicKey: string, keyType: string): boolean => {
  if (!publicKey) return false;
  
  // Empty p= means key is revoked (valid but revoked)
  if (publicKey === '') return true;
  
  if (!isValidBase64(publicKey)) return false;
  
  try {
    const decoded = atob(publicKey.replace(/\s+/g, ''));
    const keyBytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      keyBytes[i] = decoded.charCodeAt(i);
    }
    
    if (keyType === 'rsa') {
      // RSA public keys should be at least 512 bits (64 bytes) and typically much larger
      // ASN.1 DER encoded RSA keys start with specific byte sequences
      return keyBytes.length >= 64;
    } else if (keyType === 'ed25519') {
      // Ed25519 public keys are exactly 32 bytes
      return keyBytes.length === 32;
    }
    
    return false;
  } catch {
    return false;
  }
};

export const validateDkimRecord = (record: string): boolean => {
  if (!record) return false;
  
  try {
    const params = parseDkimRecord(record);
    
    // Check required parameters
    if (!params.p) return false;
    
    // Validate key type (defaults to rsa if not specified)
    const keyType = params.k || 'rsa';
    if (!['rsa', 'ed25519'].includes(keyType)) return false;
    
    // Validate public key
    if (!validatePublicKey(params.p, keyType)) return false;
    
    // Validate version if present (should be DKIM1)
    if (params.v && params.v !== 'DKIM1') return false;
    
    // Validate hash algorithms if present
    if (params.h) {
      const validHashes = ['sha1', 'sha256'];
      const hashes = params.h.split(':').map(h => h.trim());
      if (!hashes.every(h => validHashes.includes(h))) return false;
    }
    
    // Validate service type if present
    if (params.s && !['email', '*'].includes(params.s)) return false;
    
    // Validate flags if present
    if (params.t) {
      const validFlags = ['y', 's'];
      const flags = params.t.split(':').map(f => f.trim());
      if (!flags.every(f => validFlags.includes(f))) return false;
    }
    
    return true;
  } catch {
    return false;
  }
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