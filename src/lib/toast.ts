import { addToast } from '@heroui/react';
import { toUserMessage } from '@/api/client';

/** Show a success toast (green). */
export function toastSuccess(title: string, description?: string): void {
  addToast({ title, description, color: 'success' });
}

/**
 * Show an error toast from any caught value, surfacing the backend `userMessage`
 * when present (see ApiError) and falling back to a generic message otherwise.
 */
export function toastError(err: unknown, title = 'Ocurrió un error'): void {
  addToast({ title, description: toUserMessage(err), color: 'danger' });
}
