/**
 * DTO types mirroring the backend (CodeIgniter 4) data model.
 *
 * The backend stores snake_case columns but exposes camelCase JSON to the SPA
 * (per the shared API contract). These types describe the JSON shape the client
 * receives, not the DB columns.
 */

export type UserRole = 'user' | 'admin';

/**
 * User as exposed by the backend `formatUserPublic()` shape.
 *
 * NOTE: the backend does NOT include `updatedAt` here; `avatar` is always null
 * in the current schema. Fields are kept exactly in sync with the API output so
 * components never read a value the server doesn't send.
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string | null;
}

export type CategoryType = 'language' | 'technology';

export interface Category {
  id: number;
  name: string;
  slug: string;
  type: CategoryType;
  icon: string | null;
  createdAt: string;
}

export type DocumentStatus = 'pending' | 'published' | 'rejected';

/**
 * Compact document shape returned by the public listing (`GET /api/documents`).
 * Cards only need these few fields; full file/status metadata is fetched per
 * document via `GET /api/documents/:id` (see `DocumentItem`) on the detail page.
 */
export interface DocumentListItem {
  id: number;
  title: string;
  description: string | null;
  /** Uploader display name, joined server-side. */
  uploadedByName: string;
  publishedAt: string | null;
  /** Average star rating (0 when nobody has rated yet). */
  ratingAverage: number;
  /** Number of ratings. */
  ratingCount: number;
  categories: Category[];
}

/** Aggregate rating + the current user's own rating for a document. */
export interface DocumentRating {
  average: number;
  count: number;
  /** The signed-in user's rating (1–5), or null if they haven't rated. */
  userRating: number | null;
}

export interface DocumentItem {
  id: number;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileExt: string;
  fileSize: number;
  authorId: number;
  /** Author display name, joined server-side for listing convenience. */
  authorName: string;
  status: DocumentStatus;
  rejectReason: string | null;
  downloadCount: number;
  /** Publisher / imprint name. */
  publisherName: string | null;
  /** Author(s) of the work (free text). */
  writersNames: string | null;
  /** Year of publication. */
  yearIssue: number | null;
  /** Page count. */
  pagesCount: number | null;
  /** Average star rating (0 when nobody has rated yet). */
  ratingAverage: number;
  /** Number of ratings. */
  ratingCount: number;
  categories: Category[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** One row of the admin per-user download log. */
export interface DownloadLogItem {
  id: number;
  documentId: number;
  documentTitle: string | null;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  ip: string | null;
  downloadedAt: string;
}

/** Generic paginated payload shape returned inside the success envelope's `data`. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

/* ------------------------------------------------------------------ */
/* Response envelopes (shared contract)                               */
/* ------------------------------------------------------------------ */

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data?: T;
}

export interface ApiErrorBody {
  error: true;
  code: string;
  message: string;
  /** Safe to display to end users. */
  userMessage: string;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/* Auth payloads                                                      */
/* ------------------------------------------------------------------ */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/* ------------------------------------------------------------------ */
/* Admin payloads (mirror AdminController / CategoryController)         */
/* ------------------------------------------------------------------ */

/** Offset/limit paginated user list returned by GET /api/admin/users. */
export interface UserListPayload {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

/** Partial update; only provided fields are changed server-side. */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

/** Admin edit of a document. Only provided fields change; status is set via approve/reject. */
export interface UpdateDocumentRequest {
  title?: string;
  description?: string | null;
  categoryIds?: number[];
  publisherName?: string | null;
  writersNames?: string | null;
  yearIssue?: number | null;
  pagesCount?: number | null;
}

export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  /** Optional; the backend derives a slug from `name` when omitted. */
  slug?: string;
  icon?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: CategoryType;
  slug?: string;
  icon?: string | null;
}
