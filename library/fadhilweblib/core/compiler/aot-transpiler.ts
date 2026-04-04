export type AotCompileOptions = {
  moduleName?: string;
  minify?: boolean;
};

export type AotCompileStats = {
  sourceBytes: number;
  outputBytes: number;
  scannerSteps: number;
  nodeCount: number;
  estimatedRuntimeBytes: number;
};

export type AotCompileResult = {
  code: string;
  stats: AotCompileStats;
};

type DslNode = {
  tag: string;
  id?: string;
  classes: string[];
  text?: string;
  reactiveKey?: string;
  on?: { event: string; handler: string };
};

type ScannerState = {
  input: string;
  cursor: number;
  steps: number;
};

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

function parseNode(state: ScannerState): DslNode {
  const tag = readIdentifier(state, 'tag name');
  const node: DslNode = { tag, classes: [] };

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
      node.classes.push(readIdentifier(state, 'class selector'));
      continue;
    }

    if (char === '@') {
      state.cursor += 1;
      const event = readIdentifier(state, 'event name');
      expectChar(state, '=');
      node.on = { event, handler: readIdentifier(state, 'event handler') };
      continue;
    }

    if (char === '"') {
      node.text = readQuotedText(state);
      const match = /^\{\{\s*([A-Za-z0-9_-]+)\s*\}\}$/.exec(node.text);
      if (match) {
        node.reactiveKey = match[1];
      }
      continue;
    }

    if (isWhitespace(char)) {
      state.cursor += 1;
      continue;
    }

    if (char === ';' || char === '\n' || char === '\r') {
      return node;
    }

    throw new Error(`Unexpected token "${char}" in node at position ${state.cursor}.`);
  }

  return node;
}

function parseDsl(input: string) {
  const state: ScannerState = { input, cursor: 0, steps: 0 };
  const nodes: DslNode[] = [];

  while (state.cursor < state.input.length) {
    consumeWhitespace(state);
    if (state.cursor >= state.input.length) {
      break;
    }

    const node = parseNode(state);
    nodes.push(node);

    while (state.cursor < state.input.length) {
      state.steps += 1;
      const char = state.input[state.cursor];
      if (char === ';' || char === '\n' || char === '\r') {
        state.cursor += 1;
        break;
      }
      if (!isWhitespace(char)) {
        break;
      }
      state.cursor += 1;
    }
  }

  return { nodes, steps: state.steps };
}

function serialize(nodes: DslNode[], options: AotCompileOptions) {
  const parts: string[] = [];
  const minify = options.minify ?? false;
  const nl = minify ? '' : '\n';
  const sp = minify ? '' : ' ';

  parts.push(`//${sp}${options.moduleName ?? 'fadhilweblib-aot'}${nl}`);
  parts.push(`export function mount(target,ctx={}){${nl}`);
  parts.push(`${sp}const root=target??document.createDocumentFragment();${nl}`);

  let index = 0;
  for (const node of nodes) {
    const ref = `n${index}`;
    parts.push(`${sp}const ${ref}=document.createElement(${JSON.stringify(node.tag)});${nl}`);

    if (node.id) {
      parts.push(`${sp}${ref}.id=${JSON.stringify(node.id)};${nl}`);
    }

    if (node.classes.length > 0) {
      parts.push(`${sp}${ref}.className=${JSON.stringify(node.classes.join(' '))};${nl}`);
    }

    if (node.text && !node.reactiveKey) {
      parts.push(`${sp}${ref}.textContent=${JSON.stringify(node.text)};${nl}`);
    }

    if (node.reactiveKey) {
      parts.push(`${sp}${ref}.textContent=String(ctx.state?.[${JSON.stringify(node.reactiveKey)}]??"");${nl}`);
      parts.push(`${sp}ctx.observe?.(${JSON.stringify(node.reactiveKey)},(v)=>{${ref}.textContent=String(v??"");});${nl}`);
    }

    if (node.on) {
      parts.push(`${sp}${ref}.addEventListener(${JSON.stringify(node.on.event)},(e)=>ctx.handlers?.[${JSON.stringify(node.on.handler)}]?.(e));${nl}`);
    }

    parts.push(`${sp}root.appendChild(${ref});${nl}`);
    index += 1;
  }

  parts.push(`${sp}return root;${nl}`);
  parts.push(`}${nl}`);
  return parts.join('');
}

export function transpileSinglePassAotDsl(source: string, options: AotCompileOptions = {}): AotCompileResult {
  const parsed = parseDsl(source);
  const code = serialize(parsed.nodes, options);

  return {
    code,
    stats: {
      sourceBytes: source.length,
      outputBytes: code.length,
      scannerSteps: parsed.steps,
      nodeCount: parsed.nodes.length,
      estimatedRuntimeBytes: 0,
    },
  };
}
