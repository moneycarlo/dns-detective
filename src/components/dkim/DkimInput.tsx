import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DkimInputProps {
  onLookup: (input: string, useEntireString?: boolean) => Promise<void>;
  isLoading: boolean;
}

export const DkimInput: React.FC<DkimInputProps> = ({ onLookup, isLoading }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [useEntireString, setUseEntireString] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('Please enter at least one DKIM entry');
      return;
    }

    try {
      setError(null);
      await onLookup(input.trim(), useEntireString);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const lineCount = input.trim() ? input.trim().split('\n').filter(line => line.trim()).length : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
        <Switch
          id="format-toggle"
          checked={useEntireString}
          onCheckedChange={setUseEntireString}
        />
        <div className="flex flex-col">
          <Label htmlFor="format-toggle" className="text-sm font-medium">
            {useEntireString ? 'Entire String Format' : 'Domain:Selector Format'}
          </Label>
          <span className="text-xs text-muted-foreground">
            {useEntireString 
              ? 'Use complete DKIM strings (e.g., selector._domainkey.domain.com)'
              : 'Use domain:selector format (e.g., domain.com:selector)'
            }
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dkim-input" className="text-base font-medium">
          DKIM Entries (max 40)
        </Label>
        <p className="text-sm text-muted-foreground">
          {useEntireString ? 
            'Enter one complete DKIM string per line:' :
            'Enter one entry per line in the format:'
          } <code className="bg-muted px-1 rounded">
            {useEntireString ? 
              'selector._domainkey.domain.com' : 
              'domain.com:selector'
            }
          </code>
        </p>
        <Textarea
          id="dkim-input"
          placeholder={useEntireString ?
            "scph1122._domainkey.email.domain.com\nscph1123._domainkey.email.example.com" :
            "email.domain.com:scph1122\nemail.example.com:scph1123"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px] font-mono text-sm"
          rows={6}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Format: {useEntireString ? 'selector._domainkey.domain.com' : 'domain.com:selector'}</span>
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