const STORAGE_KEY = 'fadhil-ebook-book-v1';

const DEFAULT_BOOK = {
  title: 'Fadhil E-Book',
  pages: [
    { id: 'front', type: 'front-cover', title: 'Cover Depan', content: 'Selamat datang di Fadhil E-Book Lite.' },
    { id: 'page-1', type: 'page', title: 'Halaman 1', content: 'Isi buku dapat diedit dari /Books/Editor.' },
    { id: 'back', type: 'back-cover', title: 'Cover Belakang', content: 'Terima kasih sudah membaca.' }
  ]
};

const DEFAULT_OPTIONS = {
  duration: 240,
  dragThreshold: 0.24,
  tapZoneRatio: 0.2,
  velocityThreshold: 0.45,
  maxTilt: 6.5
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
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.ms = Math.max(140, this.options.duration);
    this.busy = false;

    this.cur = root.querySelector('[data-slot="page-current"]');
    this.flip = root.querySelector('[data-slot="page-flip"]');
    this.n = root.querySelector('[data-slot="page-number"]');
    this.t = root.querySelector('[data-slot="book-title"]');
    this.frame = root.querySelector('[data-slot="page-frame"]');

    this.drag = null;
    this.lastX = 0;
    this.lastY = 0;
    this.lastMoveTs = 0;
    this.velocityX = 0;
    this.rafId = 0;

    this.bindGestures();
    this.bindDesktopKeys();
    this.render();
  }

  setBook(book) {
    this.book = book;
    this.i = Math.min(this.i, this.book.pages.length - 1);
    this.render();
  }

  setOptions(nextOptions = {}) {
    this.options = { ...this.options, ...nextOptions };
    this.ms = Math.max(140, this.options.duration);
  }

  canStep(dir) {
    const target = this.i + dir;
    return !this.busy && target >= 0 && target < this.book.pages.length;
  }

  bindDesktopKeys() {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') this.step(1);
      else if (event.key === 'ArrowLeft') this.step(-1);
    });
  }

  bindGestures() {
    if (!this.frame) return;

    this.frame.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || this.busy) return;
      const rect = this.frame.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      const zone = rect.width * clamp(this.options.tapZoneRatio, 0.12, 0.3);

      let dir = 0;
      if (x >= rect.width - zone && this.canStep(1)) dir = 1;
      else if (x <= zone && this.canStep(-1)) dir = -1;

      this.drag = {
        pointerId: event.pointerId,
        dir,
        rect,
        startX: x,
        startY: y,
        progress: 0,
        startedAt: performance.now(),
        moved: false
      };

      this.lastX = x;
      this.lastY = y;
      this.lastMoveTs = performance.now();
      this.velocityX = 0;
      this.frame.setPointerCapture(event.pointerId);

      if (dir) {
        event.preventDefault();
        this.prepareDrag(dir);
      }
    }, { passive: false });

    this.frame.addEventListener('pointermove', (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;
      const now = performance.now();
      const rect = this.drag.rect;
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);

      const dx = x - this.lastX;
      const dt = Math.max(16, now - this.lastMoveTs);
      this.velocityX = dx / dt;
      this.lastX = x;
      this.lastY = y;
      this.lastMoveTs = now;

      if (Math.abs(x - this.drag.startX) > 4 || Math.abs(y - this.drag.startY) > 4) this.drag.moved = true;

      if (!this.drag.dir) {
        const dir = x < this.drag.startX ? 1 : -1;
        if (Math.abs(x - this.drag.startX) > 12 && this.canStep(dir)) {
          this.drag.dir = dir;
          this.prepareDrag(dir);
        } else {
          return;
        }
      }

      this.updateDrag(x, y);
    }, { passive: true });

    const release = (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;

      if (!this.drag.dir) {
        this.tryTapStep();
        this.drag = null;
        return;
      }

      const projected = this.drag.progress + Math.abs(this.velocityX) * 0.22;
      const shouldTurn = projected >= clamp(this.options.dragThreshold, 0.18, 0.45);
      this.finishDrag(shouldTurn);
    };

    this.frame.addEventListener('pointerup', release);
    this.frame.addEventListener('pointercancel', release);
  }

  tryTapStep() {
    if (!this.drag || this.drag.moved || this.busy) return;
    const { rect, startX } = this.drag;
    const zone = rect.width * clamp(this.options.tapZoneRatio, 0.12, 0.3);

    if (startX >= rect.width - zone) this.step(1);
    else if (startX <= zone) this.step(-1);
  }

  prepareDrag(dir) {
    const target = this.book.pages[this.i + dir];
    this.paint(this.cur, this.book.pages[this.i]);
    this.paint(this.flip, dir > 0 ? this.book.pages[this.i] : target);
    this.flip.style.opacity = '1';
    this.flip.style.transformOrigin = dir > 0 ? 'left center' : 'right center';
    this.frame.dataset.dragging = '1';
  }

  updateDrag(x, y) {
    if (!this.drag?.dir) return;
    const { rect, dir } = this.drag;

    const edgeDistance = dir > 0 ? rect.width - x : x;
    const progress = clamp(1 - edgeDistance / rect.width, 0, 1);
    const yFactor = (y / rect.height - 0.5) * 2;
    this.drag.progress = progress;

    this.setFlipPose(progress, dir, yFactor);

    if (dir < 0 && progress > 0.52) this.paint(this.flip, this.book.pages[this.i]);
  }

  setFlipPose(progress, dir, yFactor) {
    const angle = clamp(dir * -progress * 176, -176, 176);
    const tilt = clamp(yFactor * this.options.maxTilt * Math.min(progress, 0.9), -8, 8);
    const shine = 0.1 + progress * 0.28;
    const shadow = 0.14 + progress * 0.3;

    this.flip.style.setProperty('--shine', shine.toFixed(3));
    this.flip.style.transform = `rotateY(${angle.toFixed(2)}deg) rotateZ(${tilt.toFixed(2)}deg)`;
    this.cur.style.setProperty('--page-shadow', shadow.toFixed(3));
  }

  finishDrag(complete) {
    if (!this.drag?.dir) return;
    const drag = this.drag;
    this.drag = null;

    const from = drag.progress;
    const to = complete ? 1 : 0;
    const target = this.i + drag.dir;
    const yFactor = (this.lastY / drag.rect.height - 0.5) * 2;
    const duration = clamp(this.ms * (0.45 + Math.abs(to - from)), 130, 300);

    this.busy = true;
    this.frame.dataset.dragging = '0';
    const t0 = performance.now();

    const tick = (now) => {
      const t = clamp((now - t0) / duration, 0, 1);
      const eased = cubicOut(t);
      const progress = from + (to - from) * eased;
      this.setFlipPose(progress, drag.dir, yFactor);

      if (drag.dir < 0 && progress > 0.52) this.paint(this.flip, this.book.pages[this.i]);

      if (t < 1) {
        this.rafId = requestAnimationFrame(tick);
        return;
      }

      if (complete) this.i = target;
      this.busy = false;
      this.render();
    };

    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(tick);
  }

  step(dir) {
    if (!this.canStep(dir)) return;
    this.prepareDrag(dir);
    this.drag = {
      pointerId: -1,
      dir,
      rect: this.frame.getBoundingClientRect(),
      progress: 0,
      startX: 0,
      startY: 0,
      moved: true,
      startedAt: performance.now()
    };
    this.lastY = this.drag.rect.height * 0.5;
    this.finishDrag(true);
  }

  render() {
    cancelAnimationFrame(this.rafId);
    const page = this.book.pages[this.i] || { title: '', content: '' };
    this.paint(this.cur, page);
    this.paint(this.flip, page);
    this.flip.style.opacity = '0';
    this.flip.style.transform = 'rotateY(0deg) rotateZ(0deg)';
    this.flip.style.setProperty('--shine', '0.1');
    this.cur.style.setProperty('--page-shadow', '0.14');
    if (this.n) this.n.textContent = `${this.i + 1} / ${this.book.pages.length}`;
    if (this.t) this.t.textContent = this.book.title || 'Untitled';
  }

  paint(node, page) {
    node.querySelector('[data-slot="title"]').textContent = page?.title || '';
    node.querySelector('[data-slot="content"]').textContent = page?.content || '';
  }
}
