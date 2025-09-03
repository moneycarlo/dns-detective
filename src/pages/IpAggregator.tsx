import React, { useState } from 'react';
import { IpAggregatorInput } from '@/components/ip/IpAggregatorInput';
import { IpAggregatorResults } from '@/components/ip/IpAggregatorResults';
import { ProcessedIp, AggregatedRange, OutputFormat } from '@/types/ip';
import { processIpInput, aggregateRanges, formatOutput } from '@/services/ipAggregatorService';
import { IpValidationResults } from '@/components/ip/IpValidationResults';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

const IpAggregator: React.FC = () => {
  const [input, setInput] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('cidr');
  const [processedIps, setProcessedIps] = useState<ProcessedIp[]>([]);
  const [aggregatedRanges, setAggregatedRanges] = useState<AggregatedRange[]>([]);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) {
      toast.error('Please enter some IP addresses to process');
      return;
    }

    // Check for 2MB limit (roughly)
    if (input.length > 2 * 1024 * 1024) {
      toast.error('Input exceeds 2MB limit. Please reduce the amount of data.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Process input
      const processed = processIpInput(input);
      setProcessedIps(processed);
      
      // Aggregate ranges
      const aggregated = aggregateRanges(processed);
      setAggregatedRanges(aggregated);
      
      // Format output
      const formatted = formatOutput(aggregated, outputFormat);
      setOutput(formatted);
      
      const validCount = processed.filter(p => p.isValid).length;
      const invalidCount = processed.filter(p => !p.isValid).length;
      
      toast.success(`Processing complete! ${validCount} valid entries, ${invalidCount} invalid entries processed.`);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('An error occurred during processing. Please check your input.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setProcessedIps([]);
    setAggregatedRanges([]);
    setOutput('');
    toast.success('All data cleared');
  };

  const handleOutputFormatChange = (format: OutputFormat) => {
    setOutputFormat(format);
    if (aggregatedRanges.length > 0) {
      const formatted = formatOutput(aggregatedRanges, format);
      setOutput(formatted);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Statistics - Centered above both panels */}
        {processedIps.length > 0 && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-8 bg-card rounded-lg border p-6 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{processedIps.filter(ip => ip.isValid).length}</div>
                <div className="text-sm text-muted-foreground">Valid Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{processedIps.filter(ip => !ip.isValid).length}</div>
                <div className="text-sm text-muted-foreground">Invalid Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{aggregatedRanges.length}</div>
                <div className="text-sm text-muted-foreground">Aggregated Ranges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{aggregatedRanges.reduce((sum, range) => sum + range.count, 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total IP Addresses</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">IP Address Aggregator</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Optimize and aggregate IPv4 addresses into the smallest continuous ranges possible. 
            Perfect for network engineers, firewall configurations, and server administration.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <IpAggregatorInput
              input={input}
              onInputChange={setInput}
              outputFormat={outputFormat}
              onOutputFormatChange={handleOutputFormatChange}
              onProcess={handleProcess}
              onClear={handleClear}
              isProcessing={isProcessing}
            />
          </div>
          
          <div className="space-y-6">
            {/* Aggregated Results */}
            {output && (
              <IpAggregatorResults
                processedIps={processedIps}
                aggregatedRanges={aggregatedRanges}
                output={output}
                outputFormat={outputFormat}
              />
            )}
            
            {/* Input Validation Results - Moved below aggregated results */}
            {processedIps.length > 0 && processedIps.some(ip => !ip.isValid) && (
              <div className="mt-6">
                <IpValidationResults processedIps={processedIps} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default IpAggregator;