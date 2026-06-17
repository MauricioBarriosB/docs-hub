import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
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
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/admin/DataTable';

/** Categories per client-side page. */
const CATEGORY_PAGE_SIZE = 10;

export function AdminCategories() {
  const { data, isLoading, isError, error, isFetching } = useAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<DataTableSort | null>(null);

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

  const columns: DataTableColumn<Category>[] = [
    {
      key: 'name',
      label: 'NOMBRE',
      allowsSorting: true,
      sortAccessor: (category) => category.name,
      className: 'font-medium',
      render: (category) => category.name,
    },
    {
      key: 'slug',
      label: 'SLUG',
      allowsSorting: true,
      sortAccessor: (category) => category.slug,
      className: 'text-default-500',
      render: (category) => category.slug,
    },
    {
      key: 'type',
      label: 'TIPO',
      allowsSorting: true,
      sortAccessor: (category) => category.type,
      render: (category) => (
        <Chip size="sm" variant="flat" color={category.type === 'language' ? 'secondary' : 'primary'}>
          {category.type === 'language' ? 'Lenguaje' : 'Tecnología'}
        </Chip>
      ),
    },
    {
      key: 'icon',
      label: 'ICONO',
      className: 'text-default-500',
      render: (category) => category.icon ?? '—',
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      align: 'end',
      render: (category) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="flat" onPress={() => openEdit(category)}>
            Editar
          </Button>
          <Button size="sm" color="danger" variant="flat" onPress={() => setDeleting(category)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Categorías"
        title={<h2 className="text-lg font-semibold">Categorías</h2>}
        columns={columns}
        items={categories}
        getRowKey={(category) => category.id}
        isLoading={isLoading}
        isFetching={isFetching}
        errorMessage={isError ? toUserMessage(error) : null}
        emptyContent="No hay categorías."
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar por nombre o slug',
        }}
        sort={sort}
        onSortChange={setSort}
        clientPaging={{
          pageSize: CATEGORY_PAGE_SIZE,
          globalFilter: (category, query) =>
            category.name.toLowerCase().includes(query) ||
            category.slug.toLowerCase().includes(query),
        }}
        headerActions={
          <Button color="primary" onPress={openCreate}>
            Nueva categoría
          </Button>
        }
      />

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
