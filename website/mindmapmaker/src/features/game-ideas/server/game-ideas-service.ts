import { Prisma } from '@prisma/client';
import { activeDatabaseHost, prisma } from '@/lib/prisma';
import { DEFAULT_GAME_IDEA_DATA, sanitizeGameIdeaDatabase, type GameIdeaDatabase } from '@/features/game-ideas/shared/schema';
import { buildDatabaseUnavailableMessage, withPrismaDatabaseRecovery } from '@/lib/prisma-recovery';

const SYSTEM_GAME_IDEA_TITLE = '__SYSTEM__GAME_IDEAS_V1';
const CACHE_TTL_MS = 5_000;

type CachedGameIdeasRecord = {
  data: GameIdeaDatabase;
  version: number;
  updatedAt: Date;
  expiresAt: number;
};

let gameIdeasCache: CachedGameIdeasRecord | null = null;

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

class GameIdeasServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

class GameIdeasConflictError extends GameIdeasServiceError {
  data: GameIdeaDatabase;
  version: number;
  updatedAt: Date;

  constructor(data: GameIdeaDatabase, version: number, updatedAt: Date) {
    super('Data conflict. Server has a newer version.', 409);
    this.data = data;
    this.version = version;
    this.updatedAt = updatedAt;
  }
}

async function withDatabaseRecovery<T>(operation: () => Promise<T>) {
  return withPrismaDatabaseRecovery(operation, {
    createError: (message, status) => new GameIdeasServiceError(message, status),
    missingEnvMessage: 'DATABASE_URL belum diset.',
    schemaMissingMessage: 'Schema database belum siap. Jalankan migrasi Prisma.',
    databaseUnavailableMessage: buildDatabaseUnavailableMessage(activeDatabaseHost),
  });
}

async function findSystemRecord() {
  return withDatabaseRecovery(() =>
    prisma.map.findFirst({
      where: { title: SYSTEM_GAME_IDEA_TITLE },
      orderBy: { id: 'asc' },
      select: { id: true, snapshot: true, version: true, updatedAt: true },
    })
  );
}

function getValidCache() {
  if (!gameIdeasCache) return null;
  if (Date.now() > gameIdeasCache.expiresAt) {
    gameIdeasCache = null;
    return null;
  }
  return gameIdeasCache;
}

function setCache(data: GameIdeaDatabase, version: number, updatedAt: Date) {
  gameIdeasCache = {
    data,
    version,
    updatedAt,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

function clearCache() {
  gameIdeasCache = null;
}

function toGameIdeasPayload(data: GameIdeaDatabase, version: number, updatedAt: Date) {
  return {
    data,
    version,
    updatedAt,
  };
}

export async function loadGameIdeas() {
  const cached = getValidCache();
  if (cached) {
    return toGameIdeasPayload(cached.data, cached.version, cached.updatedAt);
  }

  const existing = await findSystemRecord();

  if (!existing) {
    const created = await withDatabaseRecovery(() =>
      prisma.map.create({
        data: {
          title: SYSTEM_GAME_IDEA_TITLE,
          snapshot: toInputJson(DEFAULT_GAME_IDEA_DATA),
          version: 1,
        },
        select: {
          snapshot: true,
          version: true,
          updatedAt: true,
        },
      })
    );

    const sanitized = sanitizeGameIdeaDatabase(created.snapshot);
    setCache(sanitized, created.version, created.updatedAt);
    return toGameIdeasPayload(sanitized, created.version, created.updatedAt);
  }

  const sanitized = sanitizeGameIdeaDatabase(existing.snapshot);
  setCache(sanitized, existing.version, existing.updatedAt);
  return toGameIdeasPayload(sanitized, existing.version, existing.updatedAt);
}

export async function loadGameIdeasMeta() {
  const cached = getValidCache();
  if (cached) {
    return {
      version: cached.version,
      updatedAt: cached.updatedAt,
    };
  }

  const existing = await findSystemRecord();

  if (!existing) {
    const created = await withDatabaseRecovery(() =>
      prisma.map.create({
        data: {
          title: SYSTEM_GAME_IDEA_TITLE,
          snapshot: toInputJson(DEFAULT_GAME_IDEA_DATA),
          version: 1,
        },
        select: {
          version: true,
          updatedAt: true,
        },
      })
    );

    setCache(DEFAULT_GAME_IDEA_DATA, created.version, created.updatedAt);
    return {
      version: created.version,
      updatedAt: created.updatedAt,
    };
  }

  setCache(sanitizeGameIdeaDatabase(existing.snapshot), existing.version, existing.updatedAt);
  return {
    version: existing.version,
    updatedAt: existing.updatedAt,
  };
}

export async function saveGameIdeas(rawData: unknown, expectedVersion?: number | null) {
  clearCache();
  const sanitized: GameIdeaDatabase = sanitizeGameIdeaDatabase(rawData);
  const existing = await findSystemRecord();

  if (!existing) {
    const created = await withDatabaseRecovery(() =>
      prisma.map.create({
        data: {
          title: SYSTEM_GAME_IDEA_TITLE,
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
    return toGameIdeasPayload(sanitized, created.version, created.updatedAt);
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
        const latestData = sanitizeGameIdeaDatabase(latest.snapshot);
        setCache(latestData, latest.version, latest.updatedAt);
        throw new GameIdeasConflictError(
          latestData,
          latest.version,
          latest.updatedAt
        );
      }
      throw new GameIdeasServiceError('Record game ideas tidak ditemukan saat menyimpan.', 409);
    }

    setCache(sanitized, expectedVersion + 1, updatedAt);
    return toGameIdeasPayload(sanitized, expectedVersion + 1, updatedAt);
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
  return toGameIdeasPayload(sanitized, updated.version, updated.updatedAt);
}

export { GameIdeasConflictError, GameIdeasServiceError };
