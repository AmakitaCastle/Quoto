export interface CardData {
  quote: string;
  bookTitle: string;
  author?: string;
  styleId: CardStyleId;
  orientation?: 'vertical' | 'horizontal' | 'auto'; // User-selected direction
}

export type CardStyleId = 'dark-gold' | 'parchment' | 'ink-green' | 'pure-black';

export interface CardStyle {
  id: CardStyleId;
  name: string;
  background: string;
  border: string;
  accentColor: string;
  textColor: string;
  quoteColor?: string;
}
