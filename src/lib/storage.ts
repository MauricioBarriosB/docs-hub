/**
 * Tiny versioned-key localStorage helper.
 *
 * Keys are namespaced + versioned (`docs-hub:v1:<key>`) so we can bump the
 * version to invalidate stale persisted shapes without clobbering unrelated keys.
 */

const NAMESPACE = 'docs-hub';
const VERSION = 'v1';

function buildKey(key: string): string {
  return `${NAMESPACE}:${VERSION}:${key}`;
}

export function readPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(buildKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writePersisted<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(buildKey(key), JSON.stringify(value));
  } catch {
    /* quota / private-mode — non-fatal, persistence is best-effort */
  }
}

export function removePersisted(key: string): void {
  try {
    window.localStorage.removeItem(buildKey(key));
  } catch {
    /* non-fatal */
  }
}

/** Storage keys used across the app, kept in one place to avoid typos. */
export const STORAGE_KEYS = {
  theme: 'theme',
  sidebarSelection: 'sidebar-selection',
  authSession: 'auth-session',
} as const;
