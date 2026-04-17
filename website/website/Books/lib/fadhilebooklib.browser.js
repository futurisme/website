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
  touchSmoothing: 0.18,
  velocitySmoothing: 0.24,
  quantizeFoldPx: 1,
  foldOverscanPx: 1.5,
  mobileDprCap: 2,
  touchCurveDamping: 0.38,
  touchMeshSegments: 22,
  paperColor: '#ffffff',
  paperInk: '#111111',
  foldWidthRatio: 0.94,
  foldLiftPx: 4,
  paperThicknessPx: 1.1,
  foldStiffness: 0.72,
  foldSpecular: 0.1,
  shadowContactOpacityMax: 0.018,
  shadowCastOpacityMax: 0.01,
  shadowSpreadRatio: 0.14
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const cubicOut = (t) => 1 - Math.pow(1 - t, 3);
const clone = (v) => JSON.parse(JSON.stringify(v));
const ALWAYS_SOLID_FLIPPING_PAGE = true;

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
export const DEFAULT_VIEWER_OPTIONS = {
  duration: 240,
  edgeStartRatio: 0.16,
  minDragDistance: 14,
  centerStartEnabled: true,
  centerDragPenalty: 1.35,
  releaseProgress: 0.32,
  velocityThreshold: 0.48,
  meshSegments: 30
};

