import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeNextGenSyntax,
  benchmarkNextGenSyntax,
  createNextGenSyntaxEngine,
  precompileUltraShortSyntax,
  resolveSyntax,
} from './syntax';

test('precompileUltraShortSyntax compiles terse declarations for zero-runtime reuse', () => {
  const compiled = precompileUltraShortSyntax('tone:brand; px:12; py:8;');

  assert.equal(compiled.__fwlbType, 'compiled-syntax');
  assert.equal(compiled.resolved.semantics.tone, 'brand');
  assert.equal(compiled.resolved.style.paddingInline, '12px');
});

test('createNextGenSyntaxEngine supports plug-and-play contextual defaults', () => {
  const engine = createNextGenSyntaxEngine({
    contextualDefaults: 'surface(tone:neutral, radius:14); spacing(px:10);',
  });

  const resolved = engine.resolve('surface(tone:info); spacing(py:8);');

  assert.equal(resolved.semantics.tone, 'info');
  assert.equal(resolved.style.paddingInline, '10px');
  assert.equal(resolved.style.paddingBlock, '8px');
  assert.equal(resolved.style.borderRadius, '14px');
});

test('analyzeNextGenSyntax returns namespace and shorthand diagnostics', () => {
  const report = analyzeNextGenSyntax('tone:brand; px:12;');

  assert.ok(report.keyCollisions.length > 0);
  assert.ok(report.groupCollisions.length > 0);
  assert.deepEqual(report.unknownShortKeys, []);
  assert.deepEqual(report.recursiveAliasChains, []);
});

test('benchmarkNextGenSyntax provides deterministic byte estimates', () => {
  const benchmark = benchmarkNextGenSyntax('tone:brand; px:12; py:8;');

  assert.ok(benchmark.estimatedPayloadBytes > 0);
  assert.ok(benchmark.estimatedCoreBytes > 0);
  assert.ok(benchmark.shorthandCompressionRatio > 0);
});

test('next-gen normalized objects preserve verbose and ultra-short forms', () => {
  const engine = createNextGenSyntaxEngine();
  const parsed = engine.normalizeObject({
    surface: { tone: 'brand' },
    spacing: { px: 12 },
    py: 8,
  });

  const resolved = resolveSyntax(parsed);
  assert.equal(resolved.semantics.tone, 'brand');
  assert.equal(resolved.style.paddingInline, '12px');
  assert.equal(resolved.style.paddingBlock, '8px');
});
