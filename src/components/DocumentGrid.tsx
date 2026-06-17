import { Button, Spinner } from '@heroui/react';
import { toUserMessage } from '@/api/client';
import { useDocuments } from '@/hooks/useDocuments';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { DocumentCard } from './DocumentCard';
import { DocumentIcon } from './icons';

interface DocumentGridProps {
  search?: string;
  categoryId?: number;
}

export function DocumentGrid({ search, categoryId }: Readonly<DocumentGridProps>) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDocuments({ search, categoryId });

  const sentinelRef = useInfiniteScrollSentinel<HTMLDivElement>({
    onIntersect: () => void fetchNextPage(),
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner label="Cargando documentos…" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="No se pudieron cargar los documentos"
        description={toUserMessage(error)}
        action={
          <Button color="primary" variant="flat" onPress={() => void refetch()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const documents = data?.pages.flatMap((page) => page.items) ?? [];

  if (documents.length === 0) {
    return (
      <EmptyState
        title="Sin resultados"
        description="No hay documentos publicados que coincidan con tu búsqueda o categoría."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>

      {/* IntersectionObserver sentinel for infinite scroll. */}
      <div ref={sentinelRef} className="flex h-10 items-center justify-center">
        {isFetchingNextPage && <Spinner size="sm" label="Cargando más…" />}
        {!hasNextPage && documents.length > 0 && (
          <span className="text-xs text-default-400">No hay más documentos</span>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ title, description, action }: Readonly<EmptyStateProps>) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-large border border-dashed border-default-200 py-16 text-center">
      <DocumentIcon size={40} className="text-default-300" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="max-w-sm text-sm text-default-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
