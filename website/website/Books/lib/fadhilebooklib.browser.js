const STORAGE_KEY = 'fadhil-ebook-book-v1';

const DEFAULT_BOOK = {
  title: 'Fadhil E-Book',
  pages: [
    { id: 'front', type: 'front-cover', title: 'Cover Depan', content: 'Selamat datang di Fadhil E-Book Lite.' },
    { id: 'page-1', type: 'page', title: 'Halaman 1', content: 'Isi buku dapat diedit dari /Books/Editor.' },
    { id: 'back', type: 'back-cover', title: 'Cover Belakang', content: 'Terima kasih sudah membaca.' }
  ]
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const clone = (v) => JSON.parse(JSON.stringify(v));
const cubicOut = (t) => 1 - Math.pow(1 - t, 3);

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
    this.ms = Math.max(120, options.duration || 220);
    this.busy = false;

    this.cur = root.querySelector('[data-slot="page-current"]');
    this.flip = root.querySelector('[data-slot="page-flip"]');
    this.n = root.querySelector('[data-slot="page-number"]');
    this.t = root.querySelector('[data-slot="book-title"]');
    this.prevBtn = root.querySelector('[data-action="prev"]');
    this.nextBtn = root.querySelector('[data-action="next"]');
    this.frame = root.querySelector('[data-slot="page-frame"]');

    this.drag = null;
    this.rafId = 0;
    this.lastX = 0;
    this.lastY = 0;

    this.prevBtn.onclick = () => this.step(-1);
    this.nextBtn.onclick = () => this.step(1);
    this.bindGestures();
    this.render();
  }

  setBook(book) {
    this.book = book;
    this.i = Math.min(this.i, this.book.pages.length - 1);
    this.render();
  }

  canStep(dir) {
    if (this.busy) return false;
    const target = this.i + dir;
    return target >= 0 && target < this.book.pages.length;
  }

  bindGestures() {
    if (!this.frame) return;

    this.frame.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || this.busy) return;
      const rect = this.frame.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const edgeThreshold = Math.min(96, rect.width * 0.24);

      let dir = 0;
      if (localX >= rect.width - edgeThreshold) dir = 1;
      else if (localX <= edgeThreshold) dir = -1;
      if (!dir || !this.canStep(dir)) return;

      event.preventDefault();
      this.frame.setPointerCapture(event.pointerId);
      this.drag = {
        id: event.pointerId,
        dir,
        rect,
        progress: 0,
        active: true
      };
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.prepareDrag(dir);
      this.updateDrag(event.clientX, event.clientY);
    });

    this.frame.addEventListener('pointermove', (event) => {
      if (!this.drag || event.pointerId !== this.drag.id) return;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.updateDrag(event.clientX, event.clientY);
    });

    const onRelease = (event) => {
      if (!this.drag || event.pointerId !== this.drag.id) return;
      const shouldTurn = this.drag.progress > 0.36;
      this.finishDrag(shouldTurn);
    };

    this.frame.addEventListener('pointerup', onRelease);
    this.frame.addEventListener('pointercancel', onRelease);
  }

  prepareDrag(dir) {
    const target = this.book.pages[this.i + dir];
    this.paint(this.cur, this.book.pages[this.i]);
    this.paint(this.flip, dir > 0 ? this.book.pages[this.i] : target);
    this.flip.style.opacity = '1';
    this.flip.style.transformOrigin = dir > 0 ? 'left center' : 'right center';
    this.frame.dataset.dragging = '1';
  }

  updateDrag(clientX, clientY) {
    if (!this.drag) return;
    const { rect, dir } = this.drag;
    const localX = clamp(clientX - rect.left, 0, rect.width);
    const localY = clamp(clientY - rect.top, 0, rect.height);

    const edgeDistance = dir > 0 ? rect.width - localX : localX;
    const progress = clamp(1 - edgeDistance / rect.width, 0, 1);
    const yFactor = (localY / rect.height - 0.5) * 2;
    this.drag.progress = progress;

    this.setFlipPose(progress, dir, yFactor);

    if (dir < 0 && progress > 0.5) {
      this.paint(this.flip, this.book.pages[this.i]);
    }
  }

  setFlipPose(progress, dir, yFactor) {
    const angle = dir * -progress * 178;
    const curve = yFactor * 7 * Math.min(progress, 0.9);
    const shine = 0.08 + progress * 0.26;
    this.flip.style.setProperty('--curve', `${curve.toFixed(2)}deg`);
    this.flip.style.setProperty('--shine', shine.toFixed(3));
    this.flip.style.transform = `rotateY(${angle.toFixed(2)}deg)`;
    this.cur.style.setProperty('--page-shadow', (0.12 + progress * 0.28).toFixed(3));
  }

  finishDrag(complete) {
    if (!this.drag) return;
    const drag = this.drag;
    this.drag = null;
    this.frame.dataset.dragging = '0';

    const start = drag.progress;
    const end = complete ? 1 : 0;
    const fromY = clamp((this.lastY - drag.rect.top) / drag.rect.height, 0, 1);
    const yFactor = (fromY - 0.5) * 2;
    const target = this.i + drag.dir;
    const duration = clamp(this.ms * (0.5 + Math.abs(end - start)), 120, 280);

    const t0 = performance.now();
    this.busy = true;

    const tick = (now) => {
      const t = clamp((now - t0) / duration, 0, 1);
      const eased = cubicOut(t);
      const progress = start + (end - start) * eased;
      this.setFlipPose(progress, drag.dir, yFactor);

      if (drag.dir < 0 && progress > 0.5) this.paint(this.flip, this.book.pages[this.i]);

      if (t < 1) {
        this.rafId = requestAnimationFrame(tick);
        return;
      }

      if (complete) this.i = target;
      this.busy = false;
      this.render();
    };

    this.rafId = requestAnimationFrame(tick);
  }

  step(dir) {
    const target = clamp(this.i + dir, 0, this.book.pages.length - 1);
    if (this.busy || target === this.i) return;
    this.prepareDrag(dir);
    this.drag = {
      id: -1,
      dir,
      rect: this.frame.getBoundingClientRect(),
      progress: 0,
      active: false
    };
    this.finishDrag(true);
  }

  render() {
    cancelAnimationFrame(this.rafId);
    this.paint(this.cur, this.book.pages[this.i]);
    this.paint(this.flip, this.book.pages[this.i]);
    this.flip.style.opacity = '0';
    this.flip.style.transform = 'rotateY(0deg)';
    this.flip.style.setProperty('--curve', '0deg');
    this.flip.style.setProperty('--shine', '0.08');
    this.cur.style.setProperty('--page-shadow', '0.12');
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
