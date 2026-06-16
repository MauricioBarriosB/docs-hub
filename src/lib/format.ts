/** Short locale date (es-CL) from an ISO/SQL datetime string; '—' when null. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  // Backend emits "YYYY-MM-DD HH:MM:SS" (SQLite). Normalise to ISO for Safari.
  const iso = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: '2-digit' });
}

/** Day-month-year date (dd-mm-yyyy) from an ISO/SQL datetime string; '—' when null. */
export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—';
  const iso = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Human-readable file size from a byte count. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
