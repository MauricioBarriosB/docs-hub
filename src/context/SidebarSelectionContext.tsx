import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE_KEYS, readPersisted, writePersisted } from '@/lib/storage';

/**
 * The currently selected sidebar category (a language or technology), persisted
 * across reloads. `null` means "all documents".
 */
export interface SidebarSelection {
  categoryId: number;
  categoryName: string;
}

interface SidebarSelectionContextValue {
  selection: SidebarSelection | null;
  select: (selection: SidebarSelection) => void;
  clear: () => void;
}

const SidebarSelectionContext = createContext<SidebarSelectionContextValue | null>(null);

export function SidebarSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<SidebarSelection | null>(() =>
    readPersisted<SidebarSelection | null>(STORAGE_KEYS.sidebarSelection, null),
  );

  const select = useCallback((next: SidebarSelection) => {
    setSelection(next);
    writePersisted(STORAGE_KEYS.sidebarSelection, next);
  }, []);

  const clear = useCallback(() => {
    setSelection(null);
    writePersisted<SidebarSelection | null>(STORAGE_KEYS.sidebarSelection, null);
  }, []);

  const value = useMemo<SidebarSelectionContextValue>(
    () => ({ selection, select, clear }),
    [selection, select, clear],
  );

  return (
    <SidebarSelectionContext.Provider value={value}>{children}</SidebarSelectionContext.Provider>
  );
}

export function useSidebarSelection(): SidebarSelectionContextValue {
  const ctx = useContext(SidebarSelectionContext);
  if (!ctx) throw new Error('useSidebarSelection must be used within a SidebarSelectionProvider');
  return ctx;
}
