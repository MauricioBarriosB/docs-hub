/**
 * In-memory + persisted token holder.
 *
 * The HTTP client reads tokens from here (decoupled from React) so the request
 * interceptor and the 401 → refresh flow do not depend on render cycles.
 * AuthContext is the writer; everything else reads.
 */

import type { AuthTokens } from './types';
import { STORAGE_KEYS, readPersisted, removePersisted, writePersisted } from '@/lib/storage';

let tokens: AuthTokens | null = null;
let subscriber: ((tokens: AuthTokens | null) => void) | null = null;

/** Hydrate from localStorage on module load so refreshes keep the session. */
function hydrate(): AuthTokens | null {
  const persisted = readPersisted<AuthTokens | null>(STORAGE_KEYS.authSession, null);
  if (persisted && persisted.accessToken && persisted.refreshToken) {
    tokens = persisted;
  }
  return tokens;
}

hydrate();

export const tokenStore = {
  get(): AuthTokens | null {
    return tokens;
  },
  getAccessToken(): string | null {
    return tokens?.accessToken ?? null;
  },
  getRefreshToken(): string | null {
    return tokens?.refreshToken ?? null;
  },
  set(next: AuthTokens): void {
    tokens = next;
    writePersisted(STORAGE_KEYS.authSession, next);
    subscriber?.(next);
  },
  clear(): void {
    tokens = null;
    removePersisted(STORAGE_KEYS.authSession);
    subscriber?.(null);
  },
  /** Let AuthContext react when the client refreshes/clears tokens. */
  subscribe(fn: (tokens: AuthTokens | null) => void): void {
    subscriber = fn;
  },
};
