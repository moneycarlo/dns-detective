import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OutputFormat } from '@/types/ip';
import { Play, RotateCcw } from 'lucide-react';


interface IpAggregatorInputProps {
  input: string;
  onInputChange: (value: string) => void;
  outputFormat: OutputFormat;
  onOutputFormatChange: (format: OutputFormat) => void;
  onProcess: () => void;
  onClear: () => void;
  isProcessing: boolean;
}

export const IpAggregatorInput: React.FC<IpAggregatorInputProps> = ({
  input,
  onInputChange,
  outputFormat,
  onOutputFormatChange,
  onProcess,
  onClear,
  isProcessing
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>IP Address Input</CardTitle>
        <CardDescription>
          Enter IP addresses, ranges, or CIDR blocks (one per line). Maximum 2MB of text data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ip-input">
            IP Address Ranges
          </Label>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code className="bg-muted px-1 rounded">192.168.1.1</code> - Single IP</li>
              <li><code className="bg-muted px-1 rounded">192.168.1.0/24</code> - CIDR notation</li>
              <li><code className="bg-muted px-1 rounded">192.168.1.0/255.255.255.0</code> - Subnet mask</li>
              <li><code className="bg-muted px-1 rounded">192.168.1.1 - 192.168.1.10</code> - IP range</li>
            </ul>
          </div>
          <Textarea
            id="ip-input"
            placeholder={`192.168.1.1
192.168.1.0/24
10.0.0.1 - 10.0.0.100
172.16.0.0/255.255.0.0`}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="output-format">Output Format</Label>
          <Select value={outputFormat} onValueChange={onOutputFormatChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select output format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cidr">CIDR Notation</SelectItem>
              <SelectItem value="mask">Subnet Mask</SelectItem>
              <SelectItem value="range">IP Range</SelectItem>
              <SelectItem value="apache">Apache .htaccess</SelectItem>
              <SelectItem value="nginx">Nginx Config</SelectItem>
            </SelectContent>
          </Select>
        </div>

        

        <div className="flex gap-2">
          <Button 
            onClick={onProcess} 
            disabled={isProcessing || !input.trim()}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Process & Aggregate'}
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