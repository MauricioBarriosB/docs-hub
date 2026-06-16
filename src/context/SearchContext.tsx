import { createContext, useContext } from 'react';

/** Debounced search term, provided by PublicLayout, consumed by Home. */
export const SearchContext = createContext<string>('');

export function useSearchTerm(): string {
  return useContext(SearchContext);
}
