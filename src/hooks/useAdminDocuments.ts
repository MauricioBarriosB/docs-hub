import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveDocument,
  deleteDocument,
  fetchAdminDocuments,
  rejectDocument,
  updateDocument,
  type AdminDocumentQuery,
} from '@/api/admin';
import type {
  DocumentItem,
  DocumentStatus,
  Paginated,
  UpdateDocumentRequest,
} from '@/api/types';

/** Documents shown per admin page. */
export const ADMIN_DOC_PAGE_SIZE = 12;

export const adminDocumentKeys = {
  all: ['admin', 'documents'] as const,
  list: (status: DocumentStatus | null, page: number, search: string) =>
    [...adminDocumentKeys.all, { status, page, search }] as const,
};

export interface UseAdminDocumentsParams {
  status: DocumentStatus | null;
  page: number;
  search?: string;
}

/** Paginated admin document listing, filterable by status + search. */
export function useAdminDocuments({ status, page, search }: UseAdminDocumentsParams) {
  return useQuery<Paginated<DocumentItem>>({
    queryKey: adminDocumentKeys.list(status, page, search ?? ''),
    queryFn: ({ signal }) => {
      const query: AdminDocumentQuery = {
        page,
        perPage: ADMIN_DOC_PAGE_SIZE,
        status,
        search,
      };
      return fetchAdminDocuments(query, signal);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/** Approve → publish. Invalidates every admin document list on success. */
export function useApproveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDocumentKeys.all });
      // Public listing may now include the newly published doc.
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/** Reject with a required reason. */
export function useRejectDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectDocument(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDocumentKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/** Edit a document's title/description/categories. */
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      file,
    }: {
      id: number;
      payload: UpdateDocumentRequest;
      file?: File | null;
    }) => updateDocument(id, payload, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDocumentKeys.all });
      // Title/description/categories may now differ in the public listing too.
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

/** Soft delete + remove the stored file. */
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDocumentKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
