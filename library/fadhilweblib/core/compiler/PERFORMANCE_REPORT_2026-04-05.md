# fadhilweblib Compiler Performance Report (2026-04-05 UTC)

## Method

Measurements were produced by executing `runCompilerBenchmarks(...)` over three dataset sizes with hardened+minified output.

Formulas:

- `charsPerMs = sourceBytes / transpileDurationMs`
- `scannerStepsPerChar = scannerSteps / sourceBytes`
- `p95` is the 95th percentile over run durations sorted ascending.

## Results

| Scenario | Runs | Source bytes | Median (ms) | P95 (ms) | Avg chars/ms | Avg scanner steps/char | Median output bytes |
|---|---:|---:|---:|---:|---:|---:|---:|
| dashboard-small | 120 | 83 | 0.1242 | 0.2508 | 962.34 | 1.3012 | 901 |
| dashboard-medium | 80 | 3839 | 0.8044 | 3.8012 | 4777.91 | 1.2605 | 31922 |
| dashboard-large | 40 | 13319 | 3.9644 | 10.8691 | 2795.99 | 1.2883 | 117770 |

## Interpretation

- The scanner-step ratio remains close to ~1.26-1.30 steps/char across sizes, which is consistent with linear single-pass behavior.
- Median transpilation latency remains sub-4ms for a 13k+ byte source sample in this environment.
- Output expansion is expected because DSL is being lowered into explicit native DOM API instructions with no runtime helper payload.

## Repro command

```bash
npx -y tsx -e "import { runCompilerBenchmarks } from './library/fadhilweblib/core/compiler/performance-analysis.ts'; /* ...samples... */"
```
