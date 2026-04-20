import { execSync } from 'node:child_process';

const candidates = [
  process.env.DATABASE_PUBLIC_URL,
  process.env.DATABASE_URL_PUBLIC,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.POSTGRES_URL,
  process.env.DATABASE_URL,
].filter(Boolean);

const selected = candidates.find((value) => !value.includes('railway.internal')) ?? candidates[0];

if (!selected) {
  console.log('Skipping prisma migrate deploy because no database env var is set');
  process.exit(0);
}

process.env.DATABASE_URL = selected;

try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
} catch (error) {
  console.warn('Prisma migrate deploy failed during build, continuing without blocking deployment.');
  const message = error instanceof Error ? error.message : String(error);
  console.warn(message);
}
