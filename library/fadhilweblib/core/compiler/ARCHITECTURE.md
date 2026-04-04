# fadhilweblib Compiler Core (April 4, 2026)

This subsystem defines a **strictly headless**, **renderer/runtime/protocol agnostic** architecture for the fadhilweblib evolution track.

## Core principles

- **Zig/Rust compiler core contract**: the runtime-facing API models a Rust primary backend with a Zig bridge layer and a hard `zeroRuntimeOverhead: true` invariant.
- **Hyper-Granular Reactivity**: dependency graph construction with deterministic topological ordering and cycle protection.
- **AI-optimized tree shaking**: symbol-level removal pipeline with side-effect safeguards and an adaptive priority score.
- **Sub-5ms HMR planning**: profile-based latency estimation with strategy selection (`parallel-diff`, `graph-prune`, `cache-replay`).
- **Edge-Native Hydration**: deterministic partitioning into immediate, streamed, and deferred hydration lanes.

## Integration point

Use `runCompilerOverhaul(...)` to generate one report that captures backend posture, sovereignty flags, reactivity telemetry, tree-shaking footprint, HMR budget, and hydration plan.

## Notes

This release introduces a portable planning and orchestration layer. Actual low-level compiler execution can be bound later by wiring this API to native Rust/Zig binaries or WASI modules while keeping the TypeScript contract stable.
