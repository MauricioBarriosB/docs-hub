/**
 * Admin API surface — moderation, document/category/user management.
 *
 * All endpoints sit behind `jwtAuth + adminAuth`, so requests are sent
 * authenticated (the client attaches the Bearer token and handles refresh).
 * Paths mirror backend/app/Config/Routes.php exactly.
 */

import { apiClient } from './client';
import type {
  Category,
  CreateCategoryRequest,
  CreateUserRequest,
  DocumentItem,
  DocumentStatus,
  DownloadLogItem,
  Paginated,
  UpdateCategoryRequest,
  UpdateDocumentRequest,
  UpdateUserRequest,
  User,
  UserListPayload,
} from './types';

/* ------------------------------------------------------------------ */
/* Documents — moderation + management                                 */
/* ------------------------------------------------------------------ */

export interface AdminDocumentQuery {
  page: number;
  perPage: number;
  /** Omit / null for all statuses; the backend defaults the queue to pending. */
  status?: DocumentStatus | null;
  search?: string;
  /** Sort column token: title|author|status|download_count|created_at. */
  sort?: string;
  order?: 'asc' | 'desc';
}

/** GET /api/admin/documents?status=&page=&perPage=&search=&sort=&order= */
export function fetchAdminDocuments(
  query: AdminDocumentQuery,
  signal?: AbortSignal,
): Promise<Paginated<DocumentItem>> {
  return apiClient.get<Paginated<DocumentItem>>('/admin/documents', {
    signal,
    query: {
      page: query.page,
      perPage: query.perPage,
      status: query.status ?? undefined,
      search: query.search?.trim() || undefined,
      sort: query.sort || undefined,
      order: query.order || undefined,
    },
  });
}

/** PUT /api/admin/documents/:id/approve */
export function approveDocument(id: number): Promise<DocumentItem> {
  return apiClient.put<DocumentItem>(`/admin/documents/${id}/approve`);
}

/** PUT /api/admin/documents/:id/reject — body: { reason } (required, non-empty). */
export function rejectDocument(id: number, reason: string): Promise<DocumentItem> {
  return apiClient.put<DocumentItem>(`/admin/documents/${id}/reject`, { reason });
}

/**
 * POST /api/admin/documents/:id — edit title/description/categories and,
 * optionally, replace the stored file. Sent as multipart/form-data (POST, not
 * PUT) because PHP only parses multipart bodies on POST. When `file` is omitted
 * the existing file is kept.
 */
export function updateDocument(
  id: number,
  payload: UpdateDocumentRequest,
  file?: File | null,
): Promise<DocumentItem> {
  const form = new FormData();
  if (payload.title !== undefined) form.append('title', payload.title);
  // Always send these so an emptied field clears it server-side.
  if (payload.description !== undefined) form.append('description', payload.description ?? '');
  if (payload.publisherName !== undefined) form.append('publisher_name', payload.publisherName ?? '');
  if (payload.writersNames !== undefined) form.append('writers_names', payload.writersNames ?? '');
  if (payload.yearIssue !== undefined) form.append('year_issue', payload.yearIssue == null ? '' : String(payload.yearIssue));
  if (payload.pagesCount !== undefined) form.append('pages_count', payload.pagesCount == null ? '' : String(payload.pagesCount));
  for (const id of payload.categoryIds ?? []) {
    form.append('categoryIds[]', String(id));
  }
  if (file) form.append('file', file);
  return apiClient.upload<DocumentItem>(`/admin/documents/${id}`, form);
}

/** DELETE /api/admin/documents/:id — soft delete + remove stored file. */
export function deleteDocument(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/documents/${id}`);
}

export interface AdminDownloadQuery {
  page: number;
  perPage: number;
  /** Filter to a single user's downloads. */
  userId?: number | null;
  /** Filter to a single document's downloads. */
  documentId?: number | null;
  /** Sort column token: downloaded_at|user|document. */
  sort?: string;
  order?: 'asc' | 'desc';
}

/** GET /api/admin/downloads?userId=&documentId=&page=&perPage=&sort=&order= — per-user download log. */
export function fetchAdminDownloads(
  query: AdminDownloadQuery,
  signal?: AbortSignal,
): Promise<Paginated<DownloadLogItem>> {
  return apiClient.get<Paginated<DownloadLogItem>>('/admin/downloads', {
    signal,
    query: {
      page: query.page,
      perPage: query.perPage,
      userId: query.userId ?? undefined,
      documentId: query.documentId ?? undefined,
      sort: query.sort || undefined,
      order: query.order || undefined,
    },
  });
}

/* ------------------------------------------------------------------ */
/* Categories — CRUD                                                   */
/* ------------------------------------------------------------------ */

/** GET /api/admin/categories — full list (same shape as the public endpoint). */
export function fetchAdminCategories(signal?: AbortSignal): Promise<Category[]> {
  return apiClient.get<Category[]>('/admin/categories', { signal });
}

/** POST /api/admin/categories — 409 on duplicate slug. */
export function createCategory(payload: CreateCategoryRequest): Promise<Category> {
  return apiClient.post<Category>('/admin/categories', payload);
}

/** PUT /api/admin/categories/:id — 409 on duplicate slug. */
export function updateCategory(id: number, payload: UpdateCategoryRequest): Promise<Category> {
  return apiClient.put<Category>(`/admin/categories/${id}`, payload);
}

/** DELETE /api/admin/categories/:id — cascades document_categories. */
export function deleteCategory(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/categories/${id}`);
}

/* ------------------------------------------------------------------ */
/* Users — management                                                  */
/* ------------------------------------------------------------------ */

export interface AdminUserQuery {
  limit: number;
  offset: number;
  search?: string;
  /** Sort column token: name|email|role|is_active|last_login|created_at. */
  sort?: string;
  order?: 'asc' | 'desc';
}

/** GET /api/admin/users?limit=&offset=&search=&sort=&order= */
export function fetchAdminUsers(
  query: AdminUserQuery,
  signal?: AbortSignal,
): Promise<UserListPayload> {
  return apiClient.get<UserListPayload>('/admin/users', {
    signal,
    query: {
      limit: query.limit,
      offset: query.offset,
      search: query.search?.trim() || undefined,
      sort: query.sort || undefined,
      order: query.order || undefined,
    },
  });
}

/** POST /api/admin/users — 409 USER_EXISTS on duplicate email. */
export function createUser(payload: CreateUserRequest): Promise<User> {
  return apiClient.post<User>('/admin/users', payload);
}

/** PUT /api/admin/users/:id — 409 USER_EXISTS on duplicate email. */
export function updateUser(id: number, payload: UpdateUserRequest): Promise<User> {
  return apiClient.put<User>(`/admin/users/${id}`, payload);
}

/** PUT /api/admin/users/:id/toggle-active — returns the updated user. */
export function toggleUserActive(id: number): Promise<User> {
  return apiClient.put<User>(`/admin/users/${id}/toggle-active`);
}

/** DELETE /api/admin/users/:id — soft delete. */
export function deleteUser(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/users/${id}`);
}
