import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalyzedText } from '@/types/hiddenCharacters';
import { getDisplayableChar } from '@/services/hiddenCharactersService';
import { Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface HiddenCharactersResultsProps {
  analysis: AnalyzedText | null;
}

export const HiddenCharactersResults: React.FC<HiddenCharactersResultsProps> = ({
  analysis
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            Enter some text and click "Analyze Text" to see the results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analysis performed yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { statistics, characters } = analysis;
  const hiddenChars = characters.filter(c => !c.isVisible || c.isControl);

  return (
    <div className="space-y-6">
      {/* Annotated Text */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Annotated Text</CardTitle>
              <CardDescription>
                Text with hidden characters highlighted and annotated.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(analysis.original)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Original
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all">
            {characters.map((char, index) => {
              if (!char.isVisible || char.isControl) {
                return (
                  <span
                    key={index}
                    className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs border border-red-200 cursor-help"
                    title={`${char.name} (U+${char.codePoint.toString(16).toUpperCase().padStart(4, '0')}): ${char.description}`}
                  >
                    {getDisplayableChar(char.char)}
                  </span>
                );
              }
              
              if (char.isWhitespace) {
                return (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 cursor-help"
                    title={`${char.name} (U+${char.codePoint.toString(16).toUpperCase().padStart(4, '0')}): ${char.description}`}
                  >
                    {char.char}
                  </span>
                );
              }
              
              return <span key={index}>{char.char}</span>;
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hidden Characters Details */}
      {hiddenChars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hidden Characters Found</CardTitle>
            <CardDescription>
              Details about all hidden, invisible, and control characters in your text.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hiddenChars.map((char, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-mono">
                      {getDisplayableChar(char.char)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{char.name}</div>
                      <div className="text-xs text-muted-foreground">{char.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{char.category}</Badge>
                    <span>Position {char.position}</span>
                    <span>U+{char.codePoint.toString(16).toUpperCase().padStart(4, '0')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};