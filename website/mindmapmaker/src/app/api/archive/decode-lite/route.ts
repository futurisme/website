import { NextResponse } from 'next/server';
import * as Y from 'yjs';
import { applyYjsSnapshot } from '@/features/maps/shared/map-snapshot';
import { decodeFadhilArchive } from '@/features/maps/shared/fadhil-archive';

type YRecordMap = Y.Map<unknown>;

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function createEmptyDoc() {
  const doc = new Y.Doc();
  doc.getMap('nodes');
  doc.getMap('edges');
  doc.getMap('selected');
  doc.getText('title');
  return doc;
}

function workspaceToEditorJson(doc: Y.Doc, archive: { sourceMapId: string; exportedAt: string; viewport?: { x: number; y: number; zoom: number } }) {
  const nodesMap = doc.getMap<YRecordMap>('nodes');
  const edgesMap = doc.getMap<YRecordMap>('edges');
  const titleText = doc.getText('title').toString();

  const nodes: Array<{ id: string; label: string; color?: string; position: { x: number; y: number } }> = [];
  nodesMap.forEach((nodeData, nodeId) => {
    const label = typeof nodeData.get('label') === 'string' ? String(nodeData.get('label')) : 'Node';
    const color = typeof nodeData.get('color') === 'string' ? String(nodeData.get('color')) : undefined;
    const positionRaw = nodeData.get('position');
    const positionObject = (positionRaw && typeof positionRaw === 'object') ? (positionRaw as { x?: unknown; y?: unknown }) : {};

    nodes.push({
      id: String(nodeId),
      label,
      color,
      position: {
        x: asNumber(positionObject.x, 0),
        y: asNumber(positionObject.y, 0),
      },
    });
  });

  const edges: Array<{ id: string; source: string; target: string; label?: string }> = [];
  edgesMap.forEach((edgeData, edgeId) => {
    const source = edgeData.get('source');
    const target = edgeData.get('target');
    const label = edgeData.get('label');

    if (typeof source !== 'string' || typeof target !== 'string') {
      return;
    }

    edges.push({
      id: String(edgeId),
      source,
      target,
      label: typeof label === 'string' ? label : undefined,
    });
  });

  return {
    meta: {
      sourceMapId: archive.sourceMapId,
      exportedAt: archive.exportedAt,
      title: titleText || undefined,
    },
    viewport: archive.viewport,
    nodes,
    edges,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { raw?: string };
    if (!body?.raw || typeof body.raw !== 'string') {
      return NextResponse.json({ ok: false, reason: 'raw payload required' }, { status: 400 });
    }

    const decoded = await decodeFadhilArchive(body.raw);
    if (decoded.contentType !== 'workspace-archive') {
      return NextResponse.json({ ok: false, reason: 'not workspace-archive contentType' }, { status: 400 });
    }

    const parsed = decoded.payload as Partial<{
      magic: string;
      version: number;
      exportedAt: string;
      sourceMapId: string;
      snapshot: string;
      viewport?: { x: number; y: number; zoom: number };
    }>;

    if (parsed.magic !== 'chartworkspace/archive' || parsed.version !== 1 || typeof parsed.snapshot !== 'string') {
      return NextResponse.json({ ok: false, reason: 'workspace archive payload invalid' }, { status: 400 });
    }

    const archive = {
      sourceMapId: typeof parsed.sourceMapId === 'string' ? parsed.sourceMapId : '0000',
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      viewport: parsed.viewport,
    };

    const doc = createEmptyDoc();
    applyYjsSnapshot(doc, parsed.snapshot);
    const workspace = workspaceToEditorJson(doc, archive);

    return NextResponse.json({ ok: true, workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, reason: message }, { status: 500 });
  }
}
