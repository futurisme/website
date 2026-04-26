export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type BreakpointDirection = 'min' | 'max';
export type ContainerQueryType = 'inline-size' | 'size';
export type ResponsiveTrackMode = 'fit' | 'fill';
export type ResponsiveMediaDensity = 'compact' | 'comfortable' | 'hero' | 'portrait' | 'square';

export interface FluidClampOptions {
  min: string | number;
  max: string | number;
  minViewport?: string | number;
  maxViewport?: string | number;
  viewportUnit?: 'vw' | 'vi' | 'cqi';
}

export interface ResponsiveSizesInput {
  base: string;
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  xxl?: string;
}

export interface ResponsiveSrcCandidate {
  src: string;
  width?: number;
  density?: number;
}

export interface AdaptiveMediaSource {
  media?: string;
  srcSet: string;
  sizes?: string;
  type?: string;
}
