export type EBookPageType = 'front-cover' | 'page' | 'back-cover';

export interface EBookPage {
  id: string;
  type: EBookPageType;
  title: string;
  content: string;
  accent?: string;
}

export interface EBookDocument {
  title: string;
  pages: EBookPage[];
}

export interface FlipOptions {
  durationMs?: number;
}
