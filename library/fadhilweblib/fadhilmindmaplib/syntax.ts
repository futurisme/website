import type { MindmapNodeInput } from './types';

export interface MindmapSyntaxPlan {
  rootTitle: string;
  nodes: MindmapNodeInput[];
}

/**
 * Lightweight, allocation-aware parser for a compact mindmap DSL.
 *
 * Example:
 * root("Main")
 * node(2, "Branch", 1)
 */
export function parseMindmapSyntax(source: string): MindmapSyntaxPlan {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let rootTitle = 'Root';
  const nodes: MindmapNodeInput[] = [];

  for (const line of lines) {
    if (line.startsWith('root(')) {
      rootTitle = readQuotedArg(line) ?? rootTitle;
      continue;
    }

    if (line.startsWith('node(')) {
      const body = line.slice(5, -1);
      const parts = splitCsv(body);
      if (parts.length < 3) {
        throw new Error(`Invalid node syntax: ${line}`);
      }

      const id = Number(parts[0]);
      const title = unquote(parts[1]);
      const parentId = Number(parts[2]);

      if (!Number.isFinite(id) || !Number.isFinite(parentId)) {
        throw new Error(`Invalid node ids: ${line}`);
      }

      nodes.push({
        id,
        title,
        parentId,
      });
    }
  }

  return { rootTitle, nodes };
}

function readQuotedArg(call: string): string | null {
  const start = call.indexOf('("');
  const end = call.lastIndexOf('")');
  if (start === -1 || end === -1 || end <= start + 2) {
    return null;
  }
  return call.slice(start + 2, end);
}

function splitCsv(input: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
      continue;
    }

    if (ch === ',' && !inQuote) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    out.push(current.trim());
  }
  return out;
}

function unquote(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}
