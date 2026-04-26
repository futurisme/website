import type { BreakpointDirection, BreakpointName, FluidClampOptions, ResponsiveSizesInput, ResponsiveSrcCandidate } from './types';
import { resolveLengthValue } from './space';

export const FWLB_BREAKPOINTS: Record<BreakpointName, string> = Object.freeze({
  xs: '30rem',
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  xxl: '96rem',
});

function resolveResponsiveLength(value: string | number | undefined) {
  return value === undefined ? undefined : resolveLengthValue(value);
}

export function createFluidClamp({
  min,
  max,
  minViewport = '20rem',
  maxViewport = '96rem',
  viewportUnit = 'vw',
}: FluidClampOptions) {
  const minValue = resolveResponsiveLength(min);
  const maxValue = resolveResponsiveLength(max);
  const minViewportValue = resolveResponsiveLength(minViewport);
  const maxViewportValue = resolveResponsiveLength(maxViewport);

  if (!minValue || !maxValue || !minViewportValue || !maxViewportValue || minViewportValue === maxViewportValue) {
    return maxValue ?? minValue ?? '';
  }

  return `clamp(${minValue}, calc(${minValue} + (${maxValue} - ${minValue}) * ((100${viewportUnit} - ${minViewportValue}) / (${maxViewportValue} - ${minViewportValue}))), ${maxValue})`;
}

export function createResponsiveMediaQuery(
  breakpoint: BreakpointName,
  direction: BreakpointDirection = 'min',
) {
  return `(${direction}-width: ${FWLB_BREAKPOINTS[breakpoint]})`;
}

export function createResponsiveSizes(input: ResponsiveSizesInput) {
  const orderedBreakpoints: Array<[BreakpointName, string | undefined]> = [
    ['xxl', input.xxl],
    ['xl', input.xl],
    ['lg', input.lg],
    ['md', input.md],
    ['sm', input.sm],
    ['xs', input.xs],
  ];

  const fragments = orderedBreakpoints
    .filter(([, value]) => Boolean(value))
    .map(([breakpoint, value]) => `${createResponsiveMediaQuery(breakpoint)} ${value}`);

  fragments.push(input.base);

  return fragments.join(', ');
}

export function createSrcSet(candidates: readonly ResponsiveSrcCandidate[]) {
  return [...candidates]
    .sort((left, right) => (left.width ?? left.density ?? 0) - (right.width ?? right.density ?? 0))
    .map((candidate) => {
      if (candidate.width !== undefined) {
        return `${candidate.src} ${candidate.width}w`;
      }

      if (candidate.density !== undefined) {
        return `${candidate.src} ${candidate.density}x`;
      }

      return candidate.src;
    })
    .join(', ');
}
