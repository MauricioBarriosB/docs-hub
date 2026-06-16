import { useQuery } from '@tanstack/react-query';
import { fetchDocument } from '@/api/documents';
import type { DocumentItem } from '@/api/types';

/**
 * Single published-document detail query, keyed by id. Disabled when `id` is
 * not a valid number (e.g. a malformed route param).
 */
export function useDocument(id: number | undefined) {
  return useQuery<DocumentItem>({
    queryKey: ['document', id],
    enabled: typeof id === 'number' && Number.isFinite(id),
    queryFn: ({ signal }) => fetchDocument(id as number, signal),
    staleTime: 60 * 1000,
  });
}
