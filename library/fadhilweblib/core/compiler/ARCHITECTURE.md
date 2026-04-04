# fadhilweblib Compiler Core (April 4, 2026)

This subsystem defines a **strictly headless**, **renderer/runtime/protocol agnostic** architecture for the fadhilweblib evolution track.

## Core principles

- **Single-Pass AOT Transpiler**: a hand-written pointer scanner compiles the DSL into zero-runtime native ESM with direct DOM API instructions.
- **Zig/Rust compiler core contract**: the runtime-facing API models a Rust primary backend with a Zig bridge layer and a hard `zeroRuntimeOverhead: true` invariant.
- **Hyper-Granular Reactivity**: dependency graph construction with deterministic topological ordering and cycle protection.
- **AI-optimized tree shaking**: symbol-level removal pipeline with side-effect safeguards and an adaptive priority score.
- **Sub-5ms HMR planning**: profile-based latency estimation with strategy selection (`parallel-diff`, `graph-prune`, `cache-replay`).
- **Edge-Native Hydration**: deterministic partitioning into immediate, streamed, and deferred hydration lanes.

## Integration point

Use `runCompilerOverhaul(...)` to generate one report that captures backend posture, sovereignty flags, reactivity telemetry, tree-shaking footprint, HMR budget, and hydration plan.

## Notes

This release introduces a portable planning and orchestration layer. Actual low-level compiler execution can be bound later by wiring this API to native Rust/Zig binaries or WASI modules while keeping the TypeScript contract stable.


## AOT DSL quick example

Input DSL:

```txt
div#app.shell "{{count}}"; button.primary@click=increment "Increment"
```

Compiles to native ESM `mount(...)` code that uses `document.createElement`, `textContent`, and `addEventListener` directly with optional `ctx.observe` hooks for fine-grained reactivity.
