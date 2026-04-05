import { runDebugSession, type DebugSessionReport } from './debug-agent';
import { runCompilerBenchmark, type CompilerBenchmarkResult } from '../core/compiler/performance-analysis';

export type QualityTestInput = {
  scope: 'push' | 'major-change';
  dslSamples?: string[];
  telemetry?: {
    latencyRisk?: number;
    errorRisk?: number;
    memoryRisk?: number;
  };
};

export type QualityCorrection = {
  id: string;
  kind: 'autofix' | 'debug' | 'optimization';
  description: string;
  applied: boolean;
};

export type QualityTestReport = {
  passed: boolean;
  scope: QualityTestInput['scope'];
  runtimeBudgetMs: number;
  benchmark: CompilerBenchmarkResult;
  debugSession: DebugSessionReport;
  corrections: QualityCorrection[];
};

function clamp(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
}

function createDefaultSample() {
  return 'main.shell{header.hero{h1 "{{title}}";p "{{subtitle}}"};section.panel{button.primary@click=save "Save";button.secondary@click=reset "Reset"}}';
}

export function runQualityTest(input: QualityTestInput): QualityTestReport {
  const startedAt = Date.now();
  const source = input.dslSamples?.join(';') || createDefaultSample();

  const benchmark = runCompilerBenchmark({
    name: `qualitytest-${input.scope}`,
    source,
    runs: input.scope === 'major-change' ? 40 : 16,
    options: {
      minify: true,
      accessMode: 'hardened',
    },
  });

  const debugSession = runDebugSession({
    signals: [
      { key: 'latency', value: clamp(input.telemetry?.latencyRisk, benchmark.p95Ms > 8 ? 0.8 : 0.35), weight: 2 },
      { key: 'errors', value: clamp(input.telemetry?.errorRisk, 0.25), weight: 3 },
      { key: 'memory', value: clamp(input.telemetry?.memoryRisk, benchmark.outputBytesMedian > 100_000 ? 0.55 : 0.2), weight: 1.5 },
    ],
    context: {
      subsystem: 'website-development',
      releaseTag: input.scope,
    },
  });

  const corrections: QualityCorrection[] = [
    {
      id: 'opt-001',
      kind: 'optimization',
      description: 'Prioritize hardened + minified AOT output for deployment artifacts.',
      applied: true,
    },
    {
      id: 'dbg-001',
      kind: 'debug',
      description: 'Generate incident repair workflow when risk band is degraded/failure.',
      applied: debugSession.diagnostics.riskBand === 'degraded' || debugSession.diagnostics.riskBand === 'failure',
    },
    {
      id: 'fix-001',
      kind: 'autofix',
      description: 'Block release if benchmark p95 exceeds 12ms on qualitytest sample.',
      applied: benchmark.p95Ms <= 12,
    },
  ];

  const runtimeBudgetMs = Date.now() - startedAt;
  const passed = corrections.every((item) => item.applied || item.kind === 'debug');

  return {
    passed,
    scope: input.scope,
    runtimeBudgetMs,
    benchmark,
    debugSession,
    corrections,
  };
}
