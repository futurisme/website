import { NextResponse } from 'next/server';
import {
  ShareIdeasConflictError,
  ShareIdeasServiceError,
  loadShareIdeas,
  saveShareIdeas,
} from '@/features/shareideas/server/shareideas-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE = 'no-store';

function createErrorResponse(error: string, status: number, details?: string) {
  return NextResponse.json(
    process.env.NODE_ENV === 'production' || !details ? { error } : { error, message: details },
    {
      status,
      headers: { 'Cache-Control': NO_STORE },
    }
  );
}

export async function GET() {
  try {
    const payload = await loadShareIdeas();
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    if (error instanceof ShareIdeasServiceError) {
      return createErrorResponse(error.message, error.status);
    }

    const msg = error instanceof Error ? error.message : String(error);
    return createErrorResponse('Failed to load share ideas', 500, msg);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { data?: unknown; expectedVersion?: unknown };
    const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : null;
    const payload = await saveShareIdeas(body.data, expectedVersion);

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    if (error instanceof ShareIdeasConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          conflict: true,
          data: error.data,
          version: error.version,
          updatedAt: error.updatedAt,
        },
        {
          status: 409,
          headers: { 'Cache-Control': NO_STORE },
        }
      );
    }

    if (error instanceof ShareIdeasServiceError) {
      return createErrorResponse(error.message, error.status);
    }

    const msg = error instanceof Error ? error.message : String(error);
    return createErrorResponse('Failed to save share ideas', 500, msg);
  }
}
