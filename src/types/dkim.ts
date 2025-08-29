export interface DkimEntry {
  id: string;
  selector: string;
  domain: string;
  originalInput: string;
}

export interface DkimResult {
  id: string;
  selector: string;
  domain: string;
  originalInput: string;
  record: string | null;
  valid: boolean;
  status: 'pending' | 'completed' | 'error';
  error?: string;
}