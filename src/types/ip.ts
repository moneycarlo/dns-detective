export interface IpRange {
  start: string;
  end: string;
}

export interface ProcessedIp {
  original: string;
  normalized: string;
  startIp: number;
  endIp: number;
  isValid: boolean;
}

export interface AggregatedRange {
  start: string;
  end: string;
  cidr: string[];
  count: number;
}

export type OutputFormat = 'cidr' | 'mask' | 'range' | 'apache' | 'nginx';