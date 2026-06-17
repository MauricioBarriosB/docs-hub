import { Link } from 'react-router-dom';
import { Link as HeroLink, Spinner } from '@heroui/react';
import { useAuth } from '@/context/AuthContext';
import { useMyDocumentRating, useRateDocument } from '@/hooks/useDocumentRating';
import { toastError, toastSuccess } from '@/lib/toast';
import { StarRating } from './StarRating';

interface DocumentRatingPanelProps {
  documentId: number;
  /** Aggregate values from the document payload (used as the initial display). */
  average: number;
  count: number;
}

/**
 * Rating block for the document detail page: shows the public average and, for
 * signed-in users, an editable 1–5 star control (one rating per user/document,
 * upserted on each click). Anonymous users see a prompt to log in.
 */
export function DocumentRatingPanel({ documentId, average, count }: Readonly<DocumentRatingPanelProps>) {
  const { isAuthenticated } = useAuth();
  const { data: rating, isLoading } = useMyDocumentRating(documentId, isAuthenticated);
  const { mutate, isPending } = useRateDocument(documentId);

  // Prefer the live rating query (fresh after a vote) over the payload snapshot.
  const shownAverage = rating?.average ?? average;
  const shownCount = rating?.count ?? count;
  const userRating = rating?.userRating ?? 0;

  function handleRate(value: number) {
    mutate(value, {
      onSuccess: () => toastSuccess('Valoración guardada', `Valoraste este documento con ${value} ${value === 1 ? 'estrella' : 'estrellas'}.`),
      onError: (err) => toastError(err, 'No se pudo guardar la valoración'),
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-large border border-divider bg-content2/40 p-4">
      <div className="flex items-center gap-2">
        <StarRating value={shownAverage} size={15} />
        <span className="text-sm font-medium text-default-700">
          {shownCount > 0 ? shownAverage.toFixed(1) : '—'}
        </span>
        <span className="text-xs text-default-400">
          {shownCount > 0
            ? `${shownCount} ${shownCount === 1 ? 'valoración' : 'valoraciones'}`
            : 'Sin valoraciones aún'}
        </span>
      </div>

      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-default-500">Tu valoración</span>
          {isLoading ? (
            <Spinner size="sm" aria-label="Cargando tu valoración" />
          ) : (
            <StarRating value={userRating} size={15} isDisabled={isPending} onChange={handleRate} />
          )}
          {isPending && <Spinner size="sm" aria-label="Guardando" />}
        </div>
      ) : (
        <p className="text-xs text-default-500">
          <HeroLink as={Link} to="/login" size="sm" className="font-medium">
            Inicia sesión
          </HeroLink>{' '}
          para valorar este documento.
        </p>
      )}
    </div>
  );
}
