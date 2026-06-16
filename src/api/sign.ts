/**
 * HMAC request signing (shared contract with the backend — FROZEN).
 *
 * Every request to the API carries four headers in addition to the JWT bearer:
 *   - X-Client-Id : the shared client identifier (env.apiClientId)
 *   - X-Timestamp : unix seconds as an integer string
 *   - X-Nonce     : 16 random bytes as 32 lowercase hex chars
 *   - X-Signature : lowercase hex of HMAC-SHA256(clientSecret, canonical)
 *
 * Canonical string (UTF-8, '\n' = LF):
 *   clientId + "\n" + METHOD + "\n" + signedPath + "\n" + timestamp + "\n" + nonce
 *
 * - METHOD     = uppercase HTTP method.
 * - signedPath = "/api" + request path, WITHOUT query string.
 *
 * The HMAC key is imported once and reused (importKey is comparatively expensive).
 */

import { env } from '@/config/env';

export interface SignatureHeaders {
  clientId: string;
  timestamp: string;
  nonce: string;
  signature: string;
}

const encoder = new TextEncoder();

/** Lowercase-hex encode a byte buffer. */
function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let hex = '';
  for (const byte of view) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

/** 16 random bytes → 32 lowercase hex chars. */
function generateNonce(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

/** Lazily imported, cached HMAC-SHA256 CryptoKey for env.apiClientSecret. */
let cryptoKeyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  cryptoKeyPromise ??= crypto.subtle.importKey(
    'raw',
    encoder.encode(env.apiClientSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return cryptoKeyPromise;
}

/**
 * Build the signing headers for a single request.
 *
 * @param method     HTTP method (any case; uppercased internally).
 * @param signedPath "/api" + the request path, WITHOUT query string.
 */
export async function signRequest(
  method: string,
  signedPath: string,
): Promise<SignatureHeaders> {
  const clientId = env.apiClientId;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();
  const upperMethod = method.toUpperCase();

  // FROZEN canonical string — must match the backend byte-for-byte.
  const canonical = `${clientId}\n${upperMethod}\n${signedPath}\n${timestamp}\n${nonce}`;

  const key = await getKey();
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(canonical));
  const signature = toHex(signatureBytes);

  return { clientId, timestamp, nonce, signature };
}
