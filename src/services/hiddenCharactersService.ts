import { UnicodeCharacter, AnalyzedText, AnalyzedCharacter } from '@/types/hiddenCharacters';

// Common invisible/hidden Unicode characters
const invisibleCharacters: UnicodeCharacter[] = [
  { codePoint: 0x0000, name: 'NULL', category: 'Control', description: 'Null character' },
  { codePoint: 0x0009, name: 'TAB', category: 'Whitespace', description: 'Horizontal tab' },
  { codePoint: 0x000A, name: 'LF', category: 'Whitespace', description: 'Line feed' },
  { codePoint: 0x000B, name: 'VT', category: 'Whitespace', description: 'Vertical tab' },
  { codePoint: 0x000C, name: 'FF', category: 'Whitespace', description: 'Form feed' },
  { codePoint: 0x000D, name: 'CR', category: 'Whitespace', description: 'Carriage return' },
  { codePoint: 0x0020, name: 'SPACE', category: 'Whitespace', description: 'Regular space' },
  { codePoint: 0x00A0, name: 'NBSP', category: 'Whitespace', description: 'Non-breaking space', htmlEntity: '&nbsp;' },
  { codePoint: 0x00AD, name: 'SHY', category: 'Format', description: 'Soft hyphen', htmlEntity: '&shy;' },
  { codePoint: 0x034F, name: 'CGJ', category: 'Format', description: 'Combining grapheme joiner' },
  { codePoint: 0x061C, name: 'ALM', category: 'Format', description: 'Arabic letter mark' },
  { codePoint: 0x115F, name: 'HANGUL CHOSEONG FILLER', category: 'Other', description: 'Hangul filler' },
  { codePoint: 0x1160, name: 'HANGUL JUNGSEONG FILLER', category: 'Other', description: 'Hangul filler' },
  { codePoint: 0x17B4, name: 'KHMER VOWEL INHERENT AQ', category: 'Mark', description: 'Khmer inherent vowel' },
  { codePoint: 0x17B5, name: 'KHMER VOWEL INHERENT AA', category: 'Mark', description: 'Khmer inherent vowel' },
  { codePoint: 0x180E, name: 'MONGOLIAN VOWEL SEPARATOR', category: 'Format', description: 'Mongolian separator' },
  { codePoint: 0x2000, name: 'EN QUAD', category: 'Whitespace', description: 'En quad space' },
  { codePoint: 0x2001, name: 'EM QUAD', category: 'Whitespace', description: 'Em quad space' },
  { codePoint: 0x2002, name: 'EN SPACE', category: 'Whitespace', description: 'En space' },
  { codePoint: 0x2003, name: 'EM SPACE', category: 'Whitespace', description: 'Em space' },
  { codePoint: 0x2004, name: 'THREE-PER-EM SPACE', category: 'Whitespace', description: 'Three-per-em space' },
  { codePoint: 0x2005, name: 'FOUR-PER-EM SPACE', category: 'Whitespace', description: 'Four-per-em space' },
  { codePoint: 0x2006, name: 'SIX-PER-EM SPACE', category: 'Whitespace', description: 'Six-per-em space' },
  { codePoint: 0x2007, name: 'FIGURE SPACE', category: 'Whitespace', description: 'Figure space' },
  { codePoint: 0x2008, name: 'PUNCTUATION SPACE', category: 'Whitespace', description: 'Punctuation space' },
  { codePoint: 0x2009, name: 'THIN SPACE', category: 'Whitespace', description: 'Thin space' },
  { codePoint: 0x200A, name: 'HAIR SPACE', category: 'Whitespace', description: 'Hair space' },
  { codePoint: 0x200B, name: 'ZWSP', category: 'Format', description: 'Zero width space' },
  { codePoint: 0x200C, name: 'ZWNJ', category: 'Format', description: 'Zero width non-joiner' },
  { codePoint: 0x200D, name: 'ZWJ', category: 'Format', description: 'Zero width joiner' },
  { codePoint: 0x200E, name: 'LRM', category: 'Format', description: 'Left-to-right mark' },
  { codePoint: 0x200F, name: 'RLM', category: 'Format', description: 'Right-to-left mark' },
  { codePoint: 0x2028, name: 'LS', category: 'Whitespace', description: 'Line separator' },
  { codePoint: 0x2029, name: 'PS', category: 'Whitespace', description: 'Paragraph separator' },
  { codePoint: 0x202A, name: 'LRE', category: 'Format', description: 'Left-to-right embedding' },
  { codePoint: 0x202B, name: 'RLE', category: 'Format', description: 'Right-to-left embedding' },
  { codePoint: 0x202C, name: 'PDF', category: 'Format', description: 'Pop directional formatting' },
  { codePoint: 0x202D, name: 'LRO', category: 'Format', description: 'Left-to-right override' },
  { codePoint: 0x202E, name: 'RLO', category: 'Format', description: 'Right-to-left override' },
  { codePoint: 0x202F, name: 'NNBSP', category: 'Whitespace', description: 'Narrow no-break space' },
  { codePoint: 0x205F, name: 'MMSP', category: 'Whitespace', description: 'Medium mathematical space' },
  { codePoint: 0x2060, name: 'WJ', category: 'Format', description: 'Word joiner' },
  { codePoint: 0x2061, name: 'FUNCTION APPLICATION', category: 'Format', description: 'Function application' },
  { codePoint: 0x2062, name: 'INVISIBLE TIMES', category: 'Format', description: 'Invisible times' },
  { codePoint: 0x2063, name: 'INVISIBLE SEPARATOR', category: 'Format', description: 'Invisible separator' },
  { codePoint: 0x2064, name: 'INVISIBLE PLUS', category: 'Format', description: 'Invisible plus' },
  { codePoint: 0x206A, name: 'ISS', category: 'Format', description: 'Inhibit symmetric swapping' },
  { codePoint: 0x206B, name: 'ASS', category: 'Format', description: 'Activate symmetric swapping' },
  { codePoint: 0x206C, name: 'IAFS', category: 'Format', description: 'Inhibit Arabic form shaping' },
  { codePoint: 0x206D, name: 'AAFS', category: 'Format', description: 'Activate Arabic form shaping' },
  { codePoint: 0x206E, name: 'NADS', category: 'Format', description: 'National digit shapes' },
  { codePoint: 0x206F, name: 'NODS', category: 'Format', description: 'Nominal digit shapes' },
  { codePoint: 0x3000, name: 'IDEOGRAPHIC SPACE', category: 'Whitespace', description: 'Ideographic space' },
  { codePoint: 0x3164, name: 'HANGUL FILLER', category: 'Other', description: 'Hangul filler' },
  { codePoint: 0xFEFF, name: 'BOM', category: 'Format', description: 'Byte order mark / Zero width no-break space' },
  { codePoint: 0xFFA0, name: 'HALFWIDTH HANGUL FILLER', category: 'Other', description: 'Halfwidth Hangul filler' },
  { codePoint: 0x1D159, name: 'MUSICAL SYMBOL NULL NOTEHEAD', category: 'Symbol', description: 'Musical null notehead' },
  { codePoint: 0x1D173, name: 'MUSICAL SYMBOL BEGIN BEAM', category: 'Format', description: 'Musical begin beam' },
  { codePoint: 0x1D174, name: 'MUSICAL SYMBOL END BEAM', category: 'Format', description: 'Musical end beam' },
  { codePoint: 0x1D175, name: 'MUSICAL SYMBOL BEGIN TIE', category: 'Format', description: 'Musical begin tie' },
  { codePoint: 0x1D176, name: 'MUSICAL SYMBOL END TIE', category: 'Format', description: 'Musical end tie' },
  { codePoint: 0x1D177, name: 'MUSICAL SYMBOL BEGIN SLUR', category: 'Format', description: 'Musical begin slur' },
  { codePoint: 0x1D178, name: 'MUSICAL SYMBOL END SLUR', category: 'Format', description: 'Musical end slur' },
  { codePoint: 0x1D179, name: 'MUSICAL SYMBOL BEGIN PHRASE', category: 'Format', description: 'Musical begin phrase' },
  { codePoint: 0x1D17A, name: 'MUSICAL SYMBOL END PHRASE', category: 'Format', description: 'Musical end phrase' }
];

