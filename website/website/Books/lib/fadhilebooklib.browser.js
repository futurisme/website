const STORAGE_KEY = 'fadhil-ebook-book-v1';

const DEFAULT_BOOK = {
  title: 'Fadhil E-Book',
  pages: [
    { id: 'front', type: 'front-cover', title: 'Cover Depan', content: 'Selamat datang di Fadhil E-Book Lite.' },
    { id: 'page-1', type: 'page', title: 'Halaman 1', content: 'Geser dari sisi kanan/kiri lalu tahan untuk efek lipat halaman.' },
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
    this.drag = null;

    this.frame = root.querySelector('[data-slot="page-frame"]');
    this.cur = root.querySelector('[data-slot="page-current"]');
    this.flip = root.querySelector('[data-slot="page-flip"]');
    this.n = root.querySelector('[data-slot="page-number"]');
    this.t = root.querySelector('[data-slot="book-title"]');
    this.prevBtn = root.querySelector('[data-action="prev"]');
    this.nextBtn = root.querySelector('[data-action="next"]');

    this.prevBtn.onclick = () => this.step(-1);
    this.nextBtn.onclick = () => this.step(1);

    this.bindGesture();
    this.render();
  }

  setBook(book) {
    this.book = book;
    this.i = Math.min(this.i, this.book.pages.length - 1);
    this.render();
  }

  canStep(dir) {
    return dir > 0 ? this.i < this.book.pages.length - 1 : this.i > 0;
  }

  step(dir) {
    const target = Math.max(0, Math.min(this.i + dir, this.book.pages.length - 1));
    if (this.busy || target === this.i) return;
    this.animateTo(target, dir, 1);
  }

  bindGesture() {
    this.frame.addEventListener('pointerdown', (ev) => {
      if (this.busy) return;
      const rect = this.frame.getBoundingClientRect();
      const localX = ev.clientX - rect.left;
      const edge = rect.width * 0.28;
      let dir = 0;
      if (localX > rect.width - edge && this.canStep(1)) dir = 1;
      if (localX < edge && this.canStep(-1)) dir = -1;
      if (!dir) return;

      this.drag = {
        id: ev.pointerId,
        startX: ev.clientX,
        progress: 0,
        dir,
        target: this.i + dir,
      };

      this.frame.setPointerCapture(ev.pointerId);
      this.flip.style.opacity = '1';
      this.paint(this.cur, this.book.pages[this.i]);
      this.paint(this.flip, this.book.pages[this.i]);
      this.updateFlip(0, dir);
      ev.preventDefault();
    });

    this.frame.addEventListener('pointermove', (ev) => {
      if (!this.drag || ev.pointerId !== this.drag.id) return;
      const rect = this.frame.getBoundingClientRect();
      const delta = this.drag.dir > 0 ? this.drag.startX - ev.clientX : ev.clientX - this.drag.startX;
      const progress = Math.max(0, Math.min(1, delta / (rect.width * 0.9)));
      this.drag.progress = progress;
      this.updateFlip(progress, this.drag.dir);
      if (progress > 0.5) this.paint(this.flip, this.book.pages[this.drag.target]);
      ev.preventDefault();
    });

    const endDrag = (ev) => {
      if (!this.drag || ev.pointerId !== this.drag.id) return;
      const commit = this.drag.progress > 0.32;
      const targetProgress = commit ? 1 : 0;
      this.animateDragRelease(targetProgress, commit);
      this.drag = null;
      ev.preventDefault();
    };

    this.frame.addEventListener('pointerup', endDrag);
    this.frame.addEventListener('pointercancel', endDrag);
  }

  animateDragRelease(targetProgress, commit) {
    if (!this.drag) return;
    const { dir, target, progress } = this.drag;
    const from = progress;
    const duration = Math.max(80, this.ms * Math.abs(targetProgress - from));
    const t0 = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const p = from + (targetProgress - from) * t;
      this.updateFlip(p, dir);
      if (p > 0.5) this.paint(this.flip, this.book.pages[target]);
      if (t < 1) return requestAnimationFrame(tick);
      if (commit) this.i = target;
      this.render();
    };

    requestAnimationFrame(tick);
  }

  animateTo(target, dir, targetProgress) {
    this.busy = true;
    this.paint(this.cur, this.book.pages[this.i]);
    this.paint(this.flip, this.book.pages[this.i]);
    this.flip.style.opacity = '1';

    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / this.ms);
      const p = targetProgress * t;
      this.updateFlip(p, dir);
      if (p > 0.5) this.paint(this.flip, this.book.pages[target]);
      if (t < 1) return requestAnimationFrame(tick);
      this.i = target;
      this.busy = false;
      this.render();
    };

    requestAnimationFrame(tick);
  }

  updateFlip(progress, dir) {
    const fold = Math.max(0.02, 1 - progress);
    const bend = Math.sin(progress * Math.PI) * 8;
    const gloss = Math.sin(progress * Math.PI) * 0.32;
    this.flip.style.transformOrigin = dir > 0 ? 'left center' : 'right center';
    this.flip.style.setProperty('--flip-scale', String(fold));
    this.flip.style.setProperty('--flip-bend', `${dir * bend}deg`);
    this.flip.style.setProperty('--flip-gloss', String(gloss));
  }

  render() {
    this.paint(this.cur, this.book.pages[this.i]);
    this.paint(this.flip, this.book.pages[this.i]);
    this.flip.style.opacity = '0';
    this.flip.style.setProperty('--flip-scale', '1');
    this.flip.style.setProperty('--flip-bend', '0deg');
    this.flip.style.setProperty('--flip-gloss', '0');
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
