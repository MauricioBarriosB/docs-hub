import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchAdminDownloads } from '@/api/admin';
import type { DownloadLogItem, Paginated } from '@/api/types';
import type { DataTableSort } from '@/components/admin/DataTable';

/** Download-log rows per admin page. */
export const ADMIN_DOWNLOADS_PAGE_SIZE = 20;

export interface UseAdminDownloadsParams {
  page: number;
  userId?: number | null;
  documentId?: number | null;
  sort?: DataTableSort | null;
}

/** Paginated per-user download log, optionally filtered by user/document, sortable. */
export function useAdminDownloads({ page, userId, documentId, sort }: UseAdminDownloadsParams) {
  return useQuery<Paginated<DownloadLogItem>>({
    queryKey: [
      'admin',
      'downloads',
      { page, userId: userId ?? null, documentId: documentId ?? null, sort: sort ?? null },
    ],
    queryFn: ({ signal }) =>
      fetchAdminDownloads(
        {
          page,
          perPage: ADMIN_DOWNLOADS_PAGE_SIZE,
          userId,
          documentId,
          sort: sort?.field,
          order: sort?.direction,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