// Get character information by code point
export const getCharacterInfo = (codePoint: number): UnicodeCharacter | null => {
  return invisibleCharacters.find(char => char.codePoint === codePoint) || null;
};

// Check if a character is invisible/hidden
export const isInvisibleCharacter = (char: string): boolean => {
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;
  
  // Check if it's in our known invisible characters list
  if (invisibleCharacters.some(c => c.codePoint === codePoint)) {
    return true;
  }
  
  // Additional checks for invisible characters
  return (
    // Control characters (0x00-0x1F, 0x7F-0x9F)
    (codePoint >= 0x00 && codePoint <= 0x1F) ||
    (codePoint >= 0x7F && codePoint <= 0x9F) ||
    // Format characters
    (codePoint >= 0x200B && codePoint <= 0x200F) ||
    (codePoint >= 0x202A && codePoint <= 0x202E) ||
    // Other invisible ranges
    codePoint === 0x00AD || // Soft hyphen
    codePoint === 0x034F || // Combining grapheme joiner
    codePoint === 0x061C || // Arabic letter mark
    codePoint === 0x180E || // Mongolian vowel separator
    codePoint === 0x2060 || // Word joiner
    (codePoint >= 0x2061 && codePoint <= 0x2064) || // Invisible math operators
    (codePoint >= 0x206A && codePoint <= 0x206F) || // Deprecated format characters
    codePoint === 0xFEFF    // BOM/ZWNBSP
  );
};

