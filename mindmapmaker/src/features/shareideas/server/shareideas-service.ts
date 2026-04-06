import { Prisma } from '@prisma/client';
import { activeDatabaseHost, prisma } from '@/lib/prisma';
import {
  DEFAULT_SHARE_IDEAS_DATA,
  sanitizeShareIdeasDatabase,
  type ShareIdeasDatabase,
} from '@/features/shareideas/shared/schema';

const SYSTEM_SHARE_IDEAS_TITLE = '__SYSTEM__SHARE_IDEAS_V1';
const CACHE_TTL_MS = 5_000;

type CachedShareIdeasRecord = {
  data: ShareIdeasDatabase;
  version: number;
  updatedAt: Date;
  expiresAt: number;
};

let shareIdeasCache: CachedShareIdeasRecord | null = null;

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

class ShareIdeasServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

class ShareIdeasConflictError extends ShareIdeasServiceError {
  data: ShareIdeasDatabase;
  version: number;
  updatedAt: Date;

  constructor(data: ShareIdeasDatabase, version: number, updatedAt: Date) {
    super('Data conflict. Server has a newer version.', 409);
    this.data = data;
    this.version = version;
    this.updatedAt = updatedAt;
  }
}

function getPrismaErrorCode(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
}

function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  const code = getPrismaErrorCode(error);
  if (code === 'P1001') {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes("can't reach database server") || message.includes('connection refused');
}

function isSchemaMissingError(error: unknown) {
  const code = getPrismaErrorCode(error);
  return code === 'P2021' || code === 'P2022';
}

function buildDatabaseUnavailableMessage() {
  const host = activeDatabaseHost ?? 'unknown-host';
  const railwayInternal = host.endsWith('.railway.internal');

  if (railwayInternal && process.env.NODE_ENV === 'production') {
    return `Database tidak bisa diakses (${host}). Host *.railway.internal bersifat private dan tidak bisa diakses dari Vercel.`;
  }

  return `Database belum bisa diakses (${host}). Pastikan service PostgreSQL aktif dan DATABASE_URL benar.`;
}

async function withDatabaseRecovery<T>(operation: () => Promise<T>) {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL && !process.env.DATABASE_URL_PUBLIC && !process.env.POSTGRES_PRISMA_URL && !process.env.POSTGRES_URL_NON_POOLING && !process.env.POSTGRES_URL) {
    throw new ShareIdeasServiceError('DATABASE_URL belum diset.', 500);
  }

  try {
    return await operation();
  } catch (error) {
    if (isSchemaMissingError(error)) {
      throw new ShareIdeasServiceError('Schema database belum siap. Jalankan migrasi Prisma.', 503);
    }

    if (isDatabaseUnavailableError(error)) {
      throw new ShareIdeasServiceError(buildDatabaseUnavailableMessage(), 503);
    }

    throw error;
  }
}

async function findSystemRecord() {
  return withDatabaseRecovery(() =>
    prisma.map.findFirst({
      where: { title: SYSTEM_SHARE_IDEAS_TITLE },
      orderBy: { id: 'asc' },
      select: { id: true, snapshot: true, version: true, updatedAt: true },
    })
  );
}

function getValidCache() {
  if (!shareIdeasCache) return null;
  if (Date.now() > shareIdeasCache.expiresAt) {
    shareIdeasCache = null;
    return null;
  }
  return shareIdeasCache;
}

function setCache(data: ShareIdeasDatabase, version: number, updatedAt: Date) {
  shareIdeasCache = {
    data,
    version,
    updatedAt,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

function clearCache() {
  shareIdeasCache = null;
}

function toShareIdeasPayload(data: ShareIdeasDatabase, version: number, updatedAt: Date) {
  return {
    data,
    version,
    updatedAt,
  };
}

export async function loadShareIdeas() {
  const cached = getValidCache();
  if (cached) {
    return toShareIdeasPayload(cached.data, cached.version, cached.updatedAt);
  }

  const existing = await findSystemRecord();

  if (!existing) {
    const created = await withDatabaseRecovery(() =>
      prisma.map.create({
        data: {
          title: SYSTEM_SHARE_IDEAS_TITLE,
          snapshot: toInputJson(DEFAULT_SHARE_IDEAS_DATA),
          version: 1,
        },
        select: {
          snapshot: true,
          version: true,
          updatedAt: true,
        },
      })
    );

    const sanitized = sanitizeShareIdeasDatabase(created.snapshot);
    setCache(sanitized, created.version, created.updatedAt);
    return toShareIdeasPayload(sanitized, created.version, created.updatedAt);
  }

  const sanitized = sanitizeShareIdeasDatabase(existing.snapshot);
  setCache(sanitized, existing.version, existing.updatedAt);
  return toShareIdeasPayload(sanitized, existing.version, existing.updatedAt);
}

export async function saveShareIdeas(rawData: unknown, expectedVersion?: number | null) {
  clearCache();
  const sanitized = sanitizeShareIdeasDatabase(rawData);
  const existing = await findSystemRecord();

  if (!existing) {
    const created = await withDatabaseRecovery(() =>
      prisma.map.create({
        data: {
          title: SYSTEM_SHARE_IDEAS_TITLE,
          snapshot: toInputJson(sanitized),
          version: 1,
        },
        select: {
          version: true,
          updatedAt: true,
        },
      })
    );

    setCache(sanitized, created.version, created.updatedAt);
    return toShareIdeasPayload(sanitized, created.version, created.updatedAt);
  }

  if (typeof expectedVersion === 'number' && Number.isFinite(expectedVersion)) {
    const updatedAt = new Date();
    const updateResult = await withDatabaseRecovery(() =>
      prisma.map.updateMany({
        where: {
          id: existing.id,
          version: expectedVersion,
        },
        data: {
          snapshot: toInputJson(sanitized),
          version: { increment: 1 },
          updatedAt,
        },
      })
    );

    if (updateResult.count === 0) {
      const latest = await findSystemRecord();
      if (latest) {
        const latestData = sanitizeShareIdeasDatabase(latest.snapshot);
        setCache(latestData, latest.version, latest.updatedAt);
        throw new ShareIdeasConflictError(latestData, latest.version, latest.updatedAt);
      }
      throw new ShareIdeasServiceError('Record share ideas tidak ditemukan saat menyimpan.', 409);
    }

    setCache(sanitized, expectedVersion + 1, updatedAt);
    return toShareIdeasPayload(sanitized, expectedVersion + 1, updatedAt);
  }

  const updated = await withDatabaseRecovery(() =>
    prisma.map.update({
      where: { id: existing.id },
      data: {
        snapshot: toInputJson(sanitized),
        version: { increment: 1 },
        updatedAt: new Date(),
      },
      select: {
        version: true,
        updatedAt: true,
      },
    })
  );

  setCache(sanitized, updated.version, updated.updatedAt);
  return toShareIdeasPayload(sanitized, updated.version, updated.updatedAt);
}

export { ShareIdeasConflictError, ShareIdeasServiceError };
