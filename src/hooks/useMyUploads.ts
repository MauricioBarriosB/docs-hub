import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchMyUploads } from '@/api/documents';
import type { DocumentItem, Paginated } from '@/api/types';
import type { DataTableSort } from '@/components/admin/DataTable';

/** Uploads shown per page on the "My uploads" view. */
export const MY_UPLOADS_PAGE_SIZE = 12;

export interface UseMyUploadsParams {
  page: number;
  search?: string;
  sort?: DataTableSort | null;
}

/** The authenticated user's own uploads (any status). */
export function useMyUploads({ page, search, sort }: UseMyUploadsParams) {
  return useQuery<Paginated<DocumentItem>>({
    queryKey: ['my-uploads', { page, search: search ?? '', sort: sort ?? null }],
    queryFn: ({ signal }) =>
      fetchMyUploads(
        {
          page,
          perPage: MY_UPLOADS_PAGE_SIZE,
          search,
          sort: sort?.field,
          order: sort?.direction,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
