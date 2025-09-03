import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Code, Download, Eye, Minimize2, Upload, Link } from 'lucide-react';

const HtmlFormatter: React.FC = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [htmlOutput, setHtmlOutput] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormatHtml = () => {
    if (!htmlInput.trim()) {
      toast.error('Please enter some HTML code to format');
      return;
    }

    try {
      // Basic HTML formatting - add proper indentation
      let formatted = htmlInput;
      
      // Remove extra whitespace
      formatted = formatted.replace(/\s+/g, ' ').trim();
      
      // Add line breaks and indentation
      let indentLevel = 0;
      const indentSize = 2;
      const lines = [];
      const tokens = formatted.split(/(<[^>]*>)/g).filter(token => token.trim());
      
      for (const token of tokens) {
        if (token.startsWith('<')) {
          if (token.startsWith('</')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          
          lines.push(' '.repeat(indentLevel * indentSize) + token);
          
          if (!token.startsWith('</') && !token.endsWith('/>') && 
              !['<br>', '<hr>', '<img', '<input', '<meta', '<link'].some(tag => token.startsWith(tag))) {
            indentLevel++;
          }
        } else if (token.trim()) {
          lines.push(' '.repeat(indentLevel * indentSize) + token.trim());
        }
      }
      
      const formattedHtml = lines.join('\n');
      setHtmlOutput(formattedHtml);
      toast.success('HTML formatted successfully!');
    } catch (error) {
      toast.error('Error formatting HTML. Please check your code.');
    }
  };

  const handleMinifyHtml = () => {
    if (!htmlInput.trim()) {
      toast.error('Please enter some HTML code to minify');
      return;
    }

    try {
      // Basic HTML minification
      let minified = htmlInput;
      
      // Remove comments
      minified = minified.replace(/<!--[\s\S]*?-->/g, '');
      
      // Remove extra whitespace
      minified = minified.replace(/\s+/g, ' ');
      
      // Remove whitespace around tags
      minified = minified.replace(/>\s+</g, '><');
      
      // Trim
      minified = minified.trim();
      
      setHtmlOutput(minified);
      toast.success('HTML minified successfully!');
    } catch (error) {
      toast.error('Error minifying HTML. Please check your code.');
    }
  };

  const handleDownload = () => {
    if (!htmlOutput) {
      toast.error('No formatted HTML to download');
      return;
    }

    const blob = new Blob([htmlOutput], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted-html-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('HTML file downloaded successfully!');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/html' && !file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      toast.error('Please select an HTML file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setHtmlInput(content);
      toast.success('HTML file loaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleFetchFromUrl = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    try {
      // Note: Due to CORS restrictions, this would need a backend proxy in a real implementation
      // For now, we'll show a message about CORS limitations
      toast.error('Direct URL fetching is restricted by CORS policy. Please copy and paste the HTML content instead.');
    } catch (error) {
      toast.error('Failed to fetch HTML from URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setHtmlInput('');
    setHtmlOutput('');
    setUrl('');
    toast.success('All data cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">HTML Formatter</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Format, beautify, and minify your HTML code. Upload files or paste code directly for instant formatting.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>HTML Input</CardTitle>
                <CardDescription>
                  Paste your HTML code, upload a file, or fetch from URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="url-input">Load from URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url-input"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleFetchFromUrl}
                      disabled={isLoading || !url.trim()}
                      variant="outline"
                      size="sm"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Fetch
                    </Button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload HTML File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".html,.htm,text/html"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>

                {/* HTML Input */}
                <div className="space-y-2">
                  <Label htmlFor="html-input">HTML Code</Label>
                  <Textarea
                    id="html-input"
                    placeholder="<html>
  <head>
    <title>Example</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>"
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={handleFormatHtml} 
                    disabled={!htmlInput.trim()}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Format HTML
                  </Button>
                  <Button 
                    onClick={handleMinifyHtml} 
                    disabled={!htmlInput.trim()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minify HTML
                  </Button>
                </div>

                <Button 
                  onClick={handleClear} 
                  variant="outline" 
                  className="w-full"
                >
                  Clear All
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>HTML Preview & Output</CardTitle>
                <CardDescription>
                  Formatted HTML code and live preview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Download Button */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleDownload} 
                    disabled={!htmlOutput}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download HTML
                  </Button>
                </div>

                {/* HTML Output */}
                <div className="space-y-2">
                  <Label htmlFor="html-output">Formatted HTML</Label>
                  <Textarea
                    id="html-output"
                    value={htmlOutput}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Formatted HTML will appear here..."
                  />
                </div>

                {/* Live Preview */}
                {htmlOutput && (
                  <div className="space-y-2">
                    <Label>Live Preview</Label>
                    <div className="border rounded-lg p-4 bg-white min-h-[200px] overflow-auto">
                      <iframe
                        srcDoc={htmlOutput}
                        className="w-full h-48 border-0"
                        title="HTML Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HtmlFormatter;