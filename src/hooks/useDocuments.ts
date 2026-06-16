import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchDocuments } from '@/api/documents';
import type { DocumentListItem, Paginated } from '@/api/types';

/** Cards shown per page / initial load (3 columns x 4 rows = 12). */
export const PAGE_SIZE = 12;

export interface UseDocumentsParams {
  search?: string;
  categoryId?: number;
}

/**
 * Infinite-scroll documents query. Each page is `PAGE_SIZE` cards; the next page
 * is computed from `total` so the IntersectionObserver sentinel knows when to stop.
 */
export function useDocuments({ search, categoryId }: UseDocumentsParams) {
  return useInfiniteQuery<Paginated<DocumentListItem>>({
    queryKey: ['documents', { search: search ?? '', categoryId: categoryId ?? null }],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchDocuments(
        { page: pageParam as number, perPage: PAGE_SIZE, search, categoryId },
        signal,
      ),
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.perPage;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    staleTime: 60 * 1000,
  });
}
