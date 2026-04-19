import { createFrameCoalescer, type FrameCoalescer } from '../core/performance/frame-coalescer';

export type { FrameCoalescer as RafCoalescer };

export interface ViewportFrameInput {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportThresholdState {
  isZoomBelowEdgeSimplifyThreshold: boolean;
  isZoomBelowMobileSnapThreshold: boolean;
}

export interface ViewportInteractionRuntimeOptions {
  edgeSimplificationZoomThreshold: number;
  mobileSnapZoomThreshold: number;
  thresholdHysteresis?: number;
}

export interface ViewportInteractionRuntime {
  schedule: (
    input: ViewportFrameInput,
    callbacks: {
      onSample: (x: number, y: number) => void;
      onThresholdState: (state: ViewportThresholdState) => void;
    }
  ) => void;
  flush: () => void;
  cancel: () => void;
}

export function createRafCoalescer(): FrameCoalescer {
  return createFrameCoalescer();
}

function resolveThresholdWithHysteresis(current: boolean, value: number, threshold: number, hysteresis: number) {
  if (current) {
    return value < threshold + hysteresis;
  }

  return value < threshold - hysteresis;
}

export function createViewportInteractionRuntime(options: ViewportInteractionRuntimeOptions): ViewportInteractionRuntime {
  const frame = createFrameCoalescer();
  const hysteresis = Math.max(0, options.thresholdHysteresis ?? 0.015);

  let latestInput: ViewportFrameInput | null = null;
  let thresholdState: ViewportThresholdState = {
    isZoomBelowEdgeSimplifyThreshold: false,
    isZoomBelowMobileSnapThreshold: false,
  };

  const emit = (
    callbacks: {
      onSample: (x: number, y: number) => void;
      onThresholdState: (state: ViewportThresholdState) => void;
    }
  ) => {
    const input = latestInput;
    if (!input) {
      return;
    }

    callbacks.onSample(Math.round(input.x), Math.round(input.y));

    const nextState: ViewportThresholdState = {
      isZoomBelowEdgeSimplifyThreshold: resolveThresholdWithHysteresis(
        thresholdState.isZoomBelowEdgeSimplifyThreshold,
        input.zoom,
        options.edgeSimplificationZoomThreshold,
        hysteresis
      ),
      isZoomBelowMobileSnapThreshold: resolveThresholdWithHysteresis(
        thresholdState.isZoomBelowMobileSnapThreshold,
        input.zoom,
        options.mobileSnapZoomThreshold,
        hysteresis
      ),
    };

    if (
      nextState.isZoomBelowEdgeSimplifyThreshold !== thresholdState.isZoomBelowEdgeSimplifyThreshold
      || nextState.isZoomBelowMobileSnapThreshold !== thresholdState.isZoomBelowMobileSnapThreshold
    ) {
      thresholdState = nextState;
      callbacks.onThresholdState(nextState);
    }
  };

  return {
    schedule(input, callbacks) {
      latestInput = input;
      frame.schedule(() => emit(callbacks));
    },
    flush() {
      frame.flush();
    },
    cancel() {
      frame.cancel();
    },
  };
}
