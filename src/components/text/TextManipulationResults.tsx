import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface TextManipulationResultsProps {
  output: string;
  originalCount: number;
  processedCount: number;
  isPreview?: boolean;
}

export const TextManipulationResults: React.FC<TextManipulationResultsProps> = ({
  output,
  originalCount,
  processedCount,
  isPreview = false
}) => {
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
    a.download = `text-manipulation-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Results downloaded successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Results */}
      {output && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isPreview ? 'Preview Results' : 'Formatted Results'}
            </CardTitle>
            <CardDescription>
              {isPreview 
                ? 'This is how your formatted text will look'
                : 'Your processed and formatted text'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPreview && (
              <>
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
              </>
            )}
            
            <Textarea
              value={output}
              readOnly
              className={`font-mono text-sm ${isPreview ? 'min-h-[150px]' : 'min-h-[300px]'}`}
              placeholder="Processed results will appear here..."
            />
            
            {processedCount > 0 && (
              <div className="text-sm text-muted-foreground">
                <p>
                  {isPreview ? 'Preview shows' : 'Results contain'} {processedCount} formatted item(s)
                  {originalCount !== processedCount && 
                    ` (${originalCount - processedCount} items were filtered out)`
                  }.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};