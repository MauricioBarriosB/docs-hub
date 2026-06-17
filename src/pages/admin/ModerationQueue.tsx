import { useState } from 'react';
import { Button, Select, SelectItem } from '@heroui/react';
import { toUserMessage } from '@/api/client';
import type { DocumentItem, DocumentStatus } from '@/api/types';
import {
  ADMIN_DOC_PAGE_SIZE,
  useAdminDocuments,
  useApproveDocument,
  useRejectDocument,
} from '@/hooks/useAdminDocuments';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toastError, toastSuccess } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import { StatusChip } from '@/components/admin/StatusChip';
import { RejectModal } from '@/components/admin/RejectModal';
import { DocumentDetailModal } from '@/components/admin/DocumentDetailModal';
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/admin/DataTable';

const STATUS_OPTIONS: { key: string; label: string }[] = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'published', label: 'Publicados' },
  { key: 'rejected', label: 'Rechazados' },
  { key: 'all', label: 'Todos' },
];

export function ModerationQueue() {
  const [statusKey, setStatusKey] = useState<string>('pending');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const search = useDebouncedValue(searchInput, 300);
  const [rejecting, setRejecting] = useState<DocumentItem | null>(null);
  const [detail, setDetail] = useState<DocumentItem | null>(null);

  const status: DocumentStatus | null = statusKey === 'all' ? null : (statusKey as DocumentStatus);
  const { data, isLoading, isError, error, isFetching } = useAdminDocuments({
    status,
    page,
    search,
    sort,
  });
  const approve = useApproveDocument();
  const reject = useRejectDocument();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_DOC_PAGE_SIZE));

  function handleApprove(doc: DocumentItem) {
    approve.mutate(doc.id, {
      onSuccess: () => toastSuccess('Documento aprobado', `"${doc.title}" ya está publicado.`),
      onError: (err) => toastError(err, 'No se pudo aprobar'),
    });
  }

  function handleReject(reason: string) {
    if (!rejecting) return;
    const doc = rejecting;
    reject.mutate(
      { id: doc.id, reason },
      {
        onSuccess: () => {
          toastSuccess('Documento rechazado', `"${doc.title}" fue rechazado.`);
          setRejecting(null);
        },
        onError: (err) => toastError(err, 'No se pudo rechazar'),
      },
    );
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
      key: 'createdAt',
      label: 'CREADO',
      allowsSorting: true,
      sortField: 'created_at',
      render: (doc) => formatDate(doc.createdAt),
    },
    {
      key: 'status',
      label: 'ESTADO',
      allowsSorting: true,
      sortField: 'status',
      render: (doc) => <StatusChip status={doc.status} />,
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
          {doc.status !== 'published' && (
            <Button
              size="sm"
              color="success"
              variant="flat"
              isLoading={approve.isPending && approve.variables === doc.id}
              onPress={() => handleApprove(doc)}
            >
              Aprobar
            </Button>
          )}
          {doc.status !== 'rejected' && (
            <Button size="sm" color="danger" variant="flat" onPress={() => setRejecting(doc)}>
              Rechazar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Documentos para moderar"
        title={<h2 className="text-lg font-semibold">Cola de moderación</h2>}
        columns={columns}
        items={items}
        getRowKey={(doc) => doc.id}
        isLoading={isLoading}
        isFetching={isFetching}
        errorMessage={isError ? toUserMessage(error) : null}
        emptyContent="No hay documentos en este estado."
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

      <RejectModal
        isOpen={rejecting !== null}
        documentTitle={rejecting?.title}
        isLoading={reject.isPending}
        onConfirm={handleReject}
        onClose={() => setRejecting(null)}
      />
      <DocumentDetailModal document={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
