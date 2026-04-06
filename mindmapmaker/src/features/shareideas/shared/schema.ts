export interface ShareIdeasCard {
  id: string;
  title: string;
  description: string;
}

export interface ShareIdeasFolder {
  id: string;
  name: string;
  cards: ShareIdeasCard[];
}

export interface ShareIdeasDatabase {
  folders: ShareIdeasFolder[];
}

export const DEFAULT_SHARE_IDEAS_DATA: ShareIdeasDatabase = {
  folders: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeId(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 96) : fallback;
}

function sanitizeCard(value: unknown, fallbackId: string): ShareIdeasCard | null {
  if (!isRecord(value)) return null;

  const title = typeof value.title === 'string' ? value.title.trim().slice(0, 120) : '';
  if (!title) return null;

  const description = typeof value.description === 'string' ? value.description.trim().slice(0, 6000) : '';

  return {
    id: sanitizeId(value.id, fallbackId),
    title,
    description,
  };
}

function sanitizeFolder(value: unknown, fallbackId: string): ShareIdeasFolder | null {
  if (!isRecord(value)) return null;

  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 80) : '';
  if (!name) return null;

  const folderId = sanitizeId(value.id, fallbackId);
  const rawCards = Array.isArray(value.cards) ? value.cards : [];

  const cards = rawCards
    .map((card, index) => sanitizeCard(card, `card-${folderId}-${index + 1}`))
    .filter((card): card is ShareIdeasCard => Boolean(card))
    .slice(0, 1000);

  return {
    id: folderId,
    name,
    cards,
  };
}

export function sanitizeShareIdeasDatabase(input: unknown): ShareIdeasDatabase {
  const root = isRecord(input) ? input : {};
  const rawFolders = Array.isArray(root.folders) ? root.folders : [];

  const folders = rawFolders
    .map((folder, index) => sanitizeFolder(folder, `folder-${index + 1}`))
    .filter((folder): folder is ShareIdeasFolder => Boolean(folder))
    .slice(0, 300);

  return { folders };
}
