import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/api/categories';
import type { Category, CategoryType } from '@/api/types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 5 * 60 * 1000,
  });
}

/** Convenience selector splitting categories by type for the two accordions. */
export function splitCategories(categories: Category[] | undefined): Record<CategoryType, Category[]> {
  const result: Record<CategoryType, Category[]> = { language: [], technology: [] };
  for (const category of categories ?? []) {
    result[category.type].push(category);
  }
  return result;
}
