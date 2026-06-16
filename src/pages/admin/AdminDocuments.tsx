import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { toUserMessage } from '@/api/client';
import type { DocumentItem, DocumentStatus } from '@/api/types';
import {
  ADMIN_DOC_PAGE_SIZE,
  useAdminDocuments,
  useDeleteDocument,
  useUpdateDocument,
} from '@/hooks/useAdminDocuments';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toastError, toastSuccess } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import { SearchIcon } from '@/components/icons';
import { StatusChip } from '@/components/admin/StatusChip';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { DocumentDetailModal } from '@/components/admin/DocumentDetailModal';
import { DocumentFormModal } from '@/components/admin/DocumentFormModal';
import type { UpdateDocumentRequest } from '@/api/types';

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
  const search = useDebouncedValue(searchInput, 300);

  const [detail, setDetail] = useState<DocumentItem | null>(null);
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState<DocumentItem | null>(null);

  const status: DocumentStatus | null = statusKey === 'all' ? null : (statusKey as DocumentStatus);
  const { data, isLoading, isError, error, isFetching } = useAdminDocuments({
    status,
    page,
    search,
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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Documentos</h2>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {isFetching && <Spinner size="sm" aria-label="Actualizando" />}
            <Input
              aria-label="Buscar documentos"
              placeholder="Buscar por título o descripción"
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
          </div>
        </CardHeader>
        <CardBody>
          <Table
            aria-label="Todos los documentos"
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
              <TableColumn>TÍTULO</TableColumn>
              <TableColumn>AUTOR</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn>DESCARGAS</TableColumn>
              <TableColumn>CREADO</TableColumn>
              <TableColumn align="end">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              items={items}
              isLoading={isLoading}
              loadingContent={<Spinner label="Cargando documentos…" />}
              emptyContent={isError ? toUserMessage(error) : 'No hay documentos.'}
            >
              {(doc: DocumentItem) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <button
                      type="button"
                      className="text-left font-medium text-foreground hover:text-primary"
                      onClick={() => setDetail(doc)}
                    >
                      {doc.title}
                    </button>
                  </TableCell>
                  <TableCell>{doc.authorName ?? `#${doc.authorId}`}</TableCell>
                  <TableCell>
                    <StatusChip status={doc.status} />
                  </TableCell>
                  <TableCell>{doc.downloadCount}</TableCell>
                  <TableCell>{formatDate(doc.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="flat" onPress={() => setDetail(doc)}>
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => setEditing(doc)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setDeleting(doc)}
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
