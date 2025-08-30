import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { TextManipulationOptions, DelimiterType, QuoteType, BracketType } from '@/types/text';
import { Play, RotateCcw, Eye } from 'lucide-react';

interface TextManipulationInputProps {
  input: string;
  onInputChange: (value: string) => void;
  options: TextManipulationOptions;
  onOptionsChange: (options: TextManipulationOptions) => void;
  onProcess: () => void;
  onClear: () => void;
  onPreview: () => void;
  isProcessing: boolean;
  customDelimiter: string;
  onCustomDelimiterChange: (value: string) => void;
}

export const TextManipulationInput: React.FC<TextManipulationInputProps> = ({
  input,
  onInputChange,
  options,
  onOptionsChange,
  onProcess,
  onClear,
  onPreview,
  isProcessing,
  customDelimiter,
  onCustomDelimiterChange
}) => {
  const updateOption = <K extends keyof TextManipulationOptions>(
    key: K,
    value: TextManipulationOptions[K]
  ) => {
    onOptionsChange({ ...options, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Text Input</CardTitle>
        <CardDescription>
          Enter your text data (one item per line) and configure formatting options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="text-input">Input Text</Label>
          <Textarea
            id="text-input"
            placeholder={`apple
banana
cherry
date
elderberry`}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Formatting Options</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="delimiter">Delimiter</Label>
              <Select 
                value={options.delimiter} 
                onValueChange={(value: DelimiterType) => updateOption('delimiter', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="comma">Comma (,)</SelectItem>
                  <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                  <SelectItem value="pipe">Pipe (|)</SelectItem>
                  <SelectItem value="space">Space</SelectItem>
                  <SelectItem value="newline">New Line</SelectItem>
                  <SelectItem value="tab">Tab</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              {options.delimiter === 'custom' && (
                <div className="mt-2">
                  <Label htmlFor="custom-delimiter">Custom Delimiter</Label>
                  <input
                    id="custom-delimiter"
                    placeholder="Enter custom delimiter"
                    value={customDelimiter}
                    onChange={(e) => onCustomDelimiterChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quotes">Quotes</Label>
              <Select 
                value={options.quotes} 
                onValueChange={(value: QuoteType) => updateOption('quotes', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Quotes</SelectItem>
                  <SelectItem value="single">Single Quotes (')</SelectItem>
                  <SelectItem value="double">Double Quotes (")</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brackets">Brackets</Label>
              <Select 
                value={options.brackets} 
                onValueChange={(value: BracketType) => updateOption('brackets', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Brackets</SelectItem>
                  <SelectItem value="square">Square Brackets [...]</SelectItem>
                  <SelectItem value="curly">Curly Brackets {"{...}"}</SelectItem>
                  <SelectItem value="round">Round Brackets (...)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Processing Options</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-duplicates"
                  checked={options.removeDuplicates}
                  onCheckedChange={(checked) => updateOption('removeDuplicates', !!checked)}
                />
                <Label htmlFor="remove-duplicates" className="text-sm">
                  Remove duplicate entries
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-empty"
                  checked={options.removeEmptyLines}
                  onCheckedChange={(checked) => updateOption('removeEmptyLines', !!checked)}
                />
                <Label htmlFor="remove-empty" className="text-sm">
                  Remove empty lines
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trim-whitespace"
                  checked={options.trimWhitespace}
                  onCheckedChange={(checked) => updateOption('trimWhitespace', !!checked)}
                />
                <Label htmlFor="trim-whitespace" className="text-sm">
                  Trim whitespace from each line
                </Label>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button 
            onClick={onProcess} 
            disabled={isProcessing || !input.trim()}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Process Text'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onPreview}
            disabled={isProcessing}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline" 
            onClick={onClear}
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};