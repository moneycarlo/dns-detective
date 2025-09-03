import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, CheckCircle, XCircle } from 'lucide-react';
import { ProcessedIp, AggregatedRange } from '@/types/ip';
import { toast } from 'sonner';

interface IpAggregatorResultsProps {
  processedIps: ProcessedIp[];
  aggregatedRanges: AggregatedRange[];
  output: string;
  outputFormat: string;
}

export const IpAggregatorResults: React.FC<IpAggregatorResultsProps> = ({
  processedIps,
  aggregatedRanges,
  output,
  outputFormat
}) => {
  const validCount = processedIps.filter(ip => ip.isValid).length;
  const invalidCount = processedIps.filter(ip => !ip.isValid).length;
  const invalidInputs = processedIps.filter(ip => !ip.isValid);
  const totalIpCount = aggregatedRanges.reduce((sum, range) => sum + range.count, 0);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success('Results copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-aggregation-${outputFormat}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Results downloaded successfully!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggregated Results</CardTitle>
        <CardDescription>
          Optimized IP ranges in {outputFormat.toUpperCase()} format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleCopyToClipboard} variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy to Clipboard
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Results
          </Button>
        </div>
        
        <Separator />
        
        <Textarea
          value={output}
          readOnly
          className="min-h-[300px] font-mono text-sm"
          placeholder="Processed results will appear here..."
        />
        
        {aggregatedRanges.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p>
              Results contain {aggregatedRanges.length} aggregated range(s) covering{' '}
              {totalIpCount.toLocaleString()} IP addresses in total.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};