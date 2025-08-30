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
    <div className="space-y-6">
      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Summary</CardTitle>
          <CardDescription>
            Overview of input processing and aggregation results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validCount}</div>
              <div className="text-sm text-muted-foreground">Valid Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
              <div className="text-sm text-muted-foreground">Invalid Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{aggregatedRanges.length}</div>
              <div className="text-sm text-muted-foreground">Aggregated Ranges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalIpCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total IP Addresses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Validation Results */}
      {processedIps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Input Validation</CardTitle>
            <CardDescription>
              Status of each input line and how it was processed
            </CardDescription>
          </CardHeader>
          <CardContent>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Input Validation</h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {processedIps.filter(ip => !ip.isValid).map((ip, index) => (
              <div
                key={index}
                className="text-sm p-2 rounded bg-red-50 text-red-800 border border-red-200"
              >
                <div className="font-mono">
                  {ip.original} → {ip.normalized}
                </div>
                <div className="text-xs mt-1">Invalid format</div>
              </div>
            ))}
            {processedIps.filter(ip => !ip.isValid).length === 0 && processedIps.length > 0 && (
              <div className="text-green-600 text-sm p-4 text-center">
                All entries are valid ✓
              </div>
            )}
            {processedIps.length === 0 && (
              <div className="text-muted-foreground text-sm p-4 text-center">
                No data processed yet
              </div>
            )}
          </div>
        </div>
          </CardContent>
        </Card>
      )}

      {/* Aggregated Results */}
      {output && (
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
      )}
    </div>
  );
};