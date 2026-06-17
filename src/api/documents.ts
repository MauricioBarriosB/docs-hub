import { apiClient, NetworkError } from './client';
import { env } from '@/config/env';
import { mockDocumentsPage } from './mocks';
import type { DocumentItem, DocumentListItem, DocumentRating, Paginated } from './types';

export interface DocumentQuery {
  page: number;
  perPage: number;
  /** Free-text search across title/description. */
  search?: string;
  /** Filter by a selected category id (language or technology). */
  categoryId?: number;
}

/**
 * GET /api/documents — public listing of PUBLISHED documents (no auth).
 * Supports search + category filter + pagination.
 */
export async function fetchDocuments(
  query: DocumentQuery,
  signal?: AbortSignal,
): Promise<Paginated<DocumentListItem>> {
  try {
    const data = await apiClient.get<Paginated<DocumentListItem>>('/documents', {
      anonymous: true,
      signal,
      query: {
        page: query.page,
        perPage: query.perPage,
        search: query.search?.trim() || undefined,
        categoryId: query.categoryId,
      },
    });
    return data ?? { items: [], total: 0, page: query.page, perPage: query.perPage };
  } catch (err) {
    if (env.useMocks && err instanceof NetworkError) {
      return mockDocumentsPage(query.page, query.perPage);
    }
    throw err;
  }
}

/**
 * GET /api/documents/:id — public detail of a single PUBLISHED document (no auth).
 */
export function fetchDocument(id: number, signal?: AbortSignal): Promise<DocumentItem> {
  return apiClient.get<DocumentItem>(`/documents/${id}`, { anonymous: true, signal });
}

/**
 * GET /api/documents/:id/rating — aggregate rating + the current user's own
 * rating. Requires auth (the bearer token identifies the user).
 */
export function fetchMyRating(id: number, signal?: AbortSignal): Promise<DocumentRating> {
  return apiClient.get<DocumentRating>(`/documents/${id}/rating`, { signal });
}

/**
 * POST /api/documents/:id/rating — upsert the current user's 1–5 star rating.
 * Returns the updated aggregate plus the saved userRating.
 */
export function rateDocument(id: number, rating: number): Promise<DocumentRating> {
  return apiClient.post<DocumentRating>(`/documents/${id}/rating`, { rating });
}

export interface MyUploadsQuery {
  page: number;
  perPage: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * GET /api/documents/mine — the authenticated user's own uploads, including
 * pending/published/rejected statuses (and reject reason when present).
 */
export function fetchMyUploads(
  query: MyUploadsQuery,
  signal?: AbortSignal,
): Promise<Paginated<DocumentItem>> {
  return apiClient.get<Paginated<DocumentItem>>('/documents/mine', {
    signal,
    query: {
      page: query.page,
      perPage: query.perPage,
      search: query.search?.trim() || undefined,
      sort: query.sort || undefined,
      order: query.order || undefined,
    },
  });
}

export interface UploadDocumentInput {
  title: string;
  description: string;
  categoryIds: number[];
  file: File;
  /** Optional bibliographic metadata (raw form strings; empty = omitted). */
  publisherName?: string;
  writersNames?: string;
  yearIssue?: string;
  pagesCount?: string;
}

/**
 * POST /api/documents — authenticated upload (multipart/form-data).
 * Server creates the document as `pending`; it is not public until approved.
 */
export async function uploadDocument(input: UploadDocumentInput): Promise<DocumentItem> {
  const form = new FormData();
  form.append('title', input.title);
  form.append('description', input.description);
  for (const id of input.categoryIds) {
    form.append('categoryIds[]', String(id));
  }
  // Optional metadata — only sent when filled in.
  if (input.publisherName?.trim()) form.append('publisher_name', input.publisherName.trim());
  if (input.writersNames?.trim()) form.append('writers_names', input.writersNames.trim());
  if (input.yearIssue?.trim()) form.append('year_issue', input.yearIssue.trim());
  if (input.pagesCount?.trim()) form.append('pages_count', input.pagesCount.trim());
  form.append('file', input.file);
  const data = await apiClient.upload<DocumentItem>('/documents', form);
  return data;
}
