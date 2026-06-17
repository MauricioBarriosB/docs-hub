import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyRating, rateDocument } from '@/api/documents';
import type { DocumentRating } from '@/api/types';

/**
 * The current user's rating (+ aggregate) for a document. Auth-only, so it is
 * disabled unless `enabled` (the caller passes the auth state). Keyed separately
 * from the public document query.
 */
export function useMyDocumentRating(id: number | undefined, enabled: boolean) {
  return useQuery<DocumentRating>({
    queryKey: ['document-rating', id],
    enabled: enabled && typeof id === 'number' && Number.isFinite(id),
    queryFn: ({ signal }) => fetchMyRating(id as number, signal),
    staleTime: 30 * 1000,
  });
}

/**
 * Submit/update the current user's rating. On success refreshes the rating
 * query, the document detail (its average), and the home listing.
 */
export function useRateDocument(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rating: number) => rateDocument(id, rating),
    onSuccess: (data) => {
      queryClient.setQueryData(['document-rating', id], data);
      void queryClient.invalidateQueries({ queryKey: ['document', id] });
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
