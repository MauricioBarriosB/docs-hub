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
  useApproveDocument,
  useRejectDocument,
} from '@/hooks/useAdminDocuments';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toastError, toastSuccess } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import { SearchIcon } from '@/components/icons';
import { StatusChip } from '@/components/admin/StatusChip';
import { RejectModal } from '@/components/admin/RejectModal';
import { DocumentDetailModal } from '@/components/admin/DocumentDetailModal';

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
  const search = useDebouncedValue(searchInput, 300);
  const [rejecting, setRejecting] = useState<DocumentItem | null>(null);
  const [detail, setDetail] = useState<DocumentItem | null>(null);

  const status: DocumentStatus | null = statusKey === 'all' ? null : (statusKey as DocumentStatus);
  const { data, isLoading, isError, error, isFetching } = useAdminDocuments({ status, page, search });
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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Cola de moderación</h2>
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
            aria-label="Documentos para moderar"
            removeWrapper
            bottomContent={
              totalPages > 1 ? (
                <div className="flex justify-center">
                  <Pagination
                    showControls
                    page={page}
                    total={totalPages}
                    onChange={setPage}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>TÍTULO</TableColumn>
              <TableColumn>AUTOR</TableColumn>
              <TableColumn>CREADO</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn align="end">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              items={items}
              isLoading={isLoading}
              loadingContent={<Spinner label="Cargando documentos…" />}
              emptyContent={
                isError ? toUserMessage(error) : 'No hay documentos en este estado.'
              }
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
                  <TableCell>{formatDate(doc.createdAt)}</TableCell>
                  <TableCell>
                    <StatusChip status={doc.status} />
                  </TableCell>
                  <TableCell>
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
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => setRejecting(doc)}
                        >
                          Rechazar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

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
