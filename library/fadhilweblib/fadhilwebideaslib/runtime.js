const WORKSPACE_PATH_REGEX = /^\/shareideas\/page\/([1-9][0-9]*)\/?$/;

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
  const response = await fetch('/api/shareideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create' }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.error || 'Gagal membuat workspace baru.');
  }
  return String(payload.id);
}

export function goToWorkspace(workspaceId) {
  window.location.href = `/shareideas/page/${encodeURIComponent(String(workspaceId))}`;
}

export function redirectToLanding() {
  window.location.replace('/shareideas');
}
