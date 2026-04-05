# fadhilailib

`fadhilailib` is a dedicated AI development, repair, and debugging subsystem for website engineering workflows.

## Capabilities

- `diagnoseSystemHealth(...)`: weighted diagnostics and risk classification.
- `createRepairPlan(...)`: staged repair orchestration for maintenance, stabilization, or incident states.
- `runDebugSession(...)`: one-call diagnostics + repair planning with contextual metadata.
- `runQualityTest(...)`: single-execution quality gate combining performance benchmarking, debugging, and automatic correction decisions.

## Quality gate requirement

A GitHub Action workflow (`.github/workflows/qualitytest.yml`) runs `runQualityTest({ scope: 'push' })` on every push to `main` and on pull requests to `main`.
