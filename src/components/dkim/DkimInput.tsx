import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DkimInputProps {
  onLookup: (input: string) => Promise<void>;
  isLoading: boolean;
}

export const DkimInput: React.FC<DkimInputProps> = ({ onLookup, isLoading }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('Please enter at least one DKIM entry');
      return;
    }

    try {
      setError(null);
      await onLookup(input.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const lineCount = input.trim() ? input.trim().split('\n').filter(line => line.trim()).length : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dkim-input" className="text-base font-medium">
          DKIM Entries (max 40)
        </Label>
        <p className="text-sm text-muted-foreground">
          Enter one entry per line in the format: <code className="bg-muted px-1 rounded">selector:domain.com</code>
        </p>
        <Textarea
          id="dkim-input"
          placeholder="scph1122:email.allrecipes.com&#10;scph1123:xmail.allrecipes.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px] font-mono text-sm"
          rows={6}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Format: selector:domain.com</span>
          <span className={lineCount > 40 ? 'text-destructive font-medium' : ''}>
            {lineCount}/40 entries
          </span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        disabled={isLoading || !input.trim() || lineCount > 40}
        className="w-full"
      >
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? 'Looking up DKIM records...' : `Lookup ${lineCount} DKIM Record${lineCount !== 1 ? 's' : ''}`}
      </Button>
    </form>
  );
};