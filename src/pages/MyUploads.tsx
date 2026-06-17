import { useState } from 'react';
import { Button, Chip, Tooltip } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { downloadDocument, toUserMessage } from '@/api/client';
import type { DocumentItem } from '@/api/types';
import { MY_UPLOADS_PAGE_SIZE, useMyUploads } from '@/hooks/useMyUploads';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toastError } from '@/lib/toast';
import { formatDate, formatFileSize } from '@/lib/format';
import { DownloadIcon, UploadIcon } from '@/components/icons';
import { StatusChip } from '@/components/admin/StatusChip';
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/admin/DataTable';

/** The signed-in user's own uploads and their moderation status. */
export function MyUploads() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading, isError, error, isFetching } = useMyUploads({ page, search, sort });

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc.id, doc.fileName);
    } catch (err) {
      toastError(err, 'No se pudo descargar el documento');
    } finally {
      setDownloadingId(null);
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / MY_UPLOADS_PAGE_SIZE));

  const columns: DataTableColumn<DocumentItem>[] = [
    {
      key: 'title',
      label: 'TÍTULO',
      allowsSorting: true,
      sortField: 'title',
      render: (doc) => (
        <div className="flex max-w-md flex-col">
          <span className="font-medium">{doc.title}</span>
          {doc.description && (
            <span className="line-clamp-1 text-xs text-default-500">{doc.description}</span>
          )}
        </div>
      ),
    },
    {
      key: 'categories',
      label: 'CATEGORÍAS',
      render: (doc) =>
        doc.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {doc.categories.map((category) => (
              <Chip
                key={category.id}
                size="sm"
                variant="flat"
                color={category.type === 'language' ? 'secondary' : 'primary'}
              >
                {category.name}
              </Chip>
            ))}
          </div>
        ) : (
          <span className="text-default-400">—</span>
        ),
    },
    {
      key: 'status',
      label: 'ESTADO',
      allowsSorting: true,
      sortField: 'status',
      render: (doc) => {
        if (doc.status === 'rejected' && doc.rejectReason) {
          return (
            <Tooltip content={`Motivo del rechazo: ${doc.rejectReason}`}>
              <span className="inline-flex">
                <StatusChip status={doc.status} />
              </span>
            </Tooltip>
          );
        }
        if (doc.status === 'pending') {
          return (
            <Tooltip content="Pendiente de aprobación por un administrador.">
              <span className="inline-flex">
                <StatusChip status={doc.status} />
              </span>
            </Tooltip>
          );
        }
        return <StatusChip status={doc.status} />;
      },
    },
    {
      key: 'file',
      label: 'ARCHIVO',
      className: 'whitespace-nowrap text-xs uppercase text-default-500',
      render: (doc) => `${doc.fileExt} · ${formatFileSize(doc.fileSize)}`,
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
      label: 'SUBIDO',
      allowsSorting: true,
      sortField: 'created_at',
      className: 'whitespace-nowrap text-sm text-default-600',
      render: (doc) => formatDate(doc.createdAt),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      align: 'end',
      render: (doc) =>
        doc.status === 'published' ? (
          <div className="flex justify-end">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              isLoading={downloadingId === doc.id}
              onPress={() => handleDownload(doc)}
              startContent={downloadingId === doc.id ? undefined : <DownloadIcon size={16} />}
              aria-label={`Descargar ${doc.title}`}
            >
              Descargar
            </Button>
          </div>
        ) : (
          <span className="block text-right text-default-300">—</span>
        ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl_ flex-col gap-4">
      <DataTable
        aria-label="Mis documentos"
        title={<h1 className="text-xl font-semibold">Mis documentos</h1>}
        columns={columns}
        items={items}
        getRowKey={(doc) => doc.id}
        isLoading={isLoading}
        isFetching={isFetching && !isLoading}
        errorMessage={isError ? toUserMessage(error) : null}
        emptyContent={
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-default-600">Aún no has subido ningún documento.</p>
            <Button color="primary" variant="flat" onPress={() => navigate('/upload')}>
              Subir tu primer documento
            </Button>
          </div>
        }
        search={{
          value: searchInput,
          onChange: (value) => {
            setSearchInput(value);
            setPage(1);
          },
          placeholder: 'Buscar en mis documentos',
        }}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        pagination={{ page, totalPages, onChange: setPage }}
        headerActions={
          <Button
            color="primary"
            startContent={<UploadIcon size={16} />}
            onPress={() => navigate('/upload')}
          >
            Subir documento
          </Button>
        }
      />
    </div>
  );
}
