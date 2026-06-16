import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  deleteUser,
  fetchAdminUsers,
  toggleUserActive,
  updateUser,
} from '@/api/admin';
import type { CreateUserRequest, UpdateUserRequest, UserListPayload } from '@/api/types';

/** Users shown per admin page. */
export const ADMIN_USER_PAGE_SIZE = 20;

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  list: (offset: number, search: string) =>
    [...adminUserKeys.all, { offset, search }] as const,
};

export interface UseAdminUsersParams {
  offset: number;
  search?: string;
}

/** Offset/limit paginated user list. */
export function useAdminUsers({ offset, search }: UseAdminUsersParams) {
  return useQuery<UserListPayload>({
    queryKey: adminUserKeys.list(offset, search ?? ''),
    queryFn: ({ signal }) =>
      fetchAdminUsers({ limit: ADMIN_USER_PAGE_SIZE, offset, search }, signal),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserRequest }) =>
      updateUser(id, payload),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleUserActive(id),
    onSuccess: () => invalidateUsers(queryClient),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => invalidateUsers(queryClient),
  });
}
