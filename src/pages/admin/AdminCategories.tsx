import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { toUserMessage } from '@/api/client';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/api/types';
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useAdminCategories';
import { toastError, toastSuccess } from '@/lib/toast';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

export function AdminCategories() {
  const { data, isLoading, isError, error, isFetching } = useAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const categories = data ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  function handleCreate(payload: CreateCategoryRequest) {
    createMutation.mutate(payload, {
      onSuccess: () => {
        toastSuccess('Categoría creada', `"${payload.name}" fue creada.`);
        setFormOpen(false);
      },
      onError: (err) => toastError(err, 'No se pudo crear la categoría'),
    });
  }

  function handleUpdate(id: number, payload: UpdateCategoryRequest) {
    updateMutation.mutate(
      { id, payload },
      {
        onSuccess: () => {
          toastSuccess('Categoría actualizada');
          setFormOpen(false);
        },
        onError: (err) => toastError(err, 'No se pudo actualizar la categoría'),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    const category = deleting;
    deleteMutation.mutate(category.id, {
      onSuccess: () => {
        toastSuccess('Categoría eliminada', `"${category.name}" fue eliminada.`);
        setDeleting(null);
      },
      onError: (err) => toastError(err, 'No se pudo eliminar la categoría'),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Categorías</h2>
            {isFetching && <Spinner size="sm" aria-label="Actualizando" />}
          </div>
          <Button color="primary" onPress={openCreate}>
            Nueva categoría
          </Button>
        </CardHeader>
        <CardBody>
          <Table aria-label="Categorías" removeWrapper>
            <TableHeader>
              <TableColumn>NOMBRE</TableColumn>
              <TableColumn>SLUG</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>ICONO</TableColumn>
              <TableColumn align="end">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              items={categories}
              isLoading={isLoading}
              loadingContent={<Spinner label="Cargando categorías…" />}
              emptyContent={isError ? toUserMessage(error) : 'No hay categorías.'}
            >
              {(category: Category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-default-500">{category.slug}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={category.type === 'language' ? 'secondary' : 'primary'}
                    >
                      {category.type === 'language' ? 'Lenguaje' : 'Tecnología'}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-default-500">{category.icon ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="flat" onPress={() => openEdit(category)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setDeleting(category)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <CategoryFormModal
        isOpen={formOpen}
        category={editing}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <ConfirmDialog
        isOpen={deleting !== null}
        title="Eliminar categoría"
        body={
          <>
            ¿Seguro que quieres eliminar <strong>{deleting?.name}</strong>? Se quitará de los
            documentos que la usen.
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
