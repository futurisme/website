const API_PATH_PREFIX = '/api/';

function withForwardedHeaders(headers, request, apiOrigin) {
  const nextHeaders = new Headers(headers);
  nextHeaders.set('x-forwarded-host', request.headers.get('host') || '');
  nextHeaders.set('x-forwarded-proto', 'https');
  nextHeaders.set('x-forwarded-for', request.headers.get('cf-connecting-ip') || '');
  nextHeaders.set('x-forwarded-server', new URL(apiOrigin).host);
  return nextHeaders;
}

function createApiUnavailableResponse() {
  return Response.json(
    {
      ok: false,
      error:
        'API_ORIGIN belum diatur. Untuk dukungan dinamis, arahkan /api/* ke origin Vercel (atau origin API lain).',
    },
    {
      status: 503,
      headers: {
        'cache-control': 'no-store',
      },
    },
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiOrigin = env.API_ORIGIN?.trim();

    if (url.pathname.startsWith(API_PATH_PREFIX)) {
      if (!apiOrigin) {
        return createApiUnavailableResponse();
      }

      const upstreamUrl = new URL(url.pathname + url.search, apiOrigin);
      const headers = withForwardedHeaders(request.headers, request, apiOrigin);

      return fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
      });
    }

    return env.ASSETS.fetch(request);
  },
};
