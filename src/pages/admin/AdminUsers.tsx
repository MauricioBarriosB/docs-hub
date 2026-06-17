import { useState } from 'react';
import { Button, Chip, Switch, Tooltip } from '@heroui/react';
import { toUserMessage } from '@/api/client';
import type { CreateUserRequest, UpdateUserRequest, User } from '@/api/types';
import {
  ADMIN_USER_PAGE_SIZE,
  useAdminUsers,
  useCreateUser,
  useDeleteUser,
  useToggleUserActive,
  useUpdateUser,
} from '@/hooks/useAdminUsers';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/context/AuthContext';
import { toastError, toastSuccess } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/admin/DataTable';

export function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const search = useDebouncedValue(searchInput, 300);
  const offset = (page - 1) * ADMIN_USER_PAGE_SIZE;

  const { data, isLoading, isError, error, isFetching } = useAdminUsers({ offset, search, sort });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const toggleMutation = useToggleUserActive();
  const deleteMutation = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_USER_PAGE_SIZE));

  function isSelf(user: User): boolean {
    return currentUser?.id === user.id;
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setFormOpen(true);
  }

  function handleCreate(payload: CreateUserRequest) {
    createMutation.mutate(payload, {
      onSuccess: () => {
        toastSuccess('Usuario creado', `"${payload.name}" fue creado.`);
        setFormOpen(false);
      },
      onError: (err) => toastError(err, 'No se pudo crear el usuario'),
    });
  }

  function handleUpdate(id: number, payload: UpdateUserRequest) {
    updateMutation.mutate(
      { id, payload },
      {
        onSuccess: () => {
          toastSuccess('Usuario actualizado');
          setFormOpen(false);
        },
        onError: (err) => toastError(err, 'No se pudo actualizar el usuario'),
      },
    );
  }

  function handleToggle(user: User) {
    // Guard: do not let an admin deactivate their own account.
    if (isSelf(user) && user.isActive) {
      toastError(
        new Error('No puedes desactivar tu propia cuenta.'),
        'Acción no permitida',
      );
      return;
    }
    toggleMutation.mutate(user.id, {
      onSuccess: (updated) =>
        toastSuccess(updated.isActive ? 'Usuario activado' : 'Usuario desactivado'),
      onError: (err) => toastError(err, 'No se pudo cambiar el estado'),
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const user = deleting;
    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        toastSuccess('Usuario eliminado', `"${user.name}" fue dado de baja.`);
        setDeleting(null);
      },
      onError: (err) => toastError(err, 'No se pudo eliminar el usuario'),
    });
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: 'name',
      label: 'NOMBRE',
      allowsSorting: true,
      sortField: 'name',
      className: 'font-medium',
      render: (user) => (
        <>
          {user.name}
          {isSelf(user) && (
            <Chip size="sm" variant="flat" color="default" className="ml-2">
              Tú
            </Chip>
          )}
        </>
      ),
    },
    {
      key: 'email',
      label: 'CORREO',
      allowsSorting: true,
      sortField: 'email',
      className: 'text-default-500',
      render: (user) => user.email,
    },
    {
      key: 'role',
      label: 'ROL',
      allowsSorting: true,
      sortField: 'role',
      render: (user) => (
        <Chip size="sm" variant="flat" color={user.role === 'admin' ? 'warning' : 'default'}>
          {user.role === 'admin' ? 'Administrador' : 'Usuario'}
        </Chip>
      ),
    },
    {
      key: 'isActive',
      label: 'ACTIVO',
      allowsSorting: true,
      sortField: 'is_active',
      render: (user) => (
        <Tooltip
          content={
            isSelf(user) && user.isActive
              ? 'No puedes desactivar tu propia cuenta'
              : user.isActive
                ? 'Desactivar'
                : 'Activar'
          }
        >
          <span className="inline-flex">
            <Switch
              size="sm"
              isSelected={user.isActive}
              isDisabled={isSelf(user) && user.isActive}
              onValueChange={() => handleToggle(user)}
              aria-label={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
            />
          </span>
        </Tooltip>
      ),
    },
    {
      key: 'lastLogin',
      label: 'ÚLTIMO ACCESO',
      allowsSorting: true,
      sortField: 'last_login',
      render: (user) => formatDate(user.lastLogin),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      align: 'end',
      render: (user) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="flat" onPress={() => openEdit(user)}>
            Editar
          </Button>
          <Tooltip content={isSelf(user) ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}>
            <span className="inline-flex">
              <Button
                size="sm"
                color="danger"
                variant="flat"
                isDisabled={isSelf(user)}
                onPress={() => setDeleting(user)}
              >
                Eliminar
              </Button>
            </span>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Usuarios"
        title={<h2 className="text-lg font-semibold">Usuarios</h2>}
        columns={columns}
        items={users}
        getRowKey={(user) => user.id}
        isLoading={isLoading}
        isFetching={isFetching}
        errorMessage={isError ? toUserMessage(error) : null}
        emptyContent="No hay usuarios."
        search={{
          value: searchInput,
          onChange: (value) => {
            setSearchInput(value);
            setPage(1);
          },
          placeholder: 'Buscar por nombre o correo',
        }}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        pagination={{ page, totalPages, onChange: setPage }}
        headerActions={
          <Button color="primary" onPress={openCreate}>
            Nuevo usuario
          </Button>
        }
      />

      <UserFormModal
        isOpen={formOpen}
        user={editing}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <ConfirmDialog
        isOpen={deleting !== null}
        title="Eliminar usuario"
        body={
          <>
            ¿Seguro que quieres dar de baja a <strong>{deleting?.name}</strong>? La cuenta se
            desactivará y dejará de tener acceso.
          </>
        }
        confirmLabel="Eliminar"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
