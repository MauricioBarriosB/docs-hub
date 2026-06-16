import { useState } from 'react';
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { downloadDocument } from '@/api/client';
import type { DocumentItem } from '@/api/types';
import { toastError } from '@/lib/toast';
import { formatDate, formatFileSize } from '@/lib/format';
import { DownloadIcon } from '@/components/icons';
import { StatusChip } from './StatusChip';

interface DocumentDetailModalProps {
  document: DocumentItem | null;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-default-400">{label}</span>
      <span className="text-sm text-default-700">{children}</span>
    </div>
  );
}

/** Read-only metadata view of a document, shared by admin screens. */
export function DocumentDetailModal({ document, onClose }: DocumentDetailModalProps) {
  const isOpen = document !== null;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!document) return;
    setDownloading(true);
    try {
      await downloadDocument(document.id, document.fileName);
    } catch (err) {
      toastError(err, 'No se pudo descargar el documento');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        {document && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span>{document.title}</span>
              <StatusChip status={document.status} />
            </ModalHeader>
            <ModalBody className="gap-4">
              {document.description && (
                <Row label="Descripción">{document.description}</Row>
              )}
              <Row label="Autor">{document.authorName ?? `#${document.authorId}`}</Row>
              <Row label="Archivo">
                {document.fileName} · {document.fileExt.toUpperCase()} ·{' '}
                {formatFileSize(document.fileSize)}
              </Row>
              <Row label="Categorías">
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {document.categories.length === 0 && <span>—</span>}
                  {document.categories.map((category) => (
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
              </Row>
              <div className="grid grid-cols-2 gap-4">
                <Row label="Descargas">{document.downloadCount}</Row>
                <Row label="Creado">{formatDate(document.createdAt)}</Row>
                <Row label="Publicado">{formatDate(document.publishedAt)}</Row>
              </div>
              {document.status === 'rejected' && document.rejectReason && (
                <Row label="Motivo de rechazo">
                  <span className="text-danger">{document.rejectReason}</span>
                </Row>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cerrar
              </Button>
              <Button
                color="primary"
                variant="flat"
                isLoading={downloading}
                onPress={handleDownload}
                startContent={downloading ? undefined : <DownloadIcon size={16} />}
                aria-label={`Descargar ${document.title}`}
              >
                Descargar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
