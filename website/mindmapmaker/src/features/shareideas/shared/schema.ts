export interface ShareIdeasCard {
  id: string;
  title: string;
  description: string;
  progress: number;
}

export interface ShareIdeasFolder {
  id: string;
  name: string;
  cards: ShareIdeasCard[];
}

export interface ShareIdeasCategory {
  id: string;
  name: string;
  folders: ShareIdeasFolder[];
}

export interface ShareIdeasDatabase {
  categories: ShareIdeasCategory[];
}

export const DEFAULT_SHARE_IDEAS_DATA: ShareIdeasDatabase = {
  categories: [{ id: 'category-1', name: 'Kategori 1', folders: [] }],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeId(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 96) : fallback;
}

function sanitizeProgress(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
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
    progress: sanitizeProgress(value.progress),
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
  const rawCategories = Array.isArray(root.categories) ? root.categories : [];
  const fallbackFolders = Array.isArray(root.folders) ? root.folders : [];

  const categories = (rawCategories.length ? rawCategories : [{ id: 'category-1', name: 'Kategori 1', folders: fallbackFolders }])
    .map((category, categoryIndex) => {
      if (!isRecord(category)) return null;
      const id = sanitizeId(category.id, `category-${categoryIndex + 1}`);
      const name = typeof category.name === 'string' && category.name.trim() ? category.name.trim().slice(0, 80) : `Kategori ${categoryIndex + 1}`;
      const rawFolders = Array.isArray(category.folders) ? category.folders : [];
      const folders = rawFolders
        .map((folder, index) => sanitizeFolder(folder, `folder-${id}-${index + 1}`))
        .filter((folder): folder is ShareIdeasFolder => Boolean(folder))
        .slice(0, 300);
      return { id, name, folders };
    })
    .filter((category): category is ShareIdeasCategory => Boolean(category))
    .slice(0, 64);

  return { categories: categories.length ? categories : DEFAULT_SHARE_IDEAS_DATA.categories };
}
