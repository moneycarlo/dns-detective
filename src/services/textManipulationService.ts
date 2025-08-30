import { TextManipulationOptions, DelimiterType, QuoteType, BracketType } from '@/types/text';

export const getDelimiterCharacter = (delimiter: DelimiterType, customDelimiter?: string): string => {
  switch (delimiter) {
    case 'none': return '';
    case 'comma': return ',';
    case 'semicolon': return ';';
    case 'pipe': return '|';
    case 'space': return ' ';
    case 'newline': return '\n';
    case 'tab': return '\t';
    case 'custom': return customDelimiter || ',';
    default: return ',';
  }
};

export const getQuoteCharacter = (quote: QuoteType): string => {
  switch (quote) {
    case 'single': return "'";
    case 'double': return '"';
    case 'none': return '';
    default: return '';
  }
};

export const getBracketCharacters = (bracket: BracketType): { open: string; close: string } => {
  switch (bracket) {
    case 'square': return { open: '[', close: ']' };
    case 'curly': return { open: '{', close: '}' };
    case 'round': return { open: '(', close: ')' };
    case 'none': return { open: '', close: '' };
    default: return { open: '', close: '' };
  }
};

export const processTextInput = (input: string, options: TextManipulationOptions, customDelimiter?: string): string => {
  if (!input.trim()) return '';

  // Split input into lines
  let lines = input.split('\n');

  // Process each line based on options
  if (options.trimWhitespace) {
    lines = lines.map(line => line.trim());
  }

  if (options.removeEmptyLines) {
    lines = lines.filter(line => line.length > 0);
  }

  if (options.removeDuplicates) {
    lines = Array.from(new Set(lines));
  }

  if (lines.length === 0) return '';

  // Apply formatting to each line
  const delimiter = getDelimiterCharacter(options.delimiter, customDelimiter);
  const quote = getQuoteCharacter(options.quotes);
  const brackets = getBracketCharacters(options.brackets);

  const formattedLines = lines.map(line => {
    let formatted = line;
    
    // Add quotes
    if (quote) {
      formatted = `${quote}${formatted}${quote}`;
    }
    
    // Add brackets
    if (brackets.open && brackets.close) {
      formatted = `${brackets.open}${formatted}${brackets.close}`;
    }
    
    return formatted;
  });

  // Join with delimiter
  if (options.delimiter === 'newline') {
    return formattedLines.join('\n');
  } else if (options.delimiter === 'none') {
    return formattedLines.join('');
  } else {
    return formattedLines.join(delimiter + ' ');
  }
};

export const generatePreviewText = (): string => {
  return `apple
banana
cherry
date
elderberry`;
};

export const formatPreviewResult = (options: TextManipulationOptions, customDelimiter?: string): string => {
  const sampleInput = generatePreviewText();
  return processTextInput(sampleInput, options, customDelimiter);
};