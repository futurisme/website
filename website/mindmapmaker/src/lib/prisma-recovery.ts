import { Prisma } from '@prisma/client';

type ServiceErrorFactory = (message: string, status: number) => Error;

type PrismaRecoveryOptions = {
  createError: ServiceErrorFactory;
  missingEnvMessage: string;
  schemaMissingMessage: string;
  databaseUnavailableMessage?: string;
};

const DATABASE_ENV_KEYS = [
  'DATABASE_URL',
  'DATABASE_PUBLIC_URL',
  'DATABASE_URL_PUBLIC',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL',
] as const;

export function hasConfiguredDatabaseUrl() {
  return DATABASE_ENV_KEYS.some((key) => {
    const value = process.env[key];
    return typeof value === 'string' && value.length > 0;
  });
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

export function buildDatabaseUnavailableMessage(activeDatabaseHost: string | null | undefined) {
  const host = activeDatabaseHost ?? 'unknown-host';
  const railwayInternal = host.endsWith('.railway.internal');

  if (railwayInternal && process.env.NODE_ENV === 'production') {
    return `Database tidak bisa diakses (${host}). Host *.railway.internal bersifat private dan tidak bisa diakses dari Vercel.`;
  }

  return `Database belum bisa diakses (${host}). Pastikan service PostgreSQL aktif dan DATABASE_URL benar.`;
}

export async function withPrismaDatabaseRecovery<T>(
  operation: () => Promise<T>,
  options: PrismaRecoveryOptions
) {
  const {
    createError,
    missingEnvMessage,
    schemaMissingMessage,
    databaseUnavailableMessage,
  } = options;

  if (!hasConfiguredDatabaseUrl()) {
    throw createError(missingEnvMessage, 500);
  }

  try {
    return await operation();
  } catch (error) {
    if (isSchemaMissingError(error)) {
      throw createError(schemaMissingMessage, 503);
    }

    if (isDatabaseUnavailableError(error)) {
      throw createError(databaseUnavailableMessage ?? 'Database tidak bisa diakses.', 503);
    }

    throw error;
  }
}
