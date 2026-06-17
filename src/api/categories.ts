import { apiClient, NetworkError } from './client';
import { env } from '@/config/env';
import { mockCategories } from './mocks';
import type { Category } from './types';

export interface FetchCategoriesOptions {
  /** When true, only categories that have at least one published document. */
  inUse?: boolean;
}

/**
 * GET /api/categories — public, no auth required.
 * Returns all categories (both `language` and `technology` types) by default;
 * pass `{ inUse: true }` to get only categories with published documents.
 */
export async function fetchCategories(
  options: FetchCategoriesOptions = {},
  signal?: AbortSignal,
): Promise<Category[]> {
  try {
    const data = await apiClient.get<Category[]>('/categories', {
      anonymous: true,
      signal,
      query: options.inUse ? { inUse: 1 } : undefined,
    });
    return data ?? [];
  } catch (err) {
    if (env.useMocks && err instanceof NetworkError) {
      return mockCategories;
    }
    throw err;
  }
}
