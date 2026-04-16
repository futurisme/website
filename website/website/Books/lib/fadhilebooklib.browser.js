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
  duration: 270,
  edgeStartRatio: 0.16,
  minDragDistance: 18,
  minHoldMs: 70,
  releaseProgress: 0.36,
  velocityThreshold: 0.56,
  maxTilt: 7,
  maxTwist: 5.4,
  pageResistance: 0.84,
  curveStrength: 0.72,
  physicsMapper: null
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
    this.ms = Math.max(160, this.options.duration);
    this.busy = false;

    this.cur = root.querySelector('[data-slot="page-current"]');
    this.flip = root.querySelector('[data-slot="page-flip"]');
    this.n = root.querySelector('[data-slot="page-number"]');
    this.t = root.querySelector('[data-slot="book-title"]');
    this.frame = root.querySelector('[data-slot="page-frame"]');

    this.drag = null;
    this.lastY = 0;
    this.lastMoveTs = 0;
    this.velocityX = 0;
    this.rafId = 0;

    this.bindGestures();
    this.render();
  }

  pageAt(index) {
    return this.book.pages[clamp(index, 0, Math.max(0, this.book.pages.length - 1))] || { title: '', content: '' };
  }

  setBook(book) {
    this.book = book;
    this.i = Math.min(this.i, this.book.pages.length - 1);
    this.render();
  }

  setOptions(nextOptions = {}) {
    this.options = { ...this.options, ...nextOptions };
    this.ms = Math.max(160, this.options.duration);
  }

  setPhysicsMapper(mapper) {
    this.options.physicsMapper = typeof mapper === 'function' ? mapper : null;
  }

  on(eventName, callback) {
    this.root.addEventListener(`book:${eventName}`, callback);
    return () => this.root.removeEventListener(`book:${eventName}`, callback);
  }

  emit(eventName, detail = {}) {
    this.root.dispatchEvent(new CustomEvent(`book:${eventName}`, { detail }));
  }

  canStep(dir) {
    const target = this.i + dir;
    return !this.busy && target >= 0 && target < this.book.pages.length;
  }

  bindGestures() {
    if (!this.frame) return;

    this.frame.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || this.busy) return;

      const rect = this.frame.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      const edge = rect.width * clamp(this.options.edgeStartRatio, 0.1, 0.24);

      let dir = 0;
      if (x >= rect.width - edge && this.canStep(1)) dir = 1;
      else if (x <= edge && this.canStep(-1)) dir = -1;
      if (!dir) return;

      event.preventDefault();
      this.drag = {
        pointerId: event.pointerId,
        dir,
        rect,
        startX: x,
        startY: y,
        progress: 0,
        moved: false,
        active: false,
        startedAt: performance.now(),
        lastX: x,
        touchY: y / rect.height,
        pressure: clamp(event.pressure || 0.35, 0.15, 1)
      };

      this.lastY = y;
      this.lastMoveTs = this.drag.startedAt;
      this.velocityX = 0;
      this.frame.setPointerCapture(event.pointerId);
      this.emit('dragarm', { index: this.i, dir });
    }, { passive: false });

    this.frame.addEventListener('pointermove', (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;

      const now = performance.now();
      const rect = this.drag.rect;
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);

      const dt = Math.max(16, now - this.lastMoveTs);
      this.velocityX = (x - this.drag.lastX) / dt;
      this.drag.lastX = x;
      this.lastY = y;
      this.lastMoveTs = now;

      const dx = x - this.drag.startX;
      const dy = y - this.drag.startY;
      const dirDistance = this.drag.dir > 0 ? -dx : dx;

      this.drag.touchY = y / rect.height;
      this.drag.pressure = clamp(event.pressure || this.drag.pressure || 0.35, 0.15, 1);

      if (!this.drag.active) {
        const horizontalIntent = Math.abs(dx) > Math.abs(dy) * 1.15;
        if (!horizontalIntent || dirDistance < this.options.minDragDistance) return;

        this.drag.active = true;
        this.drag.moved = true;
        this.prepareDrag(this.drag.dir);
        this.emit('dragstart', { index: this.i, dir: this.drag.dir });
      }

      this.updateDrag(dirDistance, y);
    }, { passive: true });

    const release = (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;

      const drag = this.drag;
      if (!drag.active) {
        this.drag = null;
        return;
      }

      const heldMs = performance.now() - drag.startedAt;
      const speed = clamp(this.options.velocityThreshold, 0.24, 1.2);
      const flingForward = drag.dir > 0 && this.velocityX < -speed;
      const flingBackward = drag.dir < 0 && this.velocityX > speed;
      const movedEnough = drag.moved && drag.progress >= 0.03;
      const shouldTurn = movedEnough && heldMs >= this.options.minHoldMs && (
        drag.progress >= clamp(this.options.releaseProgress, 0.2, 0.6) || flingForward || flingBackward
      );

      this.finishDrag(shouldTurn);
    };

    this.frame.addEventListener('pointerup', release);
    this.frame.addEventListener('pointercancel', release);
  }

  prepareDrag(dir) {
    const currentPage = this.pageAt(this.i);
    const targetPage = this.pageAt(this.i + dir);

    this.paint(this.cur, targetPage);
    this.paint(this.flip, currentPage);
    this.flip.style.opacity = '1';
    this.flip.style.transformOrigin = dir > 0 ? 'left center' : 'right center';
    this.frame.dataset.dragging = '1';
  }

  updateDrag(dirDistance, y) {
    if (!this.drag?.dir || !this.drag.active) return;
    const { rect, dir, touchY, pressure } = this.drag;

    const linear = clamp(dirDistance / (rect.width * 0.92), 0, 1);
    const mapped = this.options.physicsMapper ? this.options.physicsMapper(linear, this.drag, this.options) : linear;
    const easedProgress = 1 - Math.pow(1 - clamp(mapped, 0, 1), this.options.pageResistance);
    const yFactor = (y / rect.height - 0.5) * 2;

    this.drag.progress = easedProgress;
    this.setFlipPose(easedProgress, dir, yFactor, touchY, pressure);
    this.emit('dragmove', { progress: easedProgress, dir, index: this.i });
  }

  setFlipPose(progress, dir, yFactor, touchY = 0.5, pressure = 0.35) {
    const angle = clamp(dir * -progress * 176, -176, 176);
    const curl = clamp(progress * this.options.curveStrength + pressure * 0.2, 0, 1);
    const tilt = clamp(yFactor * this.options.maxTilt * Math.min(progress, 0.9), -9, 9);
    const twist = clamp((touchY - 0.5) * this.options.maxTwist * (0.45 + progress), -9, 9);
    const shine = 0.08 + progress * 0.3;
    const shadow = 0.14 + progress * 0.33;

    this.flip.style.setProperty('--shine', shine.toFixed(3));
    this.flip.style.setProperty('--curl', curl.toFixed(3));
    this.flip.style.setProperty('--touch-y', touchY.toFixed(3));
    this.flip.style.transform = `rotateY(${angle.toFixed(2)}deg) rotateZ(${(tilt + twist).toFixed(2)}deg)`;
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
    const duration = clamp(this.ms * (0.45 + Math.abs(to - from)), 130, 320);

    this.busy = true;
    this.frame.dataset.dragging = '0';
    const t0 = performance.now();

    const tick = (now) => {
      const t = clamp((now - t0) / duration, 0, 1);
      const eased = cubicOut(t);
      const progress = from + (to - from) * eased;
      this.setFlipPose(progress, drag.dir, yFactor, drag.touchY, drag.pressure);

      if (t < 1) {
        this.rafId = requestAnimationFrame(tick);
        return;
      }

      if (complete) this.i = target;
      this.busy = false;
      this.render();
      this.emit('dragend', { changed: complete, index: this.i, dir: drag.dir });
    };

    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(tick);
  }

  render() {
    cancelAnimationFrame(this.rafId);
    const page = this.pageAt(this.i);
    this.paint(this.cur, page);
    this.paint(this.flip, page);
    this.flip.style.opacity = '0';
    this.flip.style.transform = 'rotateY(0deg) rotateZ(0deg)';
    this.flip.style.setProperty('--shine', '0.1');
    this.flip.style.setProperty('--curl', '0');
    this.flip.style.setProperty('--touch-y', '0.5');
    this.cur.style.setProperty('--page-shadow', '0.14');
    if (this.n) this.n.textContent = `${this.i + 1} / ${this.book.pages.length}`;
    if (this.t) this.t.textContent = this.book.title || 'Untitled';
  }

  paint(node, page) {
    node.querySelector('[data-slot="title"]').textContent = page?.title || '';
    node.querySelector('[data-slot="content"]').textContent = page?.content || '';
  }
}
