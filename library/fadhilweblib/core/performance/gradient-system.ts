export type GradientKind = 'linear' | 'radial' | 'conic';

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
