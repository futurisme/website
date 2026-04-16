const STORAGE_KEY = 'fadhil-ebook-book-v1';

const DEFAULT_BOOK = {
  title: 'Fadhil E-Book',
  pages: [
    { id: 'front', type: 'front-cover', title: 'Cover Depan', content: 'Selamat datang di Fadhil E-Book Lite.' },
    { id: 'page-1', type: 'page', title: 'Halaman 1', content: 'Isi buku dapat diedit dari /Books/Editor.' },
    { id: 'back', type: 'back-cover', title: 'Cover Belakang', content: 'Terima kasih sudah membaca.' }
  ]
};

const clone = (v) => JSON.parse(JSON.stringify(v));

export const loadBook = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.pages?.length ? parsed : clone(DEFAULT_BOOK);
  } catch {
    return clone(DEFAULT_BOOK);
  }
};

export const saveBook = (book) => localStorage.setItem(STORAGE_KEY, JSON.stringify(book));

export class FadhilEBookLite {
  constructor(root, book = loadBook(), options = {}) {
    this.root = root;
    this.book = book;
    this.i = 0;
    this.ms = Math.max(100, options.duration || 170);
    this.busy = false;

    this.cur = root.querySelector('[data-slot="page-current"]');
    this.flip = root.querySelector('[data-slot="page-flip"]');
    this.n = root.querySelector('[data-slot="page-number"]');
    this.t = root.querySelector('[data-slot="book-title"]');
    this.prevBtn = root.querySelector('[data-action="prev"]');
    this.nextBtn = root.querySelector('[data-action="next"]');

    this.prevBtn.onclick = () => this.step(-1);
    this.nextBtn.onclick = () => this.step(1);
    this.render();
  }

  setBook(book) { this.book = book; this.i = Math.min(this.i, this.book.pages.length - 1); this.render(); }

  step(dir) {
    const target = Math.max(0, Math.min(this.i + dir, this.book.pages.length - 1));
    if (this.busy || target === this.i) return;

    this.busy = true;
    this.paint(this.cur, this.book.pages[this.i]);
    this.paint(this.flip, this.book.pages[this.i]);
    this.flip.style.opacity = '1';

    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / this.ms);
      const s = Math.abs(1 - 2 * t);
      this.flip.style.transformOrigin = dir > 0 ? 'left center' : 'right center';
      this.flip.style.transform = `scaleX(${Math.max(0.03, s)})`;
      if (t > 0.5) this.paint(this.flip, this.book.pages[target]);
      if (t < 1) return requestAnimationFrame(tick);
      this.i = target;
      this.busy = false;
      this.render();
    };
    requestAnimationFrame(tick);
  }

  render() {
    this.paint(this.cur, this.book.pages[this.i]);
    this.paint(this.flip, this.book.pages[this.i]);
    this.flip.style.opacity = '0';
    this.flip.style.transform = 'scaleX(1)';
    this.n.textContent = `${this.i + 1} / ${this.book.pages.length}`;
    this.t.textContent = this.book.title || 'Untitled';
    this.prevBtn.disabled = this.i === 0;
    this.nextBtn.disabled = this.i === this.book.pages.length - 1;
  }

  paint(node, page) {
    node.querySelector('[data-slot="title"]').textContent = page.title || '';
    node.querySelector('[data-slot="content"]').textContent = page.content || '';
  }
}
