import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, RotateCcw, FileText } from 'lucide-react';

interface HiddenCharactersInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onInsertSample: () => void;
  isAnalyzing: boolean;
}

export const HiddenCharactersInput: React.FC<HiddenCharactersInputProps> = ({
  input,
  onInputChange,
  onAnalyze,
  onClear,
  onInsertSample,
  isAnalyzing
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hidden Characters Analyzer</CardTitle>
        <CardDescription>
          Paste your text below to reveal hidden, invisible, and non-printable Unicode characters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-input">
            Your Text
          </Label>
          <div className="text-sm text-muted-foreground">
            <p>Copy and paste any text that may contain invisible or hidden characters.</p>
          </div>
          <Textarea
            id="text-input"
            placeholder="Paste your text here..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onAnalyze} 
            disabled={isAnalyzing || !input.trim()}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onInsertSample}
            disabled={isAnalyzing}
          >
            <FileText className="h-4 w-4 mr-2" />
            Sample
          </Button>
          <Button 
            variant="outline" 
            onClick={onClear}
            disabled={isAnalyzing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};