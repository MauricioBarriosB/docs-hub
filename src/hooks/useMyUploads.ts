import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchMyUploads } from '@/api/documents';
import type { DocumentItem, Paginated } from '@/api/types';

/** Uploads shown per page on the "My uploads" view. */
export const MY_UPLOADS_PAGE_SIZE = 12;

export interface UseMyUploadsParams {
  page: number;
  search?: string;
}

/** The authenticated user's own uploads (any status). */
export function useMyUploads({ page, search }: UseMyUploadsParams) {
  return useQuery<Paginated<DocumentItem>>({
    queryKey: ['my-uploads', { page, search: search ?? '' }],
    queryFn: ({ signal }) =>
      fetchMyUploads({ page, perPage: MY_UPLOADS_PAGE_SIZE, search }, signal),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
