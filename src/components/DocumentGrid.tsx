import { Button, Card, CardBody, CardFooter, CardHeader, Skeleton, Spinner } from '@heroui/react';
import { toUserMessage } from '@/api/client';
import { PAGE_SIZE, useDocuments } from '@/hooks/useDocuments';
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
    return <SkeletonGrid />;
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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <Card key={index} className="h-52 border border-divider bg-content1" radius="lg">
          <CardHeader className="gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </CardHeader>
          <CardBody className="gap-2">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-5/6 rounded-md" />
          </CardBody>
          <CardFooter>
            <Skeleton className="h-9 w-full rounded-large" />
          </CardFooter>
        </Card>
      ))}
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
