import { apiClient, NetworkError } from './client';
import { env } from '@/config/env';
import { mockCategories } from './mocks';
import type { Category } from './types';

/**
 * GET /api/categories — public, no auth required.
 * Returns all categories (both `language` and `technology` types).
 */
export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  try {
    const data = await apiClient.get<Category[]>('/categories', { anonymous: true, signal });
    return data ?? [];
  } catch (err) {
    if (env.useMocks && err instanceof NetworkError) {
      return mockCategories;
    }
    throw err;
  }
}
