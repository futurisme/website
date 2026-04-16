import { composeStateSyntax } from '../core/state-syntax';
import type { EBookDocument, EBookPage, FlipOptions } from './types';

const DEFAULT_DURATION = 180;

const FLIP_SYNTAX = composeStateSyntax({
  mode: {
    idle: { opacity: 0 },
    flip: { opacity: 1 }
  }
});

export class FadhilEBookLite {
  private pages: EBookPage[];
  private index = 0;
  private readonly durationMs: number;

  constructor(book: EBookDocument, options: FlipOptions = {}) {
    this.pages = book.pages.slice();
    this.durationMs = Math.max(100, options.durationMs ?? DEFAULT_DURATION);
  }

  static getFlipSyntax() {
    return FLIP_SYNTAX;
  }

  get currentPage(): EBookPage {
    return this.pages[this.index];
  }

  get currentIndex(): number {
    return this.index;
  }

  get pageCount(): number {
    return this.pages.length;
  }

  getDuration(): number {
    return this.durationMs;
  }

  setPages(nextPages: EBookPage[]): void {
    this.pages = nextPages.slice();
    this.index = Math.min(this.index, Math.max(0, this.pages.length - 1));
  }

  next(): number {
    this.index = Math.min(this.index + 1, Math.max(0, this.pages.length - 1));
    return this.index;
  }

  prev(): number {
    this.index = Math.max(this.index - 1, 0);
    return this.index;
  }
}

export type { EBookDocument, EBookPage, FlipOptions } from './types';
