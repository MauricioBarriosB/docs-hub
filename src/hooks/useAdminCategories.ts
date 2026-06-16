import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  updateCategory,
} from '@/api/admin';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/api/types';

export const adminCategoryKeys = {
  all: ['admin', 'categories'] as const,
};

/** Full category list for the admin table. */
export function useAdminCategories() {
  return useQuery<Category[]>({
    queryKey: adminCategoryKeys.all,
    queryFn: ({ signal }) => fetchAdminCategories(signal),
    staleTime: 60 * 1000,
  });
}

function invalidateCategories(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
  // Public sidebar categories share the same source.
  void queryClient.invalidateQueries({ queryKey: ['categories'] });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => createCategory(payload),
    onSuccess: () => invalidateCategories(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoryRequest }) =>
      updateCategory(id, payload),
    onSuccess: () => invalidateCategories(queryClient),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => invalidateCategories(queryClient),
  });
}
