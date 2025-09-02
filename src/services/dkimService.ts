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

// DER parsing utilities for public key validation
const parseDerLength = (data: Uint8Array, offset: number): { length: number; bytesUsed: number } => {
  if (offset >= data.length) throw new Error('Unexpected end of data');
  
  const firstByte = data[offset];
  if ((firstByte & 0x80) === 0) {
    // Short form
    return { length: firstByte, bytesUsed: 1 };
  } else {
    // Long form
    const lengthBytes = firstByte & 0x7f;
    if (lengthBytes === 0 || lengthBytes > 4) throw new Error('Invalid length encoding');
    
    let length = 0;
    for (let i = 0; i < lengthBytes; i++) {
      if (offset + 1 + i >= data.length) throw new Error('Unexpected end of data');
      length = (length << 8) | data[offset + 1 + i];
    }
    return { length, bytesUsed: 1 + lengthBytes };
  }
};

const parseOid = (data: Uint8Array, offset: number, length: number): string => {
  if (offset + length > data.length) throw new Error('OID extends beyond data');
  
  const oidBytes = data.slice(offset, offset + length);
  const components: number[] = [];
  
  if (oidBytes.length > 0) {
    const firstByte = oidBytes[0];
    components.push(Math.floor(firstByte / 40));
    components.push(firstByte % 40);
    
    let i = 1;
    while (i < oidBytes.length) {
      let value = 0;
      do {
        if (i >= oidBytes.length) break;
        value = (value << 7) | (oidBytes[i] & 0x7f);
        i++;
      } while (i <= oidBytes.length && (oidBytes[i - 1] & 0x80) !== 0);
      components.push(value);
    }
  }
  
  return components.join('.');
};

const validatePublicKey = (publicKey: string, keyType: string): { valid: boolean; error?: string } => {
  if (!publicKey) return { valid: false, error: 'Missing public key' };
  
  // Empty p= means key is revoked (valid but revoked)
  if (publicKey === '') return { valid: true };
  
  if (!isValidBase64(publicKey)) return { valid: false, error: 'Invalid base64 encoding' };
  
  try {
    const decoded = atob(publicKey.replace(/\s+/g, ''));
    const keyBytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      keyBytes[i] = decoded.charCodeAt(i);
    }
    
    // Parse DER structure for SubjectPublicKeyInfo
    let offset = 0;
    
    // Check for SEQUENCE tag
    if (keyBytes[offset] !== 0x30) {
      return { valid: false, error: 'Invalid DER structure: expected SEQUENCE' };
    }
    offset++;
    
    const { length: totalLength, bytesUsed } = parseDerLength(keyBytes, offset);
    offset += bytesUsed;
    
    if (offset + totalLength !== keyBytes.length) {
      return { valid: false, error: 'Invalid DER structure: length mismatch' };
    }
    
    // Parse AlgorithmIdentifier
    if (keyBytes[offset] !== 0x30) {
      return { valid: false, error: 'Invalid DER structure: expected AlgorithmIdentifier SEQUENCE' };
    }
    offset++;
    
    const { length: algIdLength, bytesUsed: algIdBytesUsed } = parseDerLength(keyBytes, offset);
    offset += algIdBytesUsed;
    
    // Parse algorithm OID
    if (keyBytes[offset] !== 0x06) {
      return { valid: false, error: 'Invalid DER structure: expected OID' };
    }
    offset++;
    
    const { length: oidLength, bytesUsed: oidBytesUsed } = parseDerLength(keyBytes, offset);
    offset += oidBytesUsed;
    
    const algorithmOid = parseOid(keyBytes, offset, oidLength);
    offset += oidLength;
    
    // Skip algorithm parameters if present
    offset += algIdLength - (oidBytesUsed + oidLength);
    
    // Parse BIT STRING containing the actual public key
    if (keyBytes[offset] !== 0x03) {
      return { valid: false, error: 'Invalid DER structure: expected BIT STRING' };
    }
    offset++;
    
    const { length: bitStringLength } = parseDerLength(keyBytes, offset);
    
    if (keyType === 'rsa') {
      // RSA OID: 1.2.840.113549.1.1.1
      if (algorithmOid !== '1.2.840.113549.1.1.1') {
        return { valid: false, error: `Invalid algorithm OID for RSA: expected 1.2.840.113549.1.1.1, got ${algorithmOid}` };
      }
      
      // RSA keys should be reasonably sized (at least 512 bits)
      if (bitStringLength < 64) {
        return { valid: false, error: 'RSA key too small (minimum 512 bits required)' };
      }
      
      return { valid: true };
    } else if (keyType === 'ed25519') {
      // Ed25519 OID: 1.3.101.112
      if (algorithmOid !== '1.3.101.112') {
        return { valid: false, error: `Invalid algorithm OID for Ed25519: expected 1.3.101.112, got ${algorithmOid}` };
      }
      
      // Ed25519 public keys are exactly 32 bytes + 1 unused bit byte
      if (bitStringLength !== 33) {
        return { valid: false, error: `Invalid Ed25519 key length: expected 33 bytes, got ${bitStringLength}` };
      }
      
      return { valid: true };
    }
    
    return { valid: false, error: `Unsupported key type: ${keyType}` };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Failed to parse public key' };
  }
};

export const validateDkimRecord = (record: string): { valid: boolean; error?: string } => {
  if (!record) return { valid: false, error: 'No DKIM record provided' };
  
  try {
    const params = parseDkimRecord(record);
    
    // Check required parameters
    if (!params.p) return { valid: false, error: 'Missing required p= parameter (public key)' };
    
    // Validate key type (defaults to rsa if not specified)
    const keyType = params.k || 'rsa';
    if (!['rsa', 'ed25519'].includes(keyType)) {
      return { valid: false, error: `Unsupported key type: ${keyType}. Supported types: rsa, ed25519` };
    }
    
    // Validate public key
    const keyValidation = validatePublicKey(params.p, keyType);
    if (!keyValidation.valid) {
      return { valid: false, error: `Invalid public key: ${keyValidation.error}` };
    }
    
    // Validate version if present (should be DKIM1)
    if (params.v && params.v !== 'DKIM1') {
      return { valid: false, error: `Invalid version: ${params.v}. Expected: DKIM1` };
    }
    
    // Validate hash algorithms if present
    if (params.h) {
      const validHashes = ['sha1', 'sha256'];
      const hashes = params.h.split(':').map(h => h.trim());
      const invalidHashes = hashes.filter(h => !validHashes.includes(h));
      if (invalidHashes.length > 0) {
        return { valid: false, error: `Invalid hash algorithms: ${invalidHashes.join(', ')}. Supported: ${validHashes.join(', ')}` };
      }
    }
    
    // Validate service type if present
    if (params.s && !['email', '*'].includes(params.s)) {
      return { valid: false, error: `Invalid service type: ${params.s}. Supported: email, *` };
    }
    
    // Validate flags if present
    if (params.t) {
      const validFlags = ['y', 's'];
      const flags = params.t.split(':').map(f => f.trim());
      const invalidFlags = flags.filter(f => !validFlags.includes(f));
      if (invalidFlags.length > 0) {
        return { valid: false, error: `Invalid flags: ${invalidFlags.join(', ')}. Supported: ${validFlags.join(', ')}` };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Failed to parse DKIM record' };
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
    const validation = validateDkimRecord(record);

    return {
      ...entry,
      record,
      valid: validation.valid,
      status: 'completed',
      error: validation.valid ? undefined : validation.error
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