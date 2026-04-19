export interface FrameCoalescer {
  schedule: (task: () => void) => void;
  flush: () => void;
  cancel: () => void;
}

/**
 * Generic frame scheduler for fadhilweblib consumers.
 * Keeps the latest task and runs it once per frame.
 */
export function createFrameCoalescer(): FrameCoalescer {
  let frameId: number | null = null;
  let latestTask: (() => void) | null = null;

  const execute = () => {
    frameId = null;
    const task = latestTask;
    latestTask = null;
    task?.();
  };

  return {
    schedule(task) {
      latestTask = task;
      if (frameId !== null) {
        return;
      }

      if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
        execute();
        return;
      }

      frameId = window.requestAnimationFrame(execute);
    },
    flush() {
      if (frameId !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }
      execute();
    },
    cancel() {
      latestTask = null;
      if (frameId !== null && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }
      frameId = null;
    },
  };
}
