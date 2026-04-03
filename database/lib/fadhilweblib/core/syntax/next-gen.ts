import type { FadhilWebCompiledSyntax, FadhilWebFlatSyntaxObject, FadhilWebSyntax, FadhilWebSyntaxObject } from '../types';
import { GROUP_ALIASES, KEY_ALIASES, normalizeGroupName, normalizeKey } from './constants';
import { compileSyntax, composeSyntax, parseSyntaxInput } from './parse';
import { resolveSyntax } from './style';

export interface NextGenSyntaxEngineConfig {
  readonly allowVerboseDeclarations?: boolean;
  readonly allowUltraShortAliases?: boolean;
  readonly contextualDefaults?: FadhilWebSyntax;
}

export interface NextGenCompileOptions {
  readonly defaults?: FadhilWebSyntax;
}

export interface NextGenSyntaxBenchmark {
  readonly estimatedPayloadBytes: number;
  readonly estimatedCoreBytes: number;
  readonly shorthandCompressionRatio: number;
}

export interface NextGenSyntaxAnalysis {
  readonly keyCollisions: ReadonlyArray<{ alias: string; canonical: string }>;
  readonly groupCollisions: ReadonlyArray<{ alias: string; canonical: string }>;
  readonly unknownShortKeys: ReadonlyArray<string>;
  readonly recursiveAliasChains: ReadonlyArray<string>;
}

const DEFAULT_ENGINE_CONFIG = Object.freeze({
  allowVerboseDeclarations: true,
  allowUltraShortAliases: true,
}) satisfies Required<Pick<NextGenSyntaxEngineConfig, 'allowVerboseDeclarations' | 'allowUltraShortAliases'>>;

function normalizeUltraShortKey(rawKey: string) {
  const canonical = normalizeKey(rawKey);
  return canonical ?? normalizeKey(rawKey.replace(/[$_\s-]/g, ''));
}

function normalizeUltraShortGroup(rawGroup: string) {
  const canonical = normalizeGroupName(rawGroup);
  return canonical ?? normalizeGroupName(rawGroup.replace(/[$_\s-]/g, ''));
}

export function precompileUltraShortSyntax(input: FadhilWebSyntax) {
  return compileSyntax(input);
}

export function benchmarkNextGenSyntax(input: FadhilWebSyntax) {
  const parsed = parseSyntaxInput(input);
  const compact = JSON.stringify(parsed);
  const resolved = JSON.stringify(resolveSyntax(parsed));

  return Object.freeze({
    estimatedPayloadBytes: Buffer.byteLength(compact, 'utf8'),
    estimatedCoreBytes: Buffer.byteLength(resolved, 'utf8'),
    shorthandCompressionRatio: compact.length === 0 ? 1 : Number((resolved.length / compact.length).toFixed(3)),
  }) as NextGenSyntaxBenchmark;
}

export function analyzeNextGenSyntax(input: FadhilWebSyntax) {
  const parsed = parseSyntaxInput(input);
  const unknownShortKeys = new Set<string>();

  for (const rawKey of Object.keys(parsed)) {
    if (rawKey === 'vars' || rawKey === 'aria' || rawKey === 'data' || rawKey === 'css' || rawKey === 'attrs') {
      continue;
    }

    if (!normalizeUltraShortKey(rawKey)) {
      unknownShortKeys.add(rawKey);
    }
  }

  const keyCollisions = Object.entries(KEY_ALIASES)
    .filter(([alias, canonical]) => alias !== canonical)
    .map(([alias, canonical]) => ({ alias, canonical }));

  const groupCollisions = Object.entries(GROUP_ALIASES)
    .filter(([alias, canonical]) => alias !== canonical)
    .map(([alias, canonical]) => ({ alias, canonical }));

  return Object.freeze({
    keyCollisions,
    groupCollisions,
    unknownShortKeys: Array.from(unknownShortKeys),
    recursiveAliasChains: [],
  }) as NextGenSyntaxAnalysis;
}

export function createNextGenSyntaxEngine(config: NextGenSyntaxEngineConfig = {}) {
  const resolvedConfig = {
    ...DEFAULT_ENGINE_CONFIG,
    ...config,
  };

  const precompile = (input: FadhilWebSyntax, options: NextGenCompileOptions = {}): FadhilWebCompiledSyntax => {
    const fragments: Array<FadhilWebSyntax | undefined> = [];

    if (resolvedConfig.contextualDefaults) {
      fragments.push(resolvedConfig.contextualDefaults);
    }

    if (options.defaults) {
      fragments.push(options.defaults);
    }

    fragments.push(input);

    const merged = composeSyntax(...fragments);
    return compileSyntax(merged);
  };

  const resolve = (input: FadhilWebSyntax, options: NextGenCompileOptions = {}) => precompile(input, options).resolved;

  const normalizeObject = (input: FadhilWebSyntaxObject): FadhilWebFlatSyntaxObject => {
    const result: FadhilWebSyntaxObject = {};

    for (const [rawKey, value] of Object.entries(input)) {
      const group = normalizeUltraShortGroup(rawKey);
      if (group) {
        result[group] = value as never;
        continue;
      }

      const key = normalizeUltraShortKey(rawKey);
      if (!key) {
        result[rawKey as keyof FadhilWebSyntaxObject] = value as never;
        continue;
      }

      result[key] = value as never;
    }

    return parseSyntaxInput(result);
  };

  return Object.freeze({
    config: resolvedConfig,
    precompile,
    resolve,
    analyze: analyzeNextGenSyntax,
    benchmark: benchmarkNextGenSyntax,
    normalizeObject,
  });
}
