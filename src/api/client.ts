/**
 * Typed axios wrapper for the docs-hub JSON API.
 *
 * Responsibilities:
 *  - Prefix requests with `VITE_API_BASE_URL` + `/api`.
 *  - Attach `Authorization: Bearer <accessToken>` when a token is present.
 *  - Unwrap the success envelope (`{ success, data }`) and return `data`.
 *  - On `401`, attempt a single refresh-token retry, then replay the request.
 *  - Surface `userMessage` from the error envelope via a typed `ApiError`.
 */

import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';
import { signRequest } from './sign';
import { tokenStore } from './tokenStore';
import type { ApiErrorBody, ApiSuccess, AuthTokens } from './types';

const API_PREFIX = '/api';

/** Strip a query string from a relative request url. */
function stripQuery(url: string): string {
  const q = url.indexOf('?');
  return q === -1 ? url : url.slice(0, q);
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  /** Safe-to-display message from the backend, when available. */
  readonly userMessage: string;

  constructor(status: number, body: Partial<ApiErrorBody> | null, fallback: string) {
    super(body?.message ?? fallback);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code ?? 'UNKNOWN';
    this.userMessage = body?.userMessage ?? fallback;
  }
}

/** Raised when the request never reaches the server (network down, CORS, backend not running). */
export class NetworkError extends Error {
  readonly userMessage = 'No se pudo conectar con el servidor. Inténtalo más tarde.';
  constructor(cause?: unknown) {
    super('Network request failed');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON-serialisable body. Mutually exclusive with `formData`. */
  body?: unknown;
  /** For multipart uploads; sets no Content-Type so the browser adds the boundary. */
  formData?: FormData;
  /** Query string params; `undefined`/`null` values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Skip the Authorization header even if a token exists (public endpoints). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

/** Per-request flags carried through axios config to drive the interceptors. */
interface RequestMeta {
  anonymous?: boolean;
  /** Set once a request has already been retried after a refresh, to avoid loops. */
  retried?: boolean;
}

type RequestConfigWithMeta = AxiosRequestConfig & { meta?: RequestMeta };
type InternalConfigWithMeta = InternalAxiosRequestConfig & { meta?: RequestMeta };

/* ------------------------------------------------------------------ */
/* Axios instance                                                     */
/* ------------------------------------------------------------------ */

const http: AxiosInstance = axios.create({
  baseURL: `${env.apiBaseUrl}${API_PREFIX}`,
  headers: { Accept: 'application/json' },
});

// Request interceptor: attach the bearer token (unless anonymous) AND always sign.
// HMAC signing is independent of the JWT and runs for anonymous/public requests too.
http.interceptors.request.use(async (config: InternalConfigWithMeta) => {
  const headers = AxiosHeaders.from(config.headers);

  if (!config.meta?.anonymous) {
    const accessToken = tokenStore.getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  // signedPath = "/api" + relative url, query string excluded (query lives in params).
  const method = (config.method ?? 'get').toUpperCase();
  const signedPath = `${API_PREFIX}${stripQuery(config.url ?? '')}`;
  const sig = await signRequest(method, signedPath);
  headers.set('X-Client-Id', sig.clientId);
  headers.set('X-Timestamp', sig.timestamp);
  headers.set('X-Nonce', sig.nonce);
  headers.set('X-Signature', sig.signature);

  config.headers = headers;
  return config;
});

/* ------------------------------------------------------------------ */
/* Refresh-token coordination                                         */
/* ------------------------------------------------------------------ */

let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return null;

  // Collapse concurrent 401s into one refresh round-trip.
  refreshInFlight ??= (async () => {
    try {
      // This is a raw axios call (it bypasses the `http` instance + its interceptors),
      // so sign it explicitly with the same canonical contract.
      const sig = await signRequest('POST', `${API_PREFIX}/auth/refresh`);
      const res = await axios.post<ApiSuccess<AuthTokens>>(
        `${env.apiBaseUrl}${API_PREFIX}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Client-Id': sig.clientId,
            'X-Timestamp': sig.timestamp,
            'X-Nonce': sig.nonce,
            'X-Signature': sig.signature,
          },
        },
      );
      const json = res.data;
      if (!json.success || !json.data) {
        tokenStore.clear();
        return null;
      }
      tokenStore.set(json.data);
      return json.data;
    } catch {
      tokenStore.clear();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// Response interceptor: on 401, try a single refresh + replay; map errors to typed classes.
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Partial<ApiErrorBody>>) => {
    const config = error.config as InternalConfigWithMeta | undefined;

    // 401 → try one refresh + replay (skip for anonymous/refresh/already-retried calls).
    if (
      error.response?.status === 401 &&
      config &&
      !config.meta?.anonymous &&
      !config.meta?.retried &&
      tokenStore.getRefreshToken()
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        config.meta = { ...config.meta, retried: true };
        return http.request(config);
      }
    }

    if (error.response) {
      let body = (error.response.data ?? null) as Partial<ApiErrorBody> | null;
      // For blob requests (downloads) the error body is a Blob, not parsed JSON —
      // read & parse it so `userMessage` still surfaces.
      if (body instanceof Blob) {
        try {
          body = JSON.parse(await body.text()) as Partial<ApiErrorBody>;
        } catch {
          body = null;
        }
      }
      throw new ApiError(
        error.response.status,
        body,
        `Request failed with status ${error.response.status}`,
      );
    }

    // No response → the request never completed (network/CORS/aborted).
    throw new NetworkError(error);
  },
);

/* ------------------------------------------------------------------ */
/* Core request                                                       */
/* ------------------------------------------------------------------ */

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const config: RequestConfigWithMeta = {
    url: path,
    method: options.method ?? 'GET',
    params: options.query,
    signal: options.signal,
    meta: { anonymous: options.anonymous },
  };

  if (options.formData) {
    config.data = options.formData; // browser sets the multipart boundary
  } else if (options.body !== undefined) {
    config.data = options.body;
    config.headers = { 'Content-Type': 'application/json' };
  }

  const res = await http.request<ApiSuccess<T>>(config);

  // 204 No Content / empty body.
  if (res.status === 204 || res.data == null) {
    return undefined as T;
  }
  return res.data.data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  /** Multipart upload helper. */
  upload: <T>(path: string, formData: FormData, options?: Omit<RequestOptions, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...options, method: 'POST', formData }),
};

/**
 * Build the download URL for a document.
 *
 * NOTE: downloads now require an HMAC signature (and possibly a bearer token), so a
 * bare `<a href>` to this URL will be rejected by the backend. Use `downloadDocument`
 * for actual downloads; this remains only for display/debugging purposes.
 */
export function buildDownloadUrl(documentId: number): string {
  return `${env.apiBaseUrl}${API_PREFIX}/documents/${documentId}/download`;
}

/**
 * Download a document as a signed, authenticated blob and trigger a browser save.
 *
 * Flows through the `http` instance so the request gets the HMAC signature (and bearer
 * token) headers. `responseType: 'blob'` means the success interceptor returns the raw
 * Blob — it never reaches the `{ success, data }` envelope unwrap in `request()` — so the
 * body is preserved intact. Errors are mapped to ApiError/NetworkError by the response
 * interceptor, exactly like every other call.
 */
export async function downloadDocument(documentId: number, fileName: string): Promise<void> {
  const res = await http.get<Blob>(`/documents/${documentId}/download`, {
    responseType: 'blob',
  });

  const blob = res.data;
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName || `document-${documentId}`;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Revoke on the next tick so the click-initiated download has grabbed the URL.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
}

/**
 * In-memory cache of preview object URLs, keyed by document id. Reusing the URL means
 * reopening a document in the same session does NOT re-hit the server (the user noticed
 * the old approach re-fetched every time). URLs live for the page lifetime — acceptable
 * for the handful a user opens; cleared on full reload.
 */
const previewUrlCache = new Map<number, string>();

/**
 * Open a document in a new browser tab for inline viewing.
 *
 * Hits the dedicated `/preview` endpoint (NOT `/download`): the backend serves it inline,
 * does NOT increment download_count, and does NOT write a download-log row — viewing is
 * not a download. Only inline-safe types are served (pdf, txt, jpg, png); for the rest the
 * backend returns 415 and the caller surfaces its userMessage. Reuses the signed/auth'd
 * `http` flow (a bare URL is rejected without the HMAC signature).
 *
 * The tab is opened synchronously inside the click gesture so popup blockers don't kill
 * it during the async fetch, and `opener` is severed because an uploaded file could be
 * hostile HTML (tabnabbing mitigation). The fetched Blob's object URL is cached so a
 * second view reuses it instead of re-fetching.
 */
export async function viewDocument(documentId: number): Promise<void> {
  const tab = window.open('about:blank', '_blank');
  if (tab) tab.opener = null;

  const openUrl = (url: string) => {
    if (tab) {
      tab.location.href = url;
    } else {
      // Popup blocked — fall back to a temporary anchor in the current document.
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  };

  try {
    const cached = previewUrlCache.get(documentId);
    if (cached) {
      openUrl(cached);
      return;
    }

    const res = await http.get<Blob>(`/documents/${documentId}/preview`, {
      responseType: 'blob',
    });
    const objectUrl = URL.createObjectURL(res.data);
    previewUrlCache.set(documentId, objectUrl);
    openUrl(objectUrl);
  } catch (err) {
    if (tab) tab.close();
    throw err;
  }
}

/** Narrow an unknown caught value to a user-displayable message. */
export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) return err.userMessage;
  if (err instanceof NetworkError) return err.userMessage;
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
