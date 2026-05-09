const OP_PRIORITY = { '+': 1, '-': 1, '*': 2, '/': 2 };
const ALLOWED_FUNCTIONS = {
  clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
  max: (...args) => Math.max(...args),
  min: (...args) => Math.min(...args),
  log10: (value) => Math.log10(value),
};

const expressionCache = new Map();
const programCache = new Map();

function tokenizeExpression(input) {
  const tokens = [];
  const source = String(input).replace(/\s+/g, '');
  let i = 0;

  while (i < source.length) {
    const char = source[i];
    if (char === '(' || char === ')') { tokens.push({ type: 'paren', value: char }); i += 1; continue; }
    if (char === ',') { tokens.push({ type: 'comma' }); i += 1; continue; }
    if (char === '+' || char === '*' || char === '/') { tokens.push({ type: 'op', value: char }); i += 1; continue; }
    if (char === '-') {
      const prev = tokens[tokens.length - 1];
      const unary = !prev || prev.type === 'op' || prev.type === 'comma' || (prev.type === 'paren' && prev.value === '(');
      if (unary) {
        const m = source.slice(i).match(/^-?\d+(\.\d+)?/);
        if (m) { tokens.push({ type: 'number', value: Number(m[0]) }); i += m[0].length; continue; }
      }
      tokens.push({ type: 'op', value: '-' }); i += 1; continue;
    }

    const numberMatch = source.slice(i).match(/^\d+(\.\d+)?/);
    if (numberMatch) { tokens.push({ type: 'number', value: Number(numberMatch[0]) }); i += numberMatch[0].length; continue; }

    const identifierMatch = source.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifierMatch) {
      const value = identifierMatch[0];
      const nextChar = source[i + value.length];
      if (nextChar === '(' && value in ALLOWED_FUNCTIONS) tokens.push({ type: 'fn', value });
      else tokens.push({ type: 'identifier', value });
      i += value.length;
      continue;
    }

    throw new Error(`Unsupported syntax near "${source.slice(i, i + 8)}"`);
  }

  return tokens;
}

function toRpn(tokens) {
  const output = [];
  const stack = [];
  tokens.forEach((token) => {
    if (token.type === 'number' || token.type === 'identifier') { output.push(token); return; }
    if (token.type === 'fn') { stack.push(token); return; }
    if (token.type === 'comma') {
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.type === 'paren' && top.value === '(') break;
        output.push(stack.pop());
      }
      return;
    }
    if (token.type === 'op') {
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.type === 'op' && OP_PRIORITY[top.value] >= OP_PRIORITY[token.value]) { output.push(stack.pop()); continue; }
        if (top.type === 'fn') { output.push(stack.pop()); continue; }
        break;
      }
      stack.push(token);
      return;
    }
    if (token.type === 'paren' && token.value === '(') { stack.push(token); return; }
    if (token.type === 'paren' && token.value === ')') {
      while (stack.length) {
        const top = stack.pop();
        if (top.type === 'paren' && top.value === '(') break;
        output.push(top);
      }
      if (stack.length && stack[stack.length - 1].type === 'fn') output.push(stack.pop());
    }
  });

  while (stack.length) {
    const token = stack.pop();
    if (token.type !== 'paren') output.push(token);
  }
  return output;
}

function evalRpn(tokens, scope) {
  const stack = [];
  tokens.forEach((token) => {
    if (token.type === 'number') { stack.push(token.value); return; }
    if (token.type === 'identifier') { stack.push(Number(scope[token.value] ?? 0)); return; }
    if (token.type === 'op') {
      const right = stack.pop() ?? 0;
      const left = stack.pop() ?? 0;
      if (token.value === '+') stack.push(left + right);
      if (token.value === '-') stack.push(left - right);
      if (token.value === '*') stack.push(left * right);
      if (token.value === '/') stack.push(right === 0 ? 0 : left / right);
      return;
    }
    if (token.type === 'fn') {
      if (token.value === 'log10') { const value = stack.pop() ?? 0; stack.push(ALLOWED_FUNCTIONS.log10(Math.max(1e-9, value))); return; }
      if (token.value === 'clamp') {
        const max = stack.pop() ?? 0;
        const min = stack.pop() ?? 0;
        const value = stack.pop() ?? 0;
        stack.push(ALLOWED_FUNCTIONS.clamp(value, min, max));
        return;
      }
      const right = stack.pop() ?? 0;
      const left = stack.pop() ?? 0;
      stack.push(ALLOWED_FUNCTIONS[token.value](left, right));
    }
  });
  return stack.pop() ?? 0;
}

export function evaluateGameMathExpression(expression, scope = {}) {
  const key = String(expression);
  const cached = expressionCache.get(key);
  if (cached) return evalRpn(cached, scope);
  const rpn = toRpn(tokenizeExpression(key));
  expressionCache.set(key, rpn);
  return evalRpn(rpn, scope);
}

export function evaluateGameMathProgram(program, scope = {}) {
  const key = String(program);
  const cached = programCache.get(key);
  const instructions = cached || key.split(';').map((segment) => segment.trim()).filter(Boolean).map((segment) => {
    const index = segment.indexOf('=');
    return { key: segment.slice(0, index).trim(), expression: segment.slice(index + 1).trim() };
  });
  if (!cached) programCache.set(key, instructions);
  const next = { ...scope };
  instructions.forEach((inst) => { next[inst.key] = evaluateGameMathExpression(inst.expression, next); });
  return next;
}

export function formatMoneyCompact(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '$0';
  if (Math.abs(amount) >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (Math.abs(amount) >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
  if (Math.abs(amount) >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

export function formatDateFromDays(days) {
  const base = new Date('2000-01-01T00:00:00.000Z');
  base.setUTCDate(base.getUTCDate() + Math.max(0, Number(days) || 0));
  return base.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
