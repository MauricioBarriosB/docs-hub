import { Chip } from '@heroui/react';
import type { DocumentStatus } from '@/api/types';

const STATUS_META: Record<
  DocumentStatus,
  { label: string; color: 'warning' | 'success' | 'danger' }
> = {
  pending: { label: 'Pendiente', color: 'warning' },
  published: { label: 'Publicado', color: 'success' },
  rejected: { label: 'Rechazado', color: 'danger' },
};

/** Coloured chip for a document moderation status. */
export function StatusChip({ status }: { status: DocumentStatus }) {
  const meta = STATUS_META[status];
  return (
    <Chip size="sm" variant="flat" color={meta.color}>
      {meta.label}
    </Chip>
  );
}
