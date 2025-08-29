import React, { useState } from 'react';
import { TextManipulationInput } from '@/components/text/TextManipulationInput';
import { TextManipulationResults } from '@/components/text/TextManipulationResults';
import { TextManipulationOptions } from '@/types/text';
import { processTextInput, formatPreviewResult } from '@/services/textManipulationService';
import { toast } from 'sonner';
import { Type } from 'lucide-react';

const TextManipulations: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [originalCount, setOriginalCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [options, setOptions] = useState<TextManipulationOptions>({
    delimiter: 'comma',
    quotes: 'none',
    brackets: 'none',
    removeDuplicates: false,
    removeEmptyLines: true,
    trimWhitespace: true
  });

  const handleProcess = async () => {
    if (!input.trim()) {
      toast.error('Please enter some text to process');
      return;
    }

    setIsProcessing(true);
    setIsPreview(false);
    
    try {
      const lines = input.split('\n');
      const originalLineCount = lines.length;
      
      const result = processTextInput(input, options);
      setOutput(result);
      setOriginalCount(originalLineCount);
      
      // Count processed items
      const processedLines = result ? (options.delimiter === 'newline' ? result.split('\n') : result.split(options.delimiter === 'comma' ? ', ' : options.delimiter === 'semicolon' ? '; ' : options.delimiter === 'pipe' ? '| ' : options.delimiter === 'space' ? ' ' : options.delimiter === 'tab' ? '\t' : ', ')) : [];
      setProcessedCount(processedLines.filter(line => line.trim().length > 0).length);
      
      toast.success(`Text processed successfully! ${processedLines.length} items formatted.`);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('An error occurred during processing. Please check your input.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = () => {
    setIsPreview(true);
    const previewResult = formatPreviewResult(options);
    setOutput(previewResult);
    setOriginalCount(5); // Sample has 5 items
    setProcessedCount(previewResult ? (options.delimiter === 'newline' ? previewResult.split('\n') : previewResult.split(options.delimiter === 'comma' ? ', ' : options.delimiter === 'semicolon' ? '; ' : options.delimiter === 'pipe' ? '| ' : options.delimiter === 'space' ? ' ' : options.delimiter === 'tab' ? '\t' : ', ')).length : 0);
    toast.success('Preview generated with sample data');
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setOriginalCount(0);
    setProcessedCount(0);
    setIsPreview(false);
    toast.success('All data cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Type className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Text Manipulations</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Transform your text data with flexible formatting options. Convert lists to comma-separated values, 
            add quotes and brackets, remove duplicates, and more.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <TextManipulationInput
              input={input}
              onInputChange={setInput}
              options={options}
              onOptionsChange={setOptions}
              onProcess={handleProcess}
              onClear={handleClear}
              onPreview={handlePreview}
              isProcessing={isProcessing}
            />
          </div>
          
          <div>
            <TextManipulationResults
              output={output}
              originalCount={originalCount}
              processedCount={processedCount}
              isPreview={isPreview}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TextManipulations;