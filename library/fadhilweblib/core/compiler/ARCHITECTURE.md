# fadhilweblib Compiler Core (April 5, 2026)

This subsystem defines a **strictly headless**, **renderer/runtime/protocol agnostic** architecture for the `fadhilweblib` evolution track.

## Core principles

- **Single-Pass AOT Transpiler**: a hand-written pointer scanner compiles DSL syntax directly to zero-runtime native ESM using direct DOM APIs.
- **Access hardening mode**: generated variable identifiers can be emitted in compact, hardened form (`accessMode: "hardened"`) to reduce readability and accidental mutation surfaces.
- **Zig/Rust compiler core contract**: the runtime-facing API models a Rust primary backend with a Zig bridge and a `zeroRuntimeOverhead: true` invariant.
- **Hyper-Granular Reactivity**: deterministic dependency graphing and selective `ctx.observe` bindings for interpolation updates.
- **AI-optimized tree shaking**: symbol-level pruning with side-effect-aware retention logic.
- **Sub-5ms HMR planning**: profile-driven strategy selection (`parallel-diff`, `graph-prune`, `cache-replay`).
- **Edge-Native Hydration**: deterministic partitioning into immediate, streamed, and deferred lanes.

## AOT DSL quick example

Input DSL:

```txt
section#app.shell[data-kind="hero"]{h1 "Welcome {{name}}";button.primary@click=increment "Increment"}
```

Compiled output is native ESM with direct `document.createElement`, `setAttribute`, `textContent`, and `addEventListener` calls. Reactive text tokens are rewritten into direct state reads and optional `ctx.observe` subscriptions.

## Performance and analysis model

- `runCompilerBenchmark(...)` and `runCompilerBenchmarks(...)` provide run-based metrics (`median`, `p95`, throughput, scanner-step/char ratio).
- Calculations are executed from real transpilation runs and surfaced as numbers suitable for release gates.

## Notes

This release keeps the API stable while leaving room to swap code generation and optimization passes into native Zig/Rust binaries or WASI modules without changing external TypeScript contracts.
