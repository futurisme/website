import assert from 'node:assert/strict';
import test from 'node:test';

import { createCinematicBandGradient, createPortfolioRibbonGradient } from './gradient-system';

test('createCinematicBandGradient creates ordered stop bands with color-mix transitions', () => {
  const gradient = createCinematicBandGradient(
    [
      { color: '#5f0f3f', weight: 1.2 },
      { color: '#8f96a3', weight: 1 },
      { color: '#f8fafc', weight: 1.1 },
      { color: '#0f2a55', weight: 1.25 },
      { color: '#5f0f3f', weight: 1 },
      { color: '#ffffff', weight: 1 },
    ],
    { angle: 180, feather: 0.016 },
  );

  assert.match(gradient, /^linear-gradient\(180deg,/);
  assert.match(gradient, /color-mix\(in oklab,/);

  const maroonStart = gradient.indexOf('#5f0f3f');
  const grayBand = gradient.indexOf('#8f96a3');
  const whiteBand = gradient.indexOf('#f8fafc');
  const blueBand = gradient.indexOf('#0f2a55');
  const finalWhite = gradient.lastIndexOf('#ffffff');

  assert.ok(maroonStart >= 0, 'maroon band is present');
  assert.ok(grayBand > maroonStart, 'gray band comes after maroon');
  assert.ok(whiteBand > grayBand, 'white band comes after gray');
  assert.ok(blueBand > whiteBand, 'dark blue band comes after white');
  assert.ok(finalWhite > blueBand, 'final white band comes after maroon return');
});

test('createPortfolioRibbonGradient returns efficient layered gradient stack', () => {
  const gradient = createPortfolioRibbonGradient();

  const layers = gradient.split('),').length;
  assert.equal(layers, 4);
  assert.match(gradient, /radial-gradient\(circle at 14% 7%/);
  assert.match(gradient, /linear-gradient\(180deg,/);
});
