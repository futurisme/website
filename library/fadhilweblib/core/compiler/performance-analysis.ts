import { transpileSinglePassAotDsl, type AotCompileOptions } from './aot-transpiler';

export type CompilerBenchmarkSample = {
  name: string;
  source: string;
  runs: number;
  options?: AotCompileOptions;
};

export type CompilerBenchmarkResult = {
  name: string;
  runs: number;
  sourceBytes: number;
  medianMs: number;
  p95Ms: number;
  averageCharsPerMs: number;
  averageScannerStepsPerChar: number;
  outputBytesMedian: number;
};

function percentile(sortedValues: number[], p: number) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil((p / 100) * sortedValues.length) - 1));
  return sortedValues[index];
}

function median(sortedValues: number[]) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0 ? (sortedValues[mid - 1] + sortedValues[mid]) / 2 : sortedValues[mid];
}

export function runCompilerBenchmark(sample: CompilerBenchmarkSample): CompilerBenchmarkResult {
  const timings: number[] = [];
  const throughput: number[] = [];
  const scanRatios: number[] = [];
  const outputBytes: number[] = [];

  for (let index = 0; index < sample.runs; index += 1) {
    const result = transpileSinglePassAotDsl(sample.source, sample.options);
    timings.push(result.stats.transpileDurationMs);
    throughput.push(result.stats.charsPerMs);
    scanRatios.push(result.stats.scannerSteps / Math.max(1, result.stats.sourceBytes));
    outputBytes.push(result.stats.outputBytes);
  }

  const sortedTimings = [...timings].sort((a, b) => a - b);
  const sortedOutputBytes = [...outputBytes].sort((a, b) => a - b);
  const avgThroughput = throughput.reduce((sum, item) => sum + item, 0) / Math.max(1, throughput.length);
  const avgScanRatios = scanRatios.reduce((sum, item) => sum + item, 0) / Math.max(1, scanRatios.length);

  return {
    name: sample.name,
    runs: sample.runs,
    sourceBytes: sample.source.length,
    medianMs: Number(median(sortedTimings).toFixed(4)),
    p95Ms: Number(percentile(sortedTimings, 95).toFixed(4)),
    averageCharsPerMs: Number(avgThroughput.toFixed(2)),
    averageScannerStepsPerChar: Number(avgScanRatios.toFixed(4)),
    outputBytesMedian: median(sortedOutputBytes),
  };
}

export function runCompilerBenchmarks(samples: CompilerBenchmarkSample[]) {
  return samples.map((sample) => runCompilerBenchmark(sample));
}
