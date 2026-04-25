export type GradientKind = 'linear' | 'radial' | 'conic';
export type GradientBand = {
  color: string;
  weight?: number;
};

export type GradientLayer = {
  kind?: GradientKind;
  angle?: number | string;
  position?: string;
  shape?: 'circle' | 'ellipse';
  stops: string[];
};

function normalizeAngle(angle: number | string | undefined, fallback: string) {
  if (angle == null) return fallback;
  return typeof angle === 'number' ? `${angle}deg` : angle;
}

function clampOpacity(value: number) {
  if (Number.isNaN(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

export function withOpacity(color: string, opacity: number) {
  const alpha = clampOpacity(opacity);
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  return color;
}

export function createGradientLayer(layer: GradientLayer) {
  const kind = layer.kind ?? 'linear';
  const stops = layer.stops.join(', ');

  if (kind === 'radial') {
    const shape = layer.shape ?? 'circle';
    const position = layer.position ? ` at ${layer.position}` : '';
    return `radial-gradient(${shape}${position}, ${stops})`;
  }

  if (kind === 'conic') {
    const angle = normalizeAngle(layer.angle, '0deg');
    const position = layer.position ? ` at ${layer.position}` : '';
    return `conic-gradient(from ${angle}${position}, ${stops})`;
  }

  const angle = normalizeAngle(layer.angle, '180deg');
  return `linear-gradient(${angle}, ${stops})`;
}

export function composeGradient(layers: GradientLayer[]) {
  return layers.map(createGradientLayer).join(', ');
}

function normalizeBands(bands: GradientBand[]) {
  const valid = bands.filter((band) => band.color.trim().length > 0);
  if (valid.length === 0) return [{ color: '#000000', weight: 1 }];

  const totalWeight = valid.reduce((acc, band) => acc + Math.max(0.01, band.weight ?? 1), 0);
  let cursor = 0;

  return valid.map((band, index) => {
    const weight = Math.max(0.01, band.weight ?? 1);
    const start = cursor;
    cursor += weight / totalWeight;
    const end = index === valid.length - 1 ? 1 : cursor;
    return { color: band.color, start, end };
  });
}

export function createCinematicBandGradient(
  bands: GradientBand[],
  options: {
    angle?: number | string;
    feather?: number;
  } = {},
) {
  const angle = normalizeAngle(options.angle, '180deg');
  const feather = Math.min(0.04, Math.max(0.002, options.feather ?? 0.012));
  const normalizedBands = normalizeBands(bands);

  const stops = normalizedBands.flatMap((band, index) => {
    const start = Math.max(0, band.start - feather);
    const end = Math.min(1, band.end + feather);
    const startPct = `${(start * 100).toFixed(2)}%`;
    const endPct = `${(end * 100).toFixed(2)}%`;
    const base = [`${band.color} ${startPct}`, `${band.color} ${endPct}`];

    if (index < normalizedBands.length - 1) {
      const next = normalizedBands[index + 1];
      const pivot = `${(band.end * 100).toFixed(2)}%`;
      base.push(`color-mix(in oklab, ${band.color} 56%, ${next.color}) ${pivot}`);
    }

    return base;
  });

  return `linear-gradient(${angle}, ${stops.join(', ')})`;
}

export function createElegantSurfaceGradient(accent = '#7c1d3b') {
  return composeGradient([
    {
      kind: 'radial',
      position: '12% 8%',
      stops: ['rgba(255,255,255,0.22) 0%', 'transparent 34%'],
    },
    {
      kind: 'radial',
      position: '86% 92%',
      stops: [withOpacity(accent, 0.26), 'transparent 38%'],
    },
    {
      kind: 'linear',
      angle: 160,
      stops: ['#3a414d 0%', '#102447 56%', '#d8dfeb 165%'],
    },
  ]);
}

export function createPortfolioRibbonGradient() {
  return [
    createGradientLayer({
      kind: 'radial',
      position: '14% 7%',
      stops: ['rgba(255,255,255,0.20) 0%', 'transparent 44%'],
    }),
    createGradientLayer({
      kind: 'radial',
      position: '88% 28%',
      stops: ['rgba(148,163,184,0.24) 0%', 'transparent 43%'],
    }),
    createGradientLayer({
      kind: 'radial',
      position: '70% 96%',
      stops: ['rgba(255,255,255,0.22) 0%', 'transparent 35%'],
    }),
    createCinematicBandGradient(
      [
        { color: '#5f0f3f', weight: 1.2 },
        { color: '#8f96a3', weight: 0.95 },
        { color: '#f8fafc', weight: 1.1 },
        { color: '#0f2a55', weight: 1.25 },
        { color: '#5f0f3f', weight: 1 },
        { color: '#ffffff', weight: 1.05 },
      ],
      { feather: 0.016 },
    ),
  ].join(', ');
}
