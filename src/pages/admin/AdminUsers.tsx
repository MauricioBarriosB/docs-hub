import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Pagination,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@heroui/react';
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
import { SearchIcon } from '@/components/icons';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

export function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const offset = (page - 1) * ADMIN_USER_PAGE_SIZE;

  const { data, isLoading, isError, error, isFetching } = useAdminUsers({ offset, search });
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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Usuarios</h2>
            {isFetching && <Spinner size="sm" aria-label="Actualizando" />}
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <Input
              aria-label="Buscar usuarios"
              placeholder="Buscar por nombre o correo"
              value={searchInput}
              onValueChange={(value) => {
                setSearchInput(value);
                setPage(1);
              }}
              startContent={<SearchIcon size={16} className="text-default-400" />}
              className="w-full sm:max-w-xs"
              isClearable
              onClear={() => {
                setSearchInput('');
                setPage(1);
              }}
            />
            <Button color="primary" onPress={openCreate}>
              Nuevo usuario
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Table
            aria-label="Usuarios"
            removeWrapper
            bottomContent={
              totalPages > 1 ? (
                <div className="flex justify-center">
                  <Pagination showControls page={page} total={totalPages} onChange={setPage} />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>NOMBRE</TableColumn>
              <TableColumn>CORREO</TableColumn>
              <TableColumn>ROL</TableColumn>
              <TableColumn>ACTIVO</TableColumn>
              <TableColumn>ÚLTIMO ACCESO</TableColumn>
              <TableColumn align="end">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              items={users}
              isLoading={isLoading}
              loadingContent={<Spinner label="Cargando usuarios…" />}
              emptyContent={isError ? toUserMessage(error) : 'No hay usuarios.'}
            >
              {(user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {isSelf(user) && (
                      <Chip size="sm" variant="flat" color="default" className="ml-2">
                        Tú
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell className="text-default-500">{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={user.role === 'admin' ? 'warning' : 'default'}
                    >
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </Chip>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{formatDate(user.lastLogin)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="flat" onPress={() => openEdit(user)}>
                        Editar
                      </Button>
                      <Tooltip
                        content={isSelf(user) ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}
                      >
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
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

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
