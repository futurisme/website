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
  edgeStartRatio: 0.16,
  minDragDistance: 14,
  minHoldMs: 55,
  releaseProgress: 0.32,
  velocityThreshold: 0.48,
  meshSegments: 28,
  curveStrength: 20,
  maxCacheDistance: 1
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const cubicOut = (t) => 1 - Math.pow(1 - t, 3);
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
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.frame = root.querySelector('[data-slot="page-frame"]');
    this.canvas = root.querySelector('[data-slot="book-canvas"]');
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.counter = root.querySelector('[data-slot="page-number"]');
    this.titleNode = root.querySelector('[data-slot="book-title"]');

    this.width = 1;
    this.height = 1;
    this.dpr = 1;

    this.pageCache = new Map();
    this.drag = null;
    this.anim = null;
    this.velocityX = 0;
    this.lastMoveTs = 0;
    this.renderQueued = false;

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });

    this.bindGestures();
    this.resize();
    this.renderStatic();
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.anim?.id || 0);
    this.pageCache.clear();
  }

  pageAt(index) {
    return this.book.pages[clamp(index, 0, Math.max(0, this.book.pages.length - 1))] || { title: '', content: '' };
  }

  setBook(book) {
    this.book = book;
    this.i = clamp(this.i, 0, this.book.pages.length - 1);
    this.pageCache.clear();
    this.renderStatic();
  }

  setOptions(nextOptions = {}) {
    this.options = { ...this.options, ...nextOptions };
  }

  resize() {
    const rect = this.frame.getBoundingClientRect();
    this.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.pageCache.clear();
    this.renderStatic();
  }

  bindGestures() {
    this.frame.addEventListener('pointerdown', (event) => {
      const rect = this.frame.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      const edge = rect.width * clamp(this.options.edgeStartRatio, 0.1, 0.26);

      let dir = 0;
      if (x >= rect.width - edge && this.i < this.book.pages.length - 1) dir = 1;
      else if (x <= edge && this.i > 0) dir = -1;
      if (!dir || this.anim) return;

      event.preventDefault();
      this.drag = {
        pointerId: event.pointerId,
        rect,
        dir,
        startX: x,
        startY: y,
        x,
        y,
        touchY: y / rect.height,
        active: false,
        progress: 0,
        startedAt: performance.now(),
        lastX: x
      };
      this.velocityX = 0;
      this.lastMoveTs = this.drag.startedAt;
      this.frame.setPointerCapture(event.pointerId);
    }, { passive: false });

    this.frame.addEventListener('pointermove', (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;

      const now = performance.now();
      const x = clamp(event.clientX - this.drag.rect.left, 0, this.drag.rect.width);
      const y = clamp(event.clientY - this.drag.rect.top, 0, this.drag.rect.height);
      const dt = Math.max(16, now - this.lastMoveTs);

      this.velocityX = (x - this.drag.lastX) / dt;
      this.drag.lastX = x;
      this.drag.x = x;
      this.drag.y = y;
      this.drag.touchY = y / this.drag.rect.height;
      this.lastMoveTs = now;

      const dx = x - this.drag.startX;
      const dy = y - this.drag.startY;
      const dragDistance = this.drag.dir > 0 ? -dx : dx;

      if (!this.drag.active) {
        if (Math.abs(dx) <= Math.abs(dy) * 1.15) return;
        if (dragDistance < this.options.minDragDistance) return;
        this.drag.active = true;
      }

      this.drag.progress = clamp(dragDistance / (this.drag.rect.width * 0.92), 0, 1);
      this.queueRender();
    }, { passive: true });

    const onRelease = (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;

      const drag = this.drag;
      this.drag = null;
      if (!drag.active) {
        this.renderStatic();
        return;
      }

      const heldMs = performance.now() - drag.startedAt;
      const flingForward = drag.dir > 0 && this.velocityX < -this.options.velocityThreshold;
      const flingBackward = drag.dir < 0 && this.velocityX > this.options.velocityThreshold;
      const complete = heldMs >= this.options.minHoldMs && (drag.progress >= this.options.releaseProgress || flingForward || flingBackward);
      this.animateTo(complete ? 1 : 0, drag);
    };

    this.frame.addEventListener('pointerup', onRelease);
    this.frame.addEventListener('pointercancel', onRelease);
  }

  animateTo(targetProgress, dragState) {
    cancelAnimationFrame(this.anim?.id || 0);
    const from = dragState.progress;
    const dir = dragState.dir;
    const start = performance.now();
    const duration = clamp(this.options.duration * (0.45 + Math.abs(targetProgress - from)), 120, 280);

    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = cubicOut(t);
      const progress = from + (targetProgress - from) * eased;

      this.drawFlip(progress, dir, dragState.touchY);
      if (t < 1) {
        this.anim.id = requestAnimationFrame(tick);
        return;
      }

      this.anim = null;
      if (targetProgress >= 1) this.i = clamp(this.i + dir, 0, this.book.pages.length - 1);
      this.trimCache();
      this.renderStatic();
    };

    this.anim = { id: requestAnimationFrame(tick) };
  }

  queueRender() {
    if (this.renderQueued || !this.drag) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      if (!this.drag) return;
      this.drawFlip(this.drag.progress, this.drag.dir, this.drag.touchY);
    });
  }

  getPageCanvas(index) {
    const safeIndex = clamp(index, 0, this.book.pages.length - 1);
    const cached = this.pageCache.get(safeIndex);
    if (cached) return cached;

    const page = this.pageAt(safeIndex);
    const cvs = document.createElement('canvas');
    cvs.width = this.width;
    cvs.height = this.height;
    const ctx = cvs.getContext('2d', { alpha: false, desynchronized: true });

    ctx.fillStyle = '#0b1224';
    ctx.fillRect(0, 0, this.width, this.height);

    const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
    grad.addColorStop(0, '#111c34');
    grad.addColorStop(1, '#0b1224');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 7, this.height);

    const pad = Math.max(14, this.width * 0.04);
    ctx.fillStyle = '#dbeafe';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${Math.max(18, this.width * 0.05)}px Inter, system-ui, sans-serif`;
    this.wrapText(ctx, page.title || '', pad, pad, this.width - pad * 2, Math.max(24, this.width * 0.06));

    ctx.fillStyle = '#d1defa';
    ctx.font = `${Math.max(14, this.width * 0.032)}px Inter, system-ui, sans-serif`;
    this.wrapText(ctx, page.content || '', pad, pad + Math.max(52, this.width * 0.09), this.width - pad * 2, Math.max(20, this.width * 0.043));

    this.pageCache.set(safeIndex, cvs);
    this.trimCache();
    return cvs;
  }

  trimCache() {
    const keep = new Set();
    for (let d = -this.options.maxCacheDistance; d <= this.options.maxCacheDistance; d++) {
      keep.add(clamp(this.i + d, 0, this.book.pages.length - 1));
    }
    for (const key of this.pageCache.keys()) {
      if (!keep.has(key)) this.pageCache.delete(key);
    }
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(/\s+/);
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else line = trial;
    }
    if (line) ctx.fillText(line, x, y);
  }

  drawFlip(progress, dir, touchY = 0.5) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const current = this.getPageCanvas(this.i);
    const target = this.getPageCanvas(this.i + dir);

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(target, 0, 0, w, h);

    const foldX = dir > 0 ? w * (1 - progress) : w * progress;
    const staticStart = dir > 0 ? 0 : foldX;
    const staticWidth = dir > 0 ? foldX : w - foldX;

    if (staticWidth > 0.5) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(staticStart, 0, staticWidth, h);
      ctx.clip();
      ctx.drawImage(current, 0, 0, w, h);
      ctx.restore();
    }

    this.drawMeshFold(current, foldX, dir, progress, touchY);
    this.drawFoldShadow(foldX, dir, progress);
  }

  drawMeshFold(pageCanvas, foldX, dir, progress, touchY) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const seg = clamp(this.options.meshSegments | 0, 12, 44);
    const flapStart = dir > 0 ? foldX : 0;
    const flapEnd = dir > 0 ? w : foldX;
    const flapWidth = Math.max(0, flapEnd - flapStart);
    if (flapWidth < 1) return;

    const bend = progress * this.options.curveStrength;
    const touchInfluence = (touchY - 0.5) * 2;

    for (let i = 0; i < seg; i++) {
      const t0 = i / seg;
      const t1 = (i + 1) / seg;
      const sx = flapStart + flapWidth * t0;
      const sw = Math.max(1, flapWidth * (t1 - t0));
      const center = (t0 + t1) * 0.5;
      const curve = Math.sin(center * Math.PI) * bend;
      const dy = curve * touchInfluence;
      const dx = dir > 0 ? foldX - (sx - foldX) - sw : foldX + (foldX - sx) - sw;

      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, -Math.abs(dy), sw + 1, h + Math.abs(dy) * 2);
      ctx.clip();
      ctx.drawImage(pageCanvas, sx, 0, sw, h, dx, dy, sw, h);
      ctx.restore();
    }
  }

  drawFoldShadow(foldX, dir, progress) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const spread = clamp(26 + progress * 54, 20, 84);
    const dark = clamp(0.1 + progress * 0.28, 0, 0.38);

    const shadow = ctx.createLinearGradient(foldX - spread, 0, foldX + spread, 0);
    if (dir > 0) {
      shadow.addColorStop(0, `rgba(2,6,23,${dark})`);
      shadow.addColorStop(1, 'rgba(2,6,23,0)');
    } else {
      shadow.addColorStop(0, 'rgba(2,6,23,0)');
      shadow.addColorStop(1, `rgba(2,6,23,${dark})`);
    }

    ctx.fillStyle = shadow;
    ctx.fillRect(clamp(foldX - spread, 0, w), 0, spread * 2, h);
  }

  renderStatic() {
    if (!this.ctx) return;
    const current = this.getPageCanvas(this.i);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(current, 0, 0, this.width, this.height);
    this.trimCache();

    if (this.counter) this.counter.textContent = `${this.i + 1} / ${this.book.pages.length}`;
    if (this.titleNode) this.titleNode.textContent = this.book.title || 'Untitled';
  }
}
