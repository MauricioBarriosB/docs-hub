import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Breadcrumbs,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Spinner,
} from '@heroui/react';
import { downloadDocument, toUserMessage } from '@/api/client';
import { useDocument } from '@/hooks/useDocument';
import { CategoryIcon } from '@/components/CategoryIcon';
import { DocumentIcon, DownloadIcon } from '@/components/icons';
import { toastError } from '@/lib/toast';
import { formatDate, formatFileSize } from '@/lib/format';
import { Icon } from '@iconify/react';

function Row({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-default-400">{label}</span>
      <span className="text-sm text-default-700">{children}</span>
    </div>
  );
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id !== undefined ? Number(id) : undefined;
  const { data: document, isLoading, isError, error, refetch } = useDocument(numericId);
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Cargando documento…" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-large border border-dashed border-default-200 py-16 text-center">
        <DocumentIcon size={40} className="text-default-300" />
        <div>
          <p className="font-medium">No se pudo cargar el documento</p>
          <p className="max-w-sm text-sm text-default-500">
            {isError ? toUserMessage(error) : 'El documento no existe o no está publicado.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="flat" onPress={() => navigate('/')}      startContent={<Icon icon="mdi:arrow-left" width={18} height={18} aria-hidden />}>
            Volver al inicio
          </Button>
          {isError && (
            <Button color="primary" variant="flat" onPress={() => void refetch()}>
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  const dateValue = document.publishedAt ?? document.createdAt;

  return (
    <section className="mx-auto flex w-full flex-col gap-4">
      <header className="flex flex-col gap-1">
        <Breadcrumbs>
          <BreadcrumbItem onPress={() => navigate('/')}>Inicio</BreadcrumbItem>
          <BreadcrumbItem>{document.title}</BreadcrumbItem>
        </Breadcrumbs>
      </header>

      <Card className="border border-divider bg-content1" radius="lg" shadow="sm">
        <CardHeader className="flex flex-wrap gap-1.5">
          {document.categories.map((category) => (
            <Chip
              key={category.id}
              size="sm"
              variant="flat"
              color={category.type === 'language' ? 'secondary' : 'primary'}
              startContent={<CategoryIcon icon={category.icon} size={14} className="ml-1" />}
            >
              {category.name}
            </Chip>
          ))}
        </CardHeader>

        <CardBody className="gap-4">
          <h1 className="text-2xl font-bold text-foreground">{document.title}</h1>

          {document.description && (
            <Row label="Descripción">{document.description}</Row>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Row label="Autor">{document.authorName}</Row>
            <Row label="Archivo">
              {document.fileName} · {document.fileExt.toUpperCase()} ·{' '}
              {formatFileSize(document.fileSize)}
            </Row>
            <Row label="Publicado">{formatDate(dateValue)}</Row>
            <Row label="Descargas">{document.downloadCount}</Row>
          </div>
        </CardBody>

        <CardFooter className="gap-2">
          <Button variant="flat" onPress={() => navigate('/')}  startContent={<Icon icon="mdi:arrow-left" width={18} height={18} aria-hidden />}>
            Volver
          </Button>
          <Button
            color="primary"
            isLoading={downloading}
            onPress={handleDownload}
            startContent={downloading ? undefined : <DownloadIcon size={18} />}
            aria-label={`Descargar ${document.title}`}
          >
            Descargar documento
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
