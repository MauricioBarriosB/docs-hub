import { Icon } from '@iconify/react';

interface CategoryIconProps {
  /** Iconify icon name, e.g. "mdi:react". May be null/empty for legacy data. */
  icon?: string | null;
  /** Pixel size; defaults to a chip-friendly 16px. */
  size?: number;
  className?: string;
}

/** Fallback used when a category has no `icon` or an unknown name. */
const FALLBACK_ICON = 'mdi:tag-outline';

/**
 * Renders a category's Iconify (mdi:*) icon. Falls back to a generic tag glyph
 * when the icon name is missing, so cards/sidebar rows never render a gap.
 */
export function CategoryIcon({ icon, size = 16, className }: CategoryIconProps) {
  const name = icon && icon.trim().length > 0 ? icon : FALLBACK_ICON;
  return <Icon icon={name} width={size} height={size} className={className} aria-hidden />;
}
