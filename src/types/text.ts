export type DelimiterType = 'none' | 'comma' | 'semicolon' | 'pipe' | 'space' | 'newline' | 'tab' | 'custom';
export type QuoteType = 'none' | 'single' | 'double';
export type BracketType = 'none' | 'square' | 'curly' | 'round';

export interface TextManipulationOptions {
  delimiter: DelimiterType;
  quotes: QuoteType;
  brackets: BracketType;
  removeDuplicates: boolean;
  removeEmptyLines: boolean;
  trimWhitespace: boolean;
}