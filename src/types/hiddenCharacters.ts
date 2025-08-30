export interface UnicodeCharacter {
  codePoint: number;
  name: string;
  category: string;
  description: string;
  htmlEntity?: string;
  cssEscape?: string;
}

export interface AnalyzedText {
  original: string;
  characters: AnalyzedCharacter[];
  statistics: {
    totalChars: number;
    visibleChars: number;
    invisibleChars: number;
    whitespaceChars: number;
    controlChars: number;
  };
}

export interface AnalyzedCharacter {
  char: string;
  codePoint: number;
  position: number;
  isVisible: boolean;
  isWhitespace: boolean;
  isControl: boolean;
  name: string;
  category: string;
  description: string;
}