import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Pagination,
  Skeleton,
  Spinner,
} from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { downloadDocument, toUserMessage } from '@/api/client';
import type { DocumentItem } from '@/api/types';
import { MY_UPLOADS_PAGE_SIZE, useMyUploads } from '@/hooks/useMyUploads';
import { toastError } from '@/lib/toast';
import { formatDate, formatFileSize } from '@/lib/format';
import { DownloadIcon, UploadIcon } from '@/components/icons';
import { StatusChip } from '@/components/admin/StatusChip';

/** The signed-in user's own uploads and their moderation status. */
export function MyUploads() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { data, isLoading, isError, error, isFetching } = useMyUploads({ page });

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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Mis documentos</h1>
          {isFetching && !isLoading && <Spinner size="sm" aria-label="Actualizando" />}
        </div>
        <Button color="primary" startContent={<UploadIcon size={16} />} onPress={() => navigate('/upload')}>
          Subir documento
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {['s1', 's2', 's3'].map((key) => (
            <Card key={key}>
              <CardBody className="gap-2">
                <Skeleton className="h-5 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-3/4 rounded-md" />
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <Card>
          <CardBody className="py-10 text-center text-default-500">
            {toUserMessage(error)}
          </CardBody>
        </Card>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-default-600">Aún no has subido ningún documento.</p>
            <Button color="primary" variant="flat" onPress={() => navigate('/upload')}>
              Subir tu primer documento
            </Button>
          </CardBody>
        </Card>
      )}

      {!isLoading &&
        items.map((doc: DocumentItem) => (
          <Card key={doc.id} shadow="sm">
            <CardHeader className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">{doc.title}</h2>
                <span className="text-xs text-default-500">
                  Subido el {formatDate(doc.createdAt)}
                </span>
              </div>
              <StatusChip status={doc.status} />
            </CardHeader>
            <CardBody className="gap-3 pt-0">
              {doc.description && (
                <p className="line-clamp-2 text-sm text-default-600">{doc.description}</p>
              )}
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
              {doc.status === 'rejected' && doc.rejectReason && (
                <div className="rounded-medium border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700 dark:bg-danger-50/10">
                  <span className="font-medium">Motivo del rechazo: </span>
                  {doc.rejectReason}
                </div>
              )}
              {doc.status === 'pending' && (
                <p className="text-xs text-warning-600">
                  Pendiente de aprobación por un administrador.
                </p>
              )}
            </CardBody>
            <CardFooter className="flex items-center justify-between">
              <span className="text-xs uppercase text-default-400">
                {doc.fileExt} · {formatFileSize(doc.fileSize)}
              </span>
              {doc.status === 'published' && (
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
              )}
            </CardFooter>
          </Card>
        ))}

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination showControls page={page} total={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
