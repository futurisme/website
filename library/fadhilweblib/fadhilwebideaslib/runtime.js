const WORKSPACE_PATH_REGEX = /^\/shareideas\/page\/([1-9][0-9]*)\/?$/;
const SHAREIDEAS_API = '/api/shareideas';

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function resolveWorkspaceIdOrRedirect(pathname = window.location.pathname) {
  const matched = WORKSPACE_PATH_REGEX.exec(pathname);
  if (!matched) {
    window.location.replace('/shareideas');
    return null;
  }
  return matched[1];
}

export function buildWorkspaceApiUrl(workspaceId) {
  return `/api/shareideas?id=${encodeURIComponent(String(workspaceId))}`;
}

export async function createWorkspace() {
  const response = await fetch(SHAREIDEAS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create' }),
  });
  const payload = await parseJsonSafe(response);
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.error || 'Gagal membuat workspace baru.');
  }
  return String(payload.id);
}

export async function fetchWorkspaceList() {
  const response = await fetch(SHAREIDEAS_API, { cache: 'no-store' });
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(payload?.error || 'Gagal memuat daftar workspace.');
  }
  return Array.isArray(payload?.pages) ? payload.pages : [];
}

export function goToWorkspace(workspaceId) {
  window.location.href = `/shareideas/page/${encodeURIComponent(String(workspaceId))}`;
}

export function redirectToLanding() {
  window.location.replace('/shareideas');
}
