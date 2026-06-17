import { useState } from 'react';
import { Button, Select, SelectItem } from '@heroui/react';
import { toUserMessage } from '@/api/client';
import type { DocumentItem, DocumentStatus, UpdateDocumentRequest } from '@/api/types';
import {
  ADMIN_DOC_PAGE_SIZE,
  useAdminDocuments,
  useDeleteDocument,
  useUpdateDocument,
} from '@/hooks/useAdminDocuments';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toastError, toastSuccess } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import { StatusChip } from '@/components/admin/StatusChip';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { DocumentDetailModal } from '@/components/admin/DocumentDetailModal';
import { DocumentFormModal } from '@/components/admin/DocumentFormModal';
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/admin/DataTable';

const STATUS_OPTIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'published', label: 'Publicados' },
  { key: 'rejected', label: 'Rechazados' },
];

export function AdminDocuments() {
  const [statusKey, setStatusKey] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const search = useDebouncedValue(searchInput, 300);

  const [detail, setDetail] = useState<DocumentItem | null>(null);
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState<DocumentItem | null>(null);

  const status: DocumentStatus | null = statusKey === 'all' ? null : (statusKey as DocumentStatus);
  const { data, isLoading, isError, error, isFetching } = useAdminDocuments({
    status,
    page,
    search,
    sort,
  });
  const remove = useDeleteDocument();
  const update = useUpdateDocument();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_DOC_PAGE_SIZE));

  function handleUpdate(id: number, payload: UpdateDocumentRequest, file?: File | null) {
    update.mutate(
      { id, payload, file },
      {
        onSuccess: () => {
          toastSuccess('Documento actualizado', 'Los cambios se guardaron correctamente.');
          setEditing(null);
        },
        onError: (err) => toastError(err, 'No se pudo actualizar'),
      },
    );
  }

  function handleDelete() {
    if (!deleting) return;
    const doc = deleting;
    remove.mutate(doc.id, {
      onSuccess: () => {
        toastSuccess('Documento eliminado', `"${doc.title}" fue eliminado.`);
        setDeleting(null);
      },
      onError: (err) => toastError(err, 'No se pudo eliminar'),
    });
  }

  const columns: DataTableColumn<DocumentItem>[] = [
    {
      key: 'title',
      label: 'TÍTULO',
      allowsSorting: true,
      sortField: 'title',
      render: (doc) => (
        <button
          type="button"
          className="text-left font-medium text-foreground hover:text-primary"
          onClick={() => setDetail(doc)}
        >
          {doc.title}
        </button>
      ),
    },
    {
      key: 'author',
      label: 'AUTOR',
      allowsSorting: true,
      sortField: 'author',
      render: (doc) => doc.authorName ?? `#${doc.authorId}`,
    },
    {
      key: 'status',
      label: 'ESTADO',
      allowsSorting: true,
      sortField: 'status',
      render: (doc) => <StatusChip status={doc.status} />,
    },
    {
      key: 'downloadCount',
      label: 'DESCARGAS',
      allowsSorting: true,
      sortField: 'download_count',
      render: (doc) => doc.downloadCount,
    },
    {
      key: 'createdAt',
      label: 'CREADO',
      allowsSorting: true,
      sortField: 'created_at',
      render: (doc) => formatDate(doc.createdAt),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      align: 'end',
      render: (doc) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="flat" onPress={() => setDetail(doc)}>
            Ver
          </Button>
          <Button size="sm" color="primary" variant="flat" onPress={() => setEditing(doc)}>
            Editar
          </Button>
          <Button size="sm" color="danger" variant="flat" onPress={() => setDeleting(doc)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Todos los documentos"
        title={<h2 className="text-lg font-semibold">Documentos</h2>}
        columns={columns}
        items={items}
        getRowKey={(doc) => doc.id}
        isLoading={isLoading}
        isFetching={isFetching}
        errorMessage={isError ? toUserMessage(error) : null}
        emptyContent="No hay documentos."
        search={{
          value: searchInput,
          onChange: (value) => {
            setSearchInput(value);
            setPage(1);
          },
          placeholder: 'Buscar por título o descripción',
        }}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        pagination={{ page, totalPages, onChange: setPage }}
        toolbar={
          <Select
            aria-label="Filtrar por estado"
            selectedKeys={[statusKey]}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (typeof next === 'string') {
                setStatusKey(next);
                setPage(1);
              }
            }}
            className="w-40"
            disallowEmptySelection
          >
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        }
      />

      <DocumentDetailModal document={detail} onClose={() => setDetail(null)} />
      <DocumentFormModal
        isOpen={editing !== null}
        document={editing}
        isLoading={update.isPending}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
      />
      <ConfirmDialog
        isOpen={deleting !== null}
        title="Eliminar documento"
        body={
          <>
            ¿Seguro que quieres eliminar <strong>{deleting?.title}</strong>? El archivo se
            borrará del servidor y no se podrá deshacer.
          </>
        }
        confirmLabel="Eliminar"
        isLoading={remove.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