// Check if a character is whitespace
export const isWhitespaceCharacter = (char: string): boolean => {
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;
  
  return (
    codePoint === 0x0009 || // Tab
    codePoint === 0x000A || // Line feed
    codePoint === 0x000B || // Vertical tab
    codePoint === 0x000C || // Form feed
    codePoint === 0x000D || // Carriage return
    codePoint === 0x0020 || // Space
    codePoint === 0x00A0 || // Non-breaking space
    (codePoint >= 0x2000 && codePoint <= 0x200A) || // Various spaces
    codePoint === 0x2028 || // Line separator
    codePoint === 0x2029 || // Paragraph separator
    codePoint === 0x202F || // Narrow no-break space
    codePoint === 0x205F || // Medium mathematical space
    codePoint === 0x3000    // Ideographic space
  );
};

// Check if a character is a control character
export const isControlCharacter = (char: string): boolean => {
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;
  
  return (
    (codePoint >= 0x00 && codePoint <= 0x1F) ||
    (codePoint >= 0x7F && codePoint <= 0x9F)
  );
};

// Get the Unicode name for a character
export const getUnicodeName = (codePoint: number): string => {
  const knownChar = getCharacterInfo(codePoint);
  if (knownChar) {
    return knownChar.name;
  }
  
  // For unknown characters, provide basic category info
  if (codePoint >= 0x00 && codePoint <= 0x1F) {
    return `CONTROL CHARACTER U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  if (codePoint >= 0x7F && codePoint <= 0x9F) {
    return `CONTROL CHARACTER U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
};

// Analyze text for hidden characters
export const analyzeText = (text: string): AnalyzedText => {
  const characters: AnalyzedCharacter[] = [];
  let visibleChars = 0;
  let invisibleChars = 0;
  let whitespaceChars = 0;
  let controlChars = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const codePoint = char.codePointAt(0);
    
    if (!codePoint) continue;
    
    const isVisible = !isInvisibleCharacter(char) && char.trim() !== '';
    const isWhitespace = isWhitespaceCharacter(char);
    const isControl = isControlCharacter(char);
    
    if (isVisible) visibleChars++;
    if (isInvisibleCharacter(char)) invisibleChars++;
    if (isWhitespace) whitespaceChars++;
    if (isControl) controlChars++;
    
    const knownChar = getCharacterInfo(codePoint);
    
    characters.push({
      char,
      codePoint,
      position: i,
      isVisible,
      isWhitespace,
      isControl,
      name: knownChar?.name || getUnicodeName(codePoint),
      category: knownChar?.category || 'Unknown',
      description: knownChar?.description || 'Unknown character'
    });
  }
  
  return {
    original: text,
    characters,
    statistics: {
      totalChars: text.length,
      visibleChars,
      invisibleChars,
      whitespaceChars,
      controlChars
    }
  };
};

// Generate sample text with hidden characters
export const generateSampleText = (): string => {
  return `Hello\u200BWorld\u2060Test\u00A0Text\u202F\u2009Hidden\u200CCharacters\uFEFF`;
};

// Convert character to displayable format
export const getDisplayableChar = (char: string): string => {
  const codePoint = char.codePointAt(0);
  if (!codePoint) return '?';
  
  if (isInvisibleCharacter(char)) {
    return `[U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}]`;
  }
  
  return char;
};
