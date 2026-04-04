export type FreedomTaskPriority = 'user-blocking' | 'user-visible' | 'background';

export type FreedomTaskOptions = {
  priority?: FreedomTaskPriority;
  delay?: number;
  signal?: AbortSignal;
};

export type FreedomTokenMap = Record<string, string | number>;

export type FreedomScopeStyleInput = {
  selector?: string;
  layer?: string;
  tokens?: FreedomTokenMap;
  declarations?: Record<string, string | number>;
};

export type FreedomStyleScope = {
  update: (input: FreedomScopeStyleInput) => void;
  destroy: () => void;
  getCssText: () => string;
};

function normalizeCssValue(value: string | number) {
  return typeof value === 'number' ? `${value}` : value.trim();
}

export function createScopedTokenStyles(input: FreedomScopeStyleInput) {
  const selector = input.selector?.trim() || ':root';
  const layer = input.layer?.trim();
  const tokens = input.tokens ?? {};
  const declarations = input.declarations ?? {};
  const lines: string[] = [];

  for (const [key, value] of Object.entries(tokens)) {
    const tokenName = key.startsWith('--') ? key : `--${key}`;
    lines.push(`  ${tokenName}: ${normalizeCssValue(value)};`);
  }

  for (const [key, value] of Object.entries(declarations)) {
    lines.push(`  ${key}: ${normalizeCssValue(value)};`);
  }

  const block = `:where(${selector}) {\n${lines.join('\n')}\n}`;
  return layer ? `@layer ${layer} {\n${block}\n}` : block;
}

function getAdoptedSheetsTarget(root: Document | ShadowRoot): { adoptedStyleSheets?: CSSStyleSheet[] } | null {
  if ('adoptedStyleSheets' in root) {
    return root as unknown as { adoptedStyleSheets?: CSSStyleSheet[] };
  }

  return null;
}

export function createFreedomStyleScope(initialInput: FreedomScopeStyleInput = {}): FreedomStyleScope {
  if (typeof document === 'undefined') {
    let cssText = createScopedTokenStyles(initialInput);
    return {
      update(input) {
        cssText = createScopedTokenStyles(input);
      },
      destroy() {
        cssText = '';
      },
      getCssText() {
        return cssText;
      },
    };
  }

  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-fwlb-freedom-scope', 'true');

  const maybeConstructable = typeof CSSStyleSheet !== 'undefined' && 'replaceSync' in CSSStyleSheet.prototype;
  const constructableSheet = maybeConstructable ? new CSSStyleSheet() : null;
  const adoptedTarget = getAdoptedSheetsTarget(document);
  let isMounted = false;
  let cssText = '';

  function mountIfNeeded() {
    if (isMounted) return;
    isMounted = true;

    if (constructableSheet && adoptedTarget?.adoptedStyleSheets) {
      adoptedTarget.adoptedStyleSheets = [...adoptedTarget.adoptedStyleSheets, constructableSheet];
      return;
    }

    document.head.append(styleElement);
  }

  function apply(nextCssText: string) {
    if (cssText === nextCssText) return;
    cssText = nextCssText;
    mountIfNeeded();

    if (constructableSheet) {
      constructableSheet.replaceSync(cssText);
      return;
    }

    styleElement.textContent = cssText;
  }

  apply(createScopedTokenStyles(initialInput));

  return {
    update(input) {
      apply(createScopedTokenStyles(input));
    },
    destroy() {
      if (!isMounted) return;

      if (constructableSheet && adoptedTarget?.adoptedStyleSheets) {
        adoptedTarget.adoptedStyleSheets = adoptedTarget.adoptedStyleSheets.filter((sheet) => sheet !== constructableSheet);
      } else if (styleElement.isConnected) {
        styleElement.remove();
      }

      isMounted = false;
      cssText = '';
    },
    getCssText() {
      return cssText;
    },
  };
}

export function queueFreedomTask<T>(task: () => T | Promise<T>, options: FreedomTaskOptions = {}): Promise<T> {
  const schedulerWithPostTask =
    typeof globalThis !== 'undefined' &&
    'scheduler' in globalThis &&
    typeof (globalThis.scheduler as { postTask?: unknown }).postTask === 'function'
      ? (globalThis.scheduler as {
          postTask: (callback: () => T | Promise<T>, options?: FreedomTaskOptions) => Promise<T>;
        })
      : null;

  if (schedulerWithPostTask) {
    return schedulerWithPostTask.postTask(task, options);
  }

  return new Promise<T>((resolve, reject) => {
    const run = () => {
      Promise.resolve()
        .then(task)
        .then(resolve, reject);
    };

    const delay = Math.max(0, options.delay ?? 0);
    const handle = setTimeout(run, delay);

    if (options.signal) {
      const onAbort = () => {
        clearTimeout(handle);
        reject(options.signal?.reason ?? new DOMException('Aborted', 'AbortError'));
      };

      if (options.signal.aborted) {
        onAbort();
        return;
      }

      options.signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

export type RenderBudgetHintOptions = {
  intrinsicSize?: string;
  mode?: 'auto' | 'visible' | 'hidden';
};

export function applyRenderBudgetHints(elements: Iterable<HTMLElement>, options: RenderBudgetHintOptions = {}) {
  const intrinsicSize = options.intrinsicSize ?? '1px 640px';
  const mode = options.mode ?? 'auto';

  for (const element of elements) {
    element.style.contentVisibility = mode;
    element.style.containIntrinsicSize = intrinsicSize;
    element.style.contain = 'layout style paint';
  }
}
