import { ProcessedIp, AggregatedRange, OutputFormat } from '@/types/ip';

// Convert IP address to 32-bit unsigned integer
export const ipToInt = (ip: string): number => {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
};

// Convert 32-bit integer to IP address
export const intToIp = (int: number): string => {
  return [
    (int >>> 24) & 0xFF,
    (int >>> 16) & 0xFF,
    (int >>> 8) & 0xFF,
    int & 0xFF
  ].join('.');
};

// Validate IP address format
export const isValidIp = (ip: string): boolean => {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  for (const part of parts) {
    const num = parseInt(part);
    if (isNaN(num) || num < 0 || num > 255) return false;
  }
  return true;
};

// Parse CIDR notation
export const parseCidr = (cidr: string): { start: string; end: string } | null => {
  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr);
  
  if (!isValidIp(ip) || isNaN(prefix) || prefix < 0 || prefix > 32) {
    return null;
  }
  
  const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const ipInt = ipToInt(ip);
  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | (0xFFFFFFFF >>> prefix)) >>> 0;
  
  return {
    start: intToIp(networkInt),
    end: intToIp(broadcastInt)
  };
};

// Parse IP range
export const parseRange = (range: string): { start: string; end: string } | null => {
  const parts = range.split('-').map(s => s.trim());
  if (parts.length !== 2) return null;
  
  if (!isValidIp(parts[0]) || !isValidIp(parts[1])) return null;
  
  return {
    start: parts[0],
    end: parts[1]
  };
};

// Parse subnet mask notation
export const parseSubnetMask = (ipMask: string): { start: string; end: string } | null => {
  const parts = ipMask.split('/');
  if (parts.length !== 2) return null;
  
  const ip = parts[0].trim();
  const mask = parts[1].trim();
  
  if (!isValidIp(ip) || !isValidIp(mask)) return null;
  
  const maskInt = ipToInt(mask);
  const ipInt = ipToInt(ip);
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
  
  return {
    start: intToIp(networkInt),
    end: intToIp(broadcastInt)
  };
};

// Process input lines into normalized IP ranges
export const processIpInput = (input: string): ProcessedIp[] => {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line);
  const processed: ProcessedIp[] = [];
  
  for (const line of lines) {
    let range: { start: string; end: string } | null = null;
    
    // Try different formats
    if (line.includes('/')) {
      if (line.includes('.') && line.split('/')[1].includes('.')) {
        // Subnet mask format
        range = parseSubnetMask(line);
      } else {
        // CIDR format
        range = parseCidr(line);
      }
    } else if (line.includes('-')) {
      // Range format
      range = parseRange(line);
    } else if (isValidIp(line)) {
      // Single IP
      range = { start: line, end: line };
    }
    
    if (range) {
      const startInt = ipToInt(range.start);
      const endInt = ipToInt(range.end);
      
      processed.push({
        original: line,
        normalized: startInt === endInt ? range.start : `${range.start} - ${range.end}`,
        startIp: Math.min(startInt, endInt),
        endIp: Math.max(startInt, endInt),
        isValid: true
      });
    } else {
      processed.push({
        original: line,
        normalized: 'Invalid',
        startIp: 0,
        endIp: 0,
        isValid: false
      });
    }
  }
  
  return processed;
};

// Aggregate overlapping ranges
export const aggregateRanges = (processed: ProcessedIp[]): AggregatedRange[] => {
  const validRanges = processed.filter(p => p.isValid);
  if (validRanges.length === 0) return [];
  
  // Sort by start IP
  validRanges.sort((a, b) => a.startIp - b.startIp);
  
  const aggregated: AggregatedRange[] = [];
  let currentStart = validRanges[0].startIp;
  let currentEnd = validRanges[0].endIp;
  
  for (let i = 1; i < validRanges.length; i++) {
    const range = validRanges[i];
    
    if (range.startIp <= currentEnd + 1) {
      // Overlapping or adjacent, merge
      currentEnd = Math.max(currentEnd, range.endIp);
    } else {
      // Gap found, save current range and start new one
      aggregated.push({
        start: intToIp(currentStart),
        end: intToIp(currentEnd),
        cidr: rangeToCidr(currentStart, currentEnd),
        count: currentEnd - currentStart + 1
      });
      
      currentStart = range.startIp;
      currentEnd = range.endIp;
    }
  }
  
  // Add the last range
  aggregated.push({
    start: intToIp(currentStart),
    end: intToIp(currentEnd),
    cidr: rangeToCidr(currentStart, currentEnd),
    count: currentEnd - currentStart + 1
  });
  
  return aggregated;
};

// Convert IP range to CIDR notation using canonical algorithm
export const rangeToCidr = (startInt: number, endInt: number): string[] => {
  const cidrs: string[] = [];
  let start = startInt >>> 0; // Ensure unsigned
  const end = endInt >>> 0;   // Ensure unsigned
  
  while (start <= end) {
    // Find the lowest set bit (alignment constraint)
    const alignmentBits = start === 0 ? 32 : Math.floor(Math.log2(start & -start));
    
    // Find the remaining length
    const remainingLength = end - start + 1;
    const maxLengthBits = remainingLength === 0 ? 0 : Math.floor(Math.log2(remainingLength));
    
    // Use the smaller of alignment and remaining length
    const bits = Math.min(alignmentBits, maxLengthBits);
    const blockSize = 1 << bits;
    const prefixLength = 32 - bits;
    
    cidrs.push(`${intToIp(start)}/${prefixLength}`);
    start = (start + blockSize) >>> 0; // Ensure unsigned arithmetic
  }
  
  return cidrs;
};

// Format output based on selected format
export const formatOutput = (ranges: AggregatedRange[], format: OutputFormat): string => {
  switch (format) {
    case 'cidr':
      return ranges.flatMap(r => r.cidr).join('\n');
    
    case 'mask':
      return ranges.flatMap(r => 
        r.cidr.map(cidr => {
          const [ip, prefix] = cidr.split('/');
          const prefixNum = parseInt(prefix);
          const mask = intToIp((0xFFFFFFFF << (32 - prefixNum)) >>> 0);
          return `${ip}/${mask}`;
        })
      ).join('\n');
    
    case 'range':
      return ranges.map(r => 
        r.start === r.end ? r.start : `${r.start} - ${r.end}`
      ).join('\n');
    
    case 'apache':
      return ranges.flatMap(r => 
        r.cidr.map(cidr => `deny from ${cidr}`)
      ).join('\n');
    
    case 'nginx':
      return ranges.flatMap(r => 
        r.cidr.map(cidr => `deny ${cidr};`)
      ).join('\n');
    
    default:
      return '';
  }
};