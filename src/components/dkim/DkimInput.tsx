import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type DkimFormat = 'selector:domain' | 'domain:selector' | 'entirestring';

interface DkimInputProps {
  onLookup: (input: string, format: DkimFormat) => Promise<void>;
  isLoading: boolean;
}

export const DkimInput: React.FC<DkimInputProps> = ({ onLookup, isLoading }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<DkimFormat>('selector:domain');
  const [hint, setHint] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('Please enter at least one DKIM entry');
      return;
    }

    try {
      setError(null);
      setHint(null);
      await onLookup(input.trim(), format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const lineCount = input.trim() ? input.trim().split('\n').filter(line => line.trim()).length : 0;

  const getFormatInfo = (fmt: DkimFormat) => {
    switch (fmt) {
      case 'selector:domain':
        return {
          title: 'Selector:Domain Format',
          description: 'Use selector:domain format (e.g., scph1122:email.domain.com)',
          example: 'scph1122:email.domain.com'
        };
      case 'domain:selector':
        return {
          title: 'Domain:Selector Format', 
          description: 'Use domain:selector format (e.g., domain.com:selector)',
          example: 'email.domain.com:scph1122'
        };
      case 'entirestring':
        return {
          title: 'Entire String Format',
          description: 'Use complete DKIM strings (e.g., selector._domainkey.domain.com)',
          example: 'scph1122._domainkey.email.domain.com'
        };
    }
  };

  const formatInfo = getFormatInfo(format);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-muted/50 rounded-lg space-y-3">
        <Label className="text-sm font-medium">DKIM Input Format</Label>
        <div className="flex flex-wrap gap-2">
          {(['selector:domain', 'domain:selector', 'entirestring'] as DkimFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setFormat(fmt)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                format === fmt 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background border hover:bg-muted'
              }`}
            >
              {getFormatInfo(fmt).title}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{formatInfo.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dkim-input" className="text-base font-medium">
          DKIM Entries (max 40)
        </Label>
        <p className="text-sm text-muted-foreground">
          Enter one entry per line in the format: <code className="bg-muted px-1 rounded">
            {formatInfo.example}
          </code>
        </p>
        <Textarea
          id="dkim-input"
          placeholder={`${formatInfo.example}\n${formatInfo.example.replace(/scph1122|email\.domain\.com/, 'example')}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px] font-mono text-sm"
          rows={6}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Format: {formatInfo.example}</span>
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

      {hint && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{hint}</AlertDescription>
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