import React, { useState } from 'react';
import { HiddenCharactersInput } from '@/components/hidden/HiddenCharactersInput';
import { HiddenCharactersResults } from '@/components/hidden/HiddenCharactersResults';
import { AnalyzedText } from '@/types/hiddenCharacters';
import { analyzeText, generateSampleText } from '@/services/hiddenCharactersService';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';

const HiddenCharacters: React.FC = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzedText | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const result = analyzeText(input);
      setAnalysis(result);
      
      const hiddenCount = result.statistics.invisibleChars + result.statistics.controlChars;
      if (hiddenCount > 0) {
        toast.success(`Analysis complete! Found ${hiddenCount} hidden character${hiddenCount !== 1 ? 's' : ''}.`);
      } else {
        toast.success('Analysis complete! No hidden characters found.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setAnalysis(null);
    toast.success('All data cleared');
  };

  const handleInsertSample = () => {
    const sample = generateSampleText();
    setInput(sample);
    toast.success('Sample text inserted with hidden characters');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Eye className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Hidden Characters</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Decode and view invisible, non-printable Unicode characters hidden inside your text. 
            Discover zero-width spaces, control characters, and other hidden elements.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <HiddenCharactersInput
              input={input}
              onInputChange={setInput}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              onInsertSample={handleInsertSample}
              isAnalyzing={isAnalyzing}
            />
          </div>
          
          <div>
            <HiddenCharactersResults
              analysis={analysis}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HiddenCharacters;