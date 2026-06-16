/**
 * Centralised, typed access to build-time environment variables.
 * Keeps `import.meta.env` lookups out of the rest of the codebase.
 */

function readBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!raw) {
    // Fall back to a sensible default so `npm run dev` renders even without a .env.
    return 'http://localhost:8080';
  }
  // Strip any trailing slash so we can safely join paths.
  return raw.replace(/\/+$/, '');
}

/**
 * HMAC request-signing client id.
 * NOTE: shipped in the bundle; this is a shared client identifier, not a secret.
 */
const API_CLIENT_ID = import.meta.env.VITE_API_CLIENT_ID?.trim() || 'docshub-web';

/**
 * HMAC request-signing shared secret.
 * NOTE: this ships in the JS bundle and is therefore NOT truly secret — it raises
 * the bar against casual/replay abuse, not a determined attacker. Must match the
 * backend value byte-for-byte.
 */
const API_CLIENT_SECRET =
  import.meta.env.VITE_API_CLIENT_SECRET?.trim() ||
  '9f2c1e7a4b86d530c8e1f04a7b2d6e93f5a8c0b1d4e7f2a9c6b3d80e5f1a2c4d';

export const env = {
  /** Backend origin, e.g. `http://localhost:8080`. No trailing slash. */
  apiBaseUrl: readBaseUrl(),
  /** Dev-only: serve local mock data when the API is unreachable. */
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  isDev: import.meta.env.DEV,
  /** Client identifier sent as `X-Client-Id` for HMAC request signing. */
  apiClientId: API_CLIENT_ID,
  /** Shared HMAC key (see note above; not truly secret). */
  apiClientSecret: API_CLIENT_SECRET,
} as const;
