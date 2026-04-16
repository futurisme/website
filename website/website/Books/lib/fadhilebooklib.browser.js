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
  duration: 210,
  edgeStartRatio: 0.16,
  centerStartEnabled: true,
  minDragDistance: 14,
  centerDragPenalty: 1.35,
  minHoldMs: 55,
  releaseProgress: 0.32,
  velocityThreshold: 0.48,
  meshSegments: 30,
  curveStrength: 20,
  maxCacheDistance: 1,
  smoothing: 0.22,
  touchSmoothing: 0.18
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
    this.ctx = this.canvas?.getContext('2d', { alpha: false, desynchronized: true }) || null;
    this.counter = root.querySelector('[data-slot="page-number"]');
    this.titleNode = root.querySelector('[data-slot="book-title"]');

    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.pixelWidth = 1;
    this.pixelHeight = 1;

    this.pageCache = new Map();
    this.drag = null;
    this.anim = null;
    this.velocityX = 0;
    this.lastMoveTs = 0;
    this.renderQueued = false;
    this.meshSegments = this.options.meshSegments;
    this.idleWarm = null;
    this.foldCanvas = document.createElement('canvas');
    this.foldCtx = this.foldCanvas.getContext('2d', { alpha: true, desynchronized: true });

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });

    this.bindGestures();
    this.resize();
    this.renderStatic();
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.anim?.id || 0);
    this.cancelIdleWarm();
    this.pageCache.clear();
  }

  setOptions(nextOptions = {}) {
    this.options = { ...this.options, ...nextOptions };
    this.meshSegments = this.options.meshSegments;
  }

  setInteractionProfile(profile = 'balanced') {
    if (profile === 'snappy') this.setOptions({ duration: 180, releaseProgress: 0.27, centerDragPenalty: 1.2 });
    else if (profile === 'precise') this.setOptions({ duration: 240, releaseProgress: 0.38, centerDragPenalty: 1.55 });
    else this.setOptions({ duration: 210, releaseProgress: 0.32, centerDragPenalty: 1.35 });
  }

  next() { if (!this.anim && this.i < this.book.pages.length - 1) this.animateTo(1, this.syntheticDrag(1)); }
  prev() { if (!this.anim && this.i > 0) this.animateTo(1, this.syntheticDrag(-1)); }
  goTo(index) {
    const target = clamp(index, 0, this.book.pages.length - 1);
    this.i = target;
    this.trimCache();
    this.renderStatic();
  }

  syntheticDrag(dir) {
    return { dir, progress: 0, touchY: 0.5, startedAt: performance.now(), fromCenter: false };
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

  resize() {
    if (!this.ctx || !this.frame || !this.canvas) return;
    const rect = this.frame.getBoundingClientRect();
    this.dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.pixelWidth = Math.max(1, Math.round(this.width * this.dpr));
    this.pixelHeight = Math.max(1, Math.round(this.height * this.dpr));
    this.canvas.width = this.pixelWidth;
    this.canvas.height = this.pixelHeight;
    this.foldCanvas.width = this.pixelWidth;
    this.foldCanvas.height = this.pixelHeight;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.foldCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.foldCtx.imageSmoothingEnabled = true;
    this.foldCtx.imageSmoothingQuality = 'high';
    this.pageCache.clear();
    this.renderStatic();
  }

  bindGestures() {
    if (!this.frame) return;

    this.frame.addEventListener('pointerdown', (event) => {
      if (this.anim) return;
      const rect = this.frame.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      const edge = rect.width * clamp(this.options.edgeStartRatio, 0.1, 0.26);

      let dir = 0;
      let fromCenter = false;
      if (x >= rect.width - edge && this.i < this.book.pages.length - 1) dir = 1;
      else if (x <= edge && this.i > 0) dir = -1;
      else if (this.options.centerStartEnabled) fromCenter = true;
      if (!dir && !fromCenter) return;

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
        smoothProgress: 0,
        startedAt: performance.now(),
        lastX: x,
        fromCenter,
        smoothTouchY: y / rect.height
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
      this.drag.smoothTouchY += (this.drag.touchY - this.drag.smoothTouchY) * this.options.touchSmoothing;
      this.lastMoveTs = now;

      const dx = x - this.drag.startX;
      const dy = y - this.drag.startY;

      if (!this.drag.dir && this.drag.fromCenter) {
        const intentDistance = Math.abs(dx);
        if (intentDistance < this.options.minDragDistance) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.1) return;
        if (dx < 0 && this.i < this.book.pages.length - 1) this.drag.dir = 1;
        else if (dx > 0 && this.i > 0) this.drag.dir = -1;
        if (!this.drag.dir) return;
      }

      const dragDistance = this.drag.dir > 0 ? -dx : dx;
      const minDistance = this.options.minDragDistance * (this.drag.fromCenter ? this.options.centerDragPenalty : 1);

      if (!this.drag.active) {
        if (Math.abs(dx) <= Math.abs(dy) * 1.15) return;
        if (dragDistance < minDistance) return;
        this.drag.active = true;
      }

      this.drag.progress = clamp(dragDistance / (this.drag.rect.width * 0.92), 0, 1);
      this.drag.smoothProgress += (this.drag.progress - this.drag.smoothProgress) * this.options.smoothing;
      this.queueRender();
    }, { passive: true });

    const onRelease = (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;

      const drag = this.drag;
      this.drag = null;
      if (!drag.active || !drag.dir) {
        this.renderStatic();
        return;
      }

      const heldMs = performance.now() - drag.startedAt;
      const flingForward = drag.dir > 0 && this.velocityX < -this.options.velocityThreshold;
      const flingBackward = drag.dir < 0 && this.velocityX > this.options.velocityThreshold;
      const fairProgress = this.options.releaseProgress * (drag.fromCenter ? 1.1 : 1);
      const complete = heldMs >= this.options.minHoldMs && (drag.smoothProgress >= fairProgress || flingForward || flingBackward);
      this.animateTo(complete ? 1 : 0, drag);
    };

    this.frame.addEventListener('pointerup', onRelease);
    this.frame.addEventListener('pointercancel', onRelease);
  }

  animateTo(targetProgress, dragState) {
    cancelAnimationFrame(this.anim?.id || 0);
    const from = dragState.smoothProgress ?? dragState.progress;
    const dir = dragState.dir;
    const start = performance.now();
    const duration = clamp(this.options.duration * (0.45 + Math.abs(targetProgress - from)), 100, 250);

    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = cubicOut(t);
      const progress = from + (targetProgress - from) * eased;

      this.drawFlip(progress, dir, dragState.smoothTouchY ?? dragState.touchY);
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

    requestAnimationFrame((now) => {
      this.renderQueued = false;
      if (!this.drag || !this.drag.dir) return;

      this.drawFlip(this.drag.smoothProgress, this.drag.dir, this.drag.smoothTouchY);
    });
  }

  getPageCanvas(index) {
    const safeIndex = clamp(index, 0, this.book.pages.length - 1);
    const cacheKey = `${safeIndex}@${this.pixelWidth}x${this.pixelHeight}`;
    const cached = this.pageCache.get(cacheKey);
    if (cached) return cached;

    const page = this.pageAt(safeIndex);
    const cvs = document.createElement('canvas');
    cvs.width = this.pixelWidth;
    cvs.height = this.pixelHeight;
    const ctx = cvs.getContext('2d', { alpha: false, desynchronized: true });
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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

    this.pageCache.set(cacheKey, cvs);
    this.trimCache();
    return cvs;
  }

  cancelIdleWarm() {
    if (!this.idleWarm) return;
    if (this.idleWarm.kind === 'ric') window.cancelIdleCallback(this.idleWarm.id);
    else clearTimeout(this.idleWarm.id);
    this.idleWarm = null;
  }

  prewarmNeighbors() {
    this.cancelIdleWarm();
    const warm = () => {
      this.idleWarm = null;
      for (let d = -1; d <= 1; d++) {
        const idx = this.i + d;
        if (idx < 0 || idx >= this.book.pages.length) continue;
        const key = `${idx}@${this.pixelWidth}x${this.pixelHeight}`;
        if (!this.pageCache.has(key)) this.getPageCanvas(idx);
      }
    };

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 80 });
      this.idleWarm = { kind: 'ric', id };
    } else {
      const id = setTimeout(warm, 16);
      this.idleWarm = { kind: 'to', id };
    }
  }

  trimCache() {
    const keep = new Set();
    for (let d = -this.options.maxCacheDistance; d <= this.options.maxCacheDistance; d++) {
      const idx = this.i + d;
      if (idx < 0 || idx >= this.book.pages.length) continue;
      keep.add(`${idx}@${this.pixelWidth}x${this.pixelHeight}`);
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
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const current = this.getPageCanvas(this.i);
    const target = this.getPageCanvas(this.i + dir);

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(target, 0, 0, w, h);

    const foldX = Math.round(clamp(dir > 0 ? w * (1 - progress) : w * progress, 0, w) * 2) / 2;
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
    const ctx = this.foldCtx;
    const w = this.width;
    const h = this.height;
    const seg = clamp(this.meshSegments | 0, 12, 44);
    const flapStart = dir > 0 ? foldX : 0;
    const flapEnd = dir > 0 ? w : foldX;
    const flapWidth = Math.max(0, flapEnd - flapStart);
    if (flapWidth < 1) return;

    ctx.clearRect(0, 0, w, h);
    const bend = progress * this.options.curveStrength;
    const touchInfluence = clamp((touchY - 0.5) * 1.1, -0.72, 0.72);

    for (let i = 0; i < seg; i++) {
      const t0 = i / seg;
      const t1 = (i + 1) / seg;
      const sx = flapStart + flapWidth * t0;
      const sw = Math.max(1, flapWidth * (t1 - t0));
      const center = (t0 + t1) * 0.5;
      const curve = Math.sin(center * Math.PI) * bend;
      const dy = curve * touchInfluence;
      const dx = dir > 0 ? foldX - (sx - foldX) - sw : foldX + (foldX - sx) - sw;

      const x0 = Math.round(dx);
      const w0 = Math.ceil(sw) + 2;
      ctx.drawImage(pageCanvas, sx, 0, sw + 0.5, h, x0 - 1, Math.round(dy), w0, h);
    }

    this.ctx.drawImage(this.foldCanvas, 0, 0, w, h);
  }

  drawFoldShadow(foldX, dir, progress) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const spread = clamp(24 + progress * 44, 18, 72);
    const dark = clamp(0.1 + progress * 0.24, 0, 0.34);

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
    this.prewarmNeighbors();

    if (this.counter) this.counter.textContent = `${this.i + 1} / ${this.book.pages.length}`;
    if (this.titleNode) this.titleNode.textContent = this.book.title || 'Untitled';
  }
}
