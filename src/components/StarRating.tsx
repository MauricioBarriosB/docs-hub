import { useState } from 'react';
import { Icon } from '@iconify/react';

interface StarRatingProps {
  /** Current value. In read-only mode this may be fractional (e.g. 4.3). */
  value: number;
  /** When provided the component is interactive and reports the picked 1–5 value. */
  onChange?: (value: number) => void;
  /** Star size in pixels. */
  size?: number;
  /** Disable interaction (e.g. while a rating is being saved). */
  isDisabled?: boolean;
  className?: string;
  /** Accessible label for the whole control. */
  label?: string;
}

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * Five-star rating. Read-only by default (renders half stars for fractional
 * averages); pass `onChange` to make it interactive (whole-star selection with
 * hover preview). Purely presentational — data/auth logic lives in the caller.
 */
export function StarRating({
  value,
  onChange,
  size = 18,
  isDisabled = false,
  className,
  label,
}: Readonly<StarRatingProps>) {
  const interactive = typeof onChange === 'function';
  const [hover, setHover] = useState<number | null>(null);

  const shown = interactive && hover !== null ? hover : value;

  function iconName(position: number): string {
    if (shown >= position) return 'mdi:star';
    if (!interactive && shown >= position - 0.5) return 'mdi:star-half-full';
    return 'mdi:star-outline';
  }

  function colorClass(position: number): string {
    return shown >= position - 0.5 ? 'text-warning-400' : 'text-default-300';
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className ?? ''}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label ?? `Valoración: ${value} de 5`}
    >
      {STARS.map((position) => {
        const star = (
          <Icon
            icon={iconName(position)}
            width={size}
            height={size}
            className={colorClass(position)}
            aria-hidden
          />
        );

        if (!interactive) {
          return <span key={position}>{star}</span>;
        }

        return (
          <button
            key={position}
            type="button"
            disabled={isDisabled}
            className="cursor-pointer rounded-sm leading-none transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
            onMouseEnter={() => setHover(position)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(position)}
            onBlur={() => setHover(null)}
            onClick={() => onChange?.(position)}
            aria-label={`${position} ${position === 1 ? 'estrella' : 'estrellas'}`}
            aria-pressed={value === position}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
