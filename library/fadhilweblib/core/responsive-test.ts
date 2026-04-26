import assert from 'node:assert/strict';
import test from 'node:test';
import { FWLB_BREAKPOINTS, createFluidClamp, createResponsiveMediaQuery, createResponsiveSizes, createSrcSet } from './responsive';

test('createFluidClamp builds a modern clamp expression', () => {
  const result = createFluidClamp({
    min: 'fluid(step-0)',
    max: 'fluid(step-3)',
    minViewport: '30rem',
    maxViewport: '90rem',
  });

  assert.equal(
    result,
    'clamp(var(--fwlb-fluid-step-0), calc(var(--fwlb-fluid-step-0) + (var(--fwlb-fluid-step-3) - var(--fwlb-fluid-step-0)) * ((100vw - 30rem) / (90rem - 30rem))), var(--fwlb-fluid-step-3))',
  );
});

test('createResponsiveMediaQuery uses the shared breakpoint map', () => {
  assert.equal(FWLB_BREAKPOINTS.lg, '64rem');
  assert.equal(createResponsiveMediaQuery('md'), '(min-width: 48rem)');
  assert.equal(createResponsiveMediaQuery('sm', 'max'), '(max-width: 40rem)');
});

test('createResponsiveSizes emits largest breakpoint first and keeps the base fallback last', () => {
  const sizes = createResponsiveSizes({
    base: '100vw',
    md: 'min(90vw, 42rem)',
    lg: 'min(72vw, 54rem)',
  });

  assert.equal(sizes, '(min-width: 64rem) min(72vw, 54rem), (min-width: 48rem) min(90vw, 42rem), 100vw');
});

test('createSrcSet sorts candidates and supports width and density descriptors', () => {
  assert.equal(
    createSrcSet([
      { src: '/hero-1280.webp', width: 1280 },
      { src: '/hero-640.webp', width: 640 },
    ]),
    '/hero-640.webp 640w, /hero-1280.webp 1280w',
  );

  assert.equal(
    createSrcSet([
      { src: '/hero.webp', density: 2 },
      { src: '/hero.webp', density: 1 },
    ]),
    '/hero.webp 1x, /hero.webp 2x',
  );
});
