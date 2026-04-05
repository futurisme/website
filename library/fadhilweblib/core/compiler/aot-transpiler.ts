export type AotCompileOptions = {
  moduleName?: string;
  minify?: boolean;
  accessMode?: 'readable' | 'hardened';
  sourceMapHint?: boolean;
};

export type AotCompileStats = {
  sourceBytes: number;
  outputBytes: number;
  scannerSteps: number;
  nodeCount: number;
  attributeCount: number;
  eventBindingCount: number;
  reactiveBindingCount: number;
  estimatedRuntimeBytes: number;
  transpileDurationMs: number;
  charsPerMs: number;
  compressionRatio: number;
};

export type AotCompileResult = {
  code: string;
  stats: AotCompileStats;
  checksum: string;
};

type DslAttribute = {
  key: string;
  value: string;
};

type DslNode = {
  kind: 'element' | 'text';
  tag?: string;
  id?: string;
  classes?: string[];
  attrs?: DslAttribute[];
  on?: Array<{ event: string; handler: string }>;
  text?: string;
  reactiveKeys?: string[];
  children?: DslNode[];
};

type ScannerState = {
  input: string;
  cursor: number;
  steps: number;
};

function nowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

function isWhitespace(char: string) {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

function isIdentifier(char: string) {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char === '_' || char === '-';
}

function consumeWhitespace(state: ScannerState) {
  while (state.cursor < state.input.length) {
    state.steps += 1;
    if (!isWhitespace(state.input[state.cursor])) {
      return;
    }

    state.cursor += 1;
  }
}

function expectChar(state: ScannerState, char: string) {
  state.steps += 1;
  if (state.input[state.cursor] !== char) {
    throw new Error(`Expected "${char}" at position ${state.cursor}.`);
  }

  state.cursor += 1;
}

function readIdentifier(state: ScannerState, label: string) {
  const start = state.cursor;
  while (state.cursor < state.input.length) {
    state.steps += 1;
    if (!isIdentifier(state.input[state.cursor])) {
      break;
    }

    state.cursor += 1;
  }

  if (start === state.cursor) {
    throw new Error(`Expected ${label} at position ${state.cursor}.`);
  }

  return state.input.slice(start, state.cursor);
}

function readQuotedText(state: ScannerState) {
  expectChar(state, '"');
  const start = state.cursor;

  while (state.cursor < state.input.length) {
    state.steps += 1;
    if (state.input[state.cursor] === '"') {
      const value = state.input.slice(start, state.cursor);
      state.cursor += 1;
      return value;
    }

    state.cursor += 1;
  }

  throw new Error('Unterminated string literal in DSL source.');
}

function parseReactiveKeys(text: string) {
  const keys: string[] = [];
  const matcher = /\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g;

  let match = matcher.exec(text);
  while (match) {
    keys.push(match[1]);
    match = matcher.exec(text);
  }

  return keys;
}

function parseTextNode(state: ScannerState): DslNode {
  const text = readQuotedText(state);
  return {
    kind: 'text',
    text,
    reactiveKeys: parseReactiveKeys(text),
  };
}

function parseElementNode(state: ScannerState): DslNode {
  const tag = readIdentifier(state, 'tag name');
  const node: DslNode = {
    kind: 'element',
    tag,
    classes: [],
    attrs: [],
    on: [],
    children: [],
  };

  while (state.cursor < state.input.length) {
    state.steps += 1;
    const char = state.input[state.cursor];

    if (char === '#') {
      state.cursor += 1;
      node.id = readIdentifier(state, 'id selector');
      continue;
    }

    if (char === '.') {
      state.cursor += 1;
      node.classes?.push(readIdentifier(state, 'class selector'));
      continue;
    }

    if (char === '@') {
      state.cursor += 1;
      const event = readIdentifier(state, 'event name');
      expectChar(state, '=');
      node.on?.push({ event, handler: readIdentifier(state, 'event handler') });
      continue;
    }

    if (char === '[') {
      state.cursor += 1;
      const key = readIdentifier(state, 'attribute key');
      expectChar(state, '=');
      const value = readQuotedText(state);
      expectChar(state, ']');
      node.attrs?.push({ key, value });
      continue;
    }

    if (char === '"') {
      node.children?.push(parseTextNode(state));
      continue;
    }

    if (isWhitespace(char)) {
      state.cursor += 1;
      continue;
    }

    if (char === '{' || char === ';' || char === '\n' || char === '\r' || char === '}') {
      return node;
    }

    throw new Error(`Unexpected token "${char}" in element at position ${state.cursor}.`);
  }

  return node;
}

function parseNode(state: ScannerState): DslNode {
  if (state.input[state.cursor] === '"') {
    return parseTextNode(state);
  }

  return parseElementNode(state);
}

function parseBlock(state: ScannerState) {
  const nodes: DslNode[] = [];

  while (state.cursor < state.input.length) {
    consumeWhitespace(state);
    if (state.cursor >= state.input.length) {
      break;
    }

    if (state.input[state.cursor] === '}') {
      return nodes;
    }

    const node = parseNode(state);

    consumeWhitespace(state);
    if (state.input[state.cursor] === '{') {
      state.cursor += 1;
      node.children = parseBlock(state);
      expectChar(state, '}');
    }

    nodes.push(node);

    consumeWhitespace(state);
    if (state.input[state.cursor] === ';') {
      state.cursor += 1;
    }
  }

  return nodes;
}

function parseDsl(input: string) {
  const state: ScannerState = { input, cursor: 0, steps: 0 };
  const nodes = parseBlock(state);
  consumeWhitespace(state);

  if (state.cursor < state.input.length) {
    throw new Error(`Unexpected trailing content at position ${state.cursor}.`);
  }

  return {
    nodes,
    steps: state.steps,
  };
}

function escapeTemplateLiteralValue(value: string) {
  return value.replaceAll('`', '\\`').replaceAll('${', '\\${');
}

function interpolateText(text: string) {
  const chunks: string[] = [];
  let cursor = 0;
  const matcher = /\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g;
  let match = matcher.exec(text);

  while (match) {
    const index = match.index;
    if (index > cursor) {
      chunks.push(`\`${escapeTemplateLiteralValue(text.slice(cursor, index))}\``);
    }

    chunks.push(`String(ctx.state?.[${JSON.stringify(match[1])}]??"")`);
    cursor = index + match[0].length;
    match = matcher.exec(text);
  }

  if (cursor < text.length) {
    chunks.push(`\`${escapeTemplateLiteralValue(text.slice(cursor))}\``);
  }

  return chunks.length === 0 ? '""' : chunks.join('+');
}

function serialize(
  nodes: DslNode[],
  options: AotCompileOptions,
  counters: {
    nodeCount: number;
    attributeCount: number;
    eventBindingCount: number;
    reactiveBindingCount: number;
  }
) {
  const minify = options.minify ?? false;
  const accessMode = options.accessMode ?? 'readable';
  const nl = minify ? '' : '\n';
  const indent = (depth: number) => (minify ? '' : '  '.repeat(depth));
  const parts: string[] = [];

  const varFactory = (() => {
    let readableIndex = 0;
    let hardenedIndex = 0;

    return () => {
      if (accessMode === 'readable') {
        const id = `node${readableIndex}`;
        readableIndex += 1;
        return id;
      }

      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      const first = alphabet[hardenedIndex % alphabet.length];
      const second = Math.floor(hardenedIndex / alphabet.length).toString(36);
      hardenedIndex += 1;
      return `_${first}${second}`;
    };
  })();

  function emitNode(node: DslNode, parentRef: string, depth: number) {
    counters.nodeCount += 1;

    if (node.kind === 'text') {
      const textRef = varFactory();
      const textContent = interpolateText(node.text ?? '');

      parts.push(`${indent(depth)}const ${textRef}=document.createTextNode(${textContent});${nl}`);
      parts.push(`${indent(depth)}${parentRef}.appendChild(${textRef});${nl}`);

      for (const key of node.reactiveKeys ?? []) {
        counters.reactiveBindingCount += 1;
        parts.push(`${indent(depth)}ctx.observe?.(${JSON.stringify(key)},()=>{${textRef}.textContent=${textContent};});${nl}`);
      }

      return;
    }

    const ref = varFactory();
    parts.push(`${indent(depth)}const ${ref}=document.createElement(${JSON.stringify(node.tag)});${nl}`);

    if (node.id) {
      parts.push(`${indent(depth)}${ref}.id=${JSON.stringify(node.id)};${nl}`);
    }

    if ((node.classes?.length ?? 0) > 0) {
      parts.push(`${indent(depth)}${ref}.className=${JSON.stringify((node.classes ?? []).join(' '))};${nl}`);
    }

    for (const attr of node.attrs ?? []) {
      counters.attributeCount += 1;
      parts.push(`${indent(depth)}${ref}.setAttribute(${JSON.stringify(attr.key)},${JSON.stringify(attr.value)});${nl}`);
    }

    for (const eventBinding of node.on ?? []) {
      counters.eventBindingCount += 1;
      parts.push(
        `${indent(depth)}${ref}.addEventListener(${JSON.stringify(eventBinding.event)},(e)=>ctx.handlers?.[${JSON.stringify(eventBinding.handler)}]?.(e));${nl}`
      );
    }

    parts.push(`${indent(depth)}${parentRef}.appendChild(${ref});${nl}`);

    for (const child of node.children ?? []) {
      emitNode(child, ref, depth + 1);
    }
  }

  parts.push(`// ${options.moduleName ?? 'fadhilweblib-aot'}${nl}`);
  parts.push(`export function mount(target,ctx={}){${nl}`);
  parts.push(`${indent(1)}const root=target??document.createDocumentFragment();${nl}`);

  for (const node of nodes) {
    emitNode(node, 'root', 1);
  }

  parts.push(`${indent(1)}return root;${nl}`);
  parts.push(`}${nl}`);

  if (options.sourceMapHint) {
    parts.push(`//# sourceURL=${options.moduleName ?? 'fadhilweblib-aot'}.mjs${nl}`);
  }

  return minify ? parts.join('').replace(/\s+/g, ' ').replace(/ ?([{}();,+]) ?/g, '$1') : parts.join('');
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function transpileSinglePassAotDsl(source: string, options: AotCompileOptions = {}): AotCompileResult {
  const startedAt = nowMs();
  const parsed = parseDsl(source);

  const counters = {
    nodeCount: 0,
    attributeCount: 0,
    eventBindingCount: 0,
    reactiveBindingCount: 0,
  };

  const code = serialize(parsed.nodes, options, counters);
  const durationMs = Math.max(0.0001, nowMs() - startedAt);

  return {
    code,
    checksum: hashString(code),
    stats: {
      sourceBytes: source.length,
      outputBytes: code.length,
      scannerSteps: parsed.steps,
      nodeCount: counters.nodeCount,
      attributeCount: counters.attributeCount,
      eventBindingCount: counters.eventBindingCount,
      reactiveBindingCount: counters.reactiveBindingCount,
      estimatedRuntimeBytes: 0,
      transpileDurationMs: Number(durationMs.toFixed(4)),
      charsPerMs: Number((source.length / durationMs).toFixed(2)),
      compressionRatio: Number((code.length / Math.max(1, source.length)).toFixed(4)),
    },
  };
}
