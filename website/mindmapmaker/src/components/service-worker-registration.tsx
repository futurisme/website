'use client';

import { useEffect } from 'react';

const SW_KILL_SWITCH_ENABLED = process.env.NEXT_PUBLIC_DISABLE_SW === '1';
const MANAGED_CACHE_PREFIX = 'chartworkspace-';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/mindmapmaker';

async function clearManagedCaches() {
  if (!('caches' in window)) {
    return;
  }

  const cacheKeys = await window.caches.keys();
  await Promise.all(
    cacheKeys
      .filter((cacheKey) => cacheKey.startsWith(MANAGED_CACHE_PREFIX))
      .map((cacheKey) => window.caches.delete(cacheKey))
  );
}

async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  await clearManagedCaches();
}

function isSecureContextForSw() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!window.isSecureContext) {
    return false;
  }

  if (window.location.protocol === 'https:') {
    return true;
  }

  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

function buildServiceWorkerPath() {
  const normalizedBasePath = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');
  const workerPath = `${normalizedBasePath}/sw.js`;
  const scopePath = normalizedBasePath ? `${normalizedBasePath}/` : '/';

  return {
    workerPath,
    scopePath,
  };
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    if (SW_KILL_SWITCH_ENABLED) {
      void unregisterServiceWorkers();
      return;
    }

    if (!isSecureContextForSw()) {
      return;
    }

    const { workerPath, scopePath } = buildServiceWorkerPath();

    void navigator.serviceWorker
      .register(workerPath, { scope: scopePath, updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => {
        // Intentionally suppressing logging to avoid noisy client console in production.
      });
  }, []);

  return null;
}
