import assert from 'node:assert/strict';
import test from 'node:test';

import { createScopedTokenStyles, queueFreedomTask } from './freedom-runtime';

test('createScopedTokenStyles serializes token + declaration overrides with optional layer', () => {
  const css = createScopedTokenStyles({
    selector: '[data-fwlb-theme="portfolio"]',
    layer: 'fwlb.user',
    tokens: {
      fwlbTextStrong: '#ffffff',
      '--fwlb-text-soft': '#f2fbff',
    },
    declarations: {
      color: 'var(--fwlb-text-strong)',
      contentVisibility: 'auto',
    },
  });

  assert.match(css, /@layer fwlb\.user/);
  assert.match(css, /:where\(\[data-fwlb-theme="portfolio"\]\)/);
  assert.match(css, /--fwlbTextStrong: #ffffff;/);
  assert.match(css, /--fwlb-text-soft: #f2fbff;/);
  assert.match(css, /color: var\(--fwlb-text-strong\);/);
  assert.match(css, /contentVisibility: auto;/);
});

test('queueFreedomTask resolves with fallback scheduler semantics', async () => {
  const value = await queueFreedomTask(() => 42, { delay: 0 });
  assert.equal(value, 42);
});