export class FadhilEBookLite {
  constructor(root, book = loadBook(), options = {}) {
    this.root = root;
    this.book = book;
    this.i = 0;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.frame = root.querySelector('[data-slot="page-frame"]');
    this.canvas = root.querySelector('[data-slot="book-canvas"]');
    this.ctx = this.canvas?.getContext('2d', { alpha: false }) || null;
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
    this.foldCtx = this.foldCanvas.getContext('2d', { alpha: true });
    this.isTouchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

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
    const dprCap = this.isTouchDevice ? this.options.mobileDprCap : 2.5;
    this.dpr = clamp(window.devicePixelRatio || 1, 1, dprCap);
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
      if (this.drag.active) event.preventDefault();

      const now = performance.now();
      const latestEvent = event.getCoalescedEvents?.().at(-1) || event;
      const x = clamp(latestEvent.clientX - this.drag.rect.left, 0, this.drag.rect.width);
      const y = clamp(latestEvent.clientY - this.drag.rect.top, 0, this.drag.rect.height);
      const dt = Math.max(16, now - this.lastMoveTs);

      const instantVelocityX = (x - this.drag.lastX) / dt;
      this.velocityX += (instantVelocityX - this.velocityX) * this.options.velocitySmoothing;
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
    }, { passive: false });

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
    this.frame.addEventListener('lostpointercapture', onRelease);
  }

  animateTo(targetProgress, dragState) {
    cancelAnimationFrame(this.anim?.id || 0);
    const from = dragState.smoothProgress ?? dragState.progress;
    const dir = dragState.dir;
    const start = performance.now();
    const speed = clamp(Math.abs(this.velocityX), 0, 2.2);
    const responsiveFactor = 1 - speed * 0.17;
    const duration = clamp(this.options.duration * (0.44 + Math.abs(targetProgress - from)) * responsiveFactor, 90, 260);

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

    requestAnimationFrame(() => {
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
    const ctx = cvs.getContext('2d', { alpha: false });
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = this.options.paperColor;
    ctx.fillRect(0, 0, this.width, this.height);

    const pad = Math.max(14, this.width * 0.04);
    ctx.fillStyle = this.options.paperInk;
    ctx.textBaseline = 'top';
    ctx.font = `700 ${Math.max(18, this.width * 0.05)}px Inter, system-ui, sans-serif`;
    this.wrapText(ctx, page.title || '', pad, pad, this.width - pad * 2, Math.max(24, this.width * 0.06));

    ctx.fillStyle = '#2a2a2a';
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

    const q = Math.max(0.25, this.options.quantizeFoldPx || 1);
    const foldBase = dir > 0 ? w * (1 - progress) : w * progress;
    const foldX = Math.round(clamp(foldBase, 0, w) / q) * q;
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

    this.drawFoldedFlap(current, foldX, dir, progress, touchY);
    this.drawFoldShadow(foldX, dir, progress);
    this.drawFoldSpecular(foldX, dir, progress);
  }

  drawFoldedFlap(pageCanvas, foldX, dir, progress, touchY) {
    const ctx = this.foldCtx;
    const w = this.width;
    const h = this.height;
    const flapWidth = dir > 0 ? (w - foldX) : foldX;
    if (flapWidth < 1) return;

    ctx.clearRect(0, 0, w, h);
    const tension = clamp(progress, 0, 1);
    const yAnchor = clamp(touchY, 0, 1);
    const yCurveSign = yAnchor < 0.5 ? -1 : 1;
    const overscan = Math.max(1, this.options.foldOverscanPx || 1);
    const thickness = clamp(this.options.paperThicknessPx || 1, 0.4, 2.2);
    const verticalLift = yCurveSign * this.options.foldLiftPx * tension * 0.18;
    const drawY = -Math.abs(verticalLift);
    const drawH = h + Math.abs(verticalLift) * 2;
    const foldShade = clamp(0.035 + tension * 0.085, 0, 0.125);
    const foldHighlight = clamp(0.03 + tension * 0.075, 0, 0.12);
    const flapStart = dir > 0 ? (foldX - flapWidth) : foldX;
    const flapWidthClamped = clamp(flapWidth, 0, w);

    if (ALWAYS_SOLID_FLIPPING_PAGE) {
      ctx.fillStyle = this.options.paperColor;
      ctx.fillRect(clamp(flapStart - overscan, 0, w), 0, clamp(flapWidthClamped + overscan * 2, 0, w), h);
    }

    if (dir > 0) {
      const dstX = foldX - flapWidth;
      ctx.save();
      ctx.beginPath();
      ctx.rect(clamp(dstX - overscan, 0, w), 0, clamp(flapWidth + overscan * 2, 0, w), h);
      ctx.clip();

      // Right->left flip shows backside of current sheet.
      // Keep it fully solid to avoid front-text duplication/ghosting artifacts.
      ctx.fillStyle = this.options.paperColor;
      ctx.fillRect(dstX - overscan, drawY, flapWidth + overscan * 2, drawH);

      const backside = ctx.createLinearGradient(dstX, 0, foldX, 0);
      backside.addColorStop(0, 'rgba(255,255,255,0.10)');
      backside.addColorStop(0.45, 'rgba(255,255,255,0.03)');
      backside.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = backside;
      ctx.fillRect(dstX - overscan, drawY, flapWidth + overscan * 2, drawH);
      ctx.restore();
    } else {
      const dstX = foldX;
      ctx.save();
      if (ALWAYS_SOLID_FLIPPING_PAGE) ctx.globalCompositeOperation = 'source-atop';
      ctx.beginPath();
      ctx.rect(clamp(dstX - overscan, 0, w), 0, clamp(flapWidth + overscan * 2, 0, w), h);
      ctx.clip();
      ctx.translate(foldX, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(pageCanvas, 0, 0, flapWidth, h, -flapWidth, drawY, flapWidth, drawH);
      ctx.restore();
    }

    const flapGrad = ctx.createLinearGradient(flapStart, 0, flapStart + flapWidth, 0);
    if (dir > 0) {
      flapGrad.addColorStop(0, `rgba(0,0,0,${foldShade * 0.18})`);
      flapGrad.addColorStop(0.32, `rgba(0,0,0,${foldShade * 0.06})`);
      flapGrad.addColorStop(0.56, `rgba(255,255,255,${foldHighlight * 0.62})`);
      flapGrad.addColorStop(0.78, `rgba(255,255,255,${foldHighlight * 0.24})`);
      flapGrad.addColorStop(1, `rgba(0,0,0,${foldShade * 0.5})`);
    } else {
      flapGrad.addColorStop(0, `rgba(0,0,0,${foldShade * 0.5})`);
      flapGrad.addColorStop(0.22, `rgba(255,255,255,${foldHighlight * 0.24})`);
      flapGrad.addColorStop(0.46, `rgba(255,255,255,${foldHighlight * 0.62})`);
      flapGrad.addColorStop(0.68, `rgba(0,0,0,${foldShade * 0.06})`);
      flapGrad.addColorStop(1, `rgba(0,0,0,${foldShade * 0.18})`);
    }
    ctx.fillStyle = flapGrad;
    ctx.fillRect(clamp(flapStart, 0, w), 0, flapWidthClamped, h);

    const spineX = dir > 0 ? foldX - thickness : foldX;
    const spineGrad = ctx.createLinearGradient(spineX, 0, spineX + thickness * 2, 0);
    spineGrad.addColorStop(0, 'rgba(0,0,0,0.14)');
    spineGrad.addColorStop(0.45, 'rgba(0,0,0,0.05)');
    spineGrad.addColorStop(1, 'rgba(255,255,255,0.12)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(spineX, 0, thickness * 2, h);

    this.ctx.drawImage(this.foldCanvas, 0, 0, w, h);
  }

  drawFoldShadow(foldX, dir, progress) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const spreadRatio = clamp(this.options.shadowSpreadRatio || 0.14, 0.08, 0.22);
    const contactSpread = clamp(w * (0.012 + progress * 0.018), 6, 16);
    const castSpread = clamp(w * (spreadRatio * (0.2 + progress * 0.32)), 8, 30);
    const contactDarkness = clamp(0.003 + progress * this.options.shadowContactOpacityMax, 0.002, 0.02);
    const castDarkness = clamp(0.0015 + progress * this.options.shadowCastOpacityMax, 0.001, 0.012);

    const clipStart = dir > 0 ? foldX : 0;
    const clipWidth = dir > 0 ? (w - foldX) : foldX;
    if (clipWidth <= 0.5) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(clipStart, 0, clipWidth, h);
    ctx.clip();

    const contact = ctx.createLinearGradient(foldX - contactSpread, 0, foldX + contactSpread, 0);
    if (dir > 0) {
      contact.addColorStop(0, `rgba(0,0,0,${contactDarkness * 0.45})`);
      contact.addColorStop(0.36, `rgba(0,0,0,${contactDarkness * 0.26})`);
      contact.addColorStop(0.68, `rgba(0,0,0,${contactDarkness * 0.1})`);
      contact.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      contact.addColorStop(0, 'rgba(0,0,0,0)');
      contact.addColorStop(0.32, `rgba(0,0,0,${contactDarkness * 0.1})`);
      contact.addColorStop(0.64, `rgba(0,0,0,${contactDarkness * 0.26})`);
      contact.addColorStop(1, `rgba(0,0,0,${contactDarkness * 0.45})`);
    }
    ctx.fillStyle = contact;
    ctx.fillRect(clamp(foldX - contactSpread, 0, w), 0, contactSpread * 2, h);

    const cast = ctx.createLinearGradient(foldX - castSpread, 0, foldX + castSpread, 0);
    if (dir > 0) {
      cast.addColorStop(0, `rgba(0,0,0,${castDarkness * 0.16})`);
      cast.addColorStop(0.24, `rgba(0,0,0,${castDarkness * 0.1})`);
      cast.addColorStop(0.52, `rgba(0,0,0,${castDarkness * 0.04})`);
      cast.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      cast.addColorStop(0, 'rgba(0,0,0,0)');
      cast.addColorStop(0.48, `rgba(0,0,0,${castDarkness * 0.04})`);
      cast.addColorStop(0.76, `rgba(0,0,0,${castDarkness * 0.1})`);
      cast.addColorStop(1, `rgba(0,0,0,${castDarkness * 0.16})`);
    }
    ctx.fillStyle = cast;
    ctx.fillRect(clamp(foldX - castSpread, 0, w), 0, castSpread * 2, h);

    ctx.restore();
  }

  drawFoldSpecular(foldX, dir, progress) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const strength = clamp(progress * this.options.foldSpecular, 0, 0.2);
    if (strength <= 0.001) return;

    const spread = clamp(10 + progress * 16, 8, 28);
    const specular = ctx.createLinearGradient(foldX - spread, 0, foldX + spread, 0);
    if (dir > 0) {
      specular.addColorStop(0, `rgba(255,255,255,${strength})`);
      specular.addColorStop(1, 'rgba(255,255,255,0)');
    } else {
      specular.addColorStop(0, 'rgba(255,255,255,0)');
      specular.addColorStop(1, `rgba(255,255,255,${strength})`);
    }

    ctx.fillStyle = specular;
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

export const createBooksApp = (root, options = {}) => {
  const engine = new FadhilEBookLite(root, loadBook(), { ...DEFAULT_VIEWER_OPTIONS, ...options });
  const onStorage = () => engine.setBook(loadBook());
  window.addEventListener('storage', onStorage);

  return {
    engine,
    destroy() {
      window.removeEventListener('storage', onStorage);
      engine.destroy();
    }
  };
};
