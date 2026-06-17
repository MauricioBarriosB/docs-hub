/**
 * Dev-only mock data, gated behind `VITE_USE_MOCKS=true`.
 *
 * Never imported by production components directly — endpoint modules consult
 * `env.useMocks` and fall back to these when the API is unreachable. Keeps fake
 * data out of the shipped UI.
 */

import type { Category, DocumentListItem, Paginated } from './types';

export const mockCategories: Category[] = [
  { id: 1, name: 'TypeScript', slug: 'typescript', type: 'language', icon: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 2, name: 'JavaScript', slug: 'javascript', type: 'language', icon: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 3, name: 'PHP', slug: 'php', type: 'language', icon: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 4, name: 'Python', slug: 'python', type: 'language', icon: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 5, name: 'React', slug: 'react', type: 'technology', icon: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 6, name: 'CodeIgniter', slug: 'codeigniter', type: 'technology', icon: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 7, name: 'Tailwind CSS', slug: 'tailwind', type: 'technology', icon: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 8, name: 'Vite', slug: 'vite', type: 'technology', icon: null, createdAt: '2026-01-01T00:00:00Z' },
];

function makeDoc(id: number): DocumentListItem {
  const cat = mockCategories[id % mockCategories.length];
  const tech = mockCategories[(id + 4) % mockCategories.length];
  return {
    id,
    title: `Documento de ejemplo #${id}`,
    description: 'Contenido de demostración servido por el mock local de desarrollo.',
    uploadedByName: 'Autor Demo',
    categories: [cat, tech],
    publishedAt: '2026-02-01T00:00:00Z',
    ratingAverage: (id % 5) + 0.5,
    ratingCount: id % 7,
  };
}

export function mockDocumentsPage(page: number, perPage: number): Paginated<DocumentListItem> {
  const total = 42;
  const start = (page - 1) * perPage;
  const items: DocumentListItem[] = [];
  for (let i = start + 1; i <= Math.min(start + perPage, total); i += 1) {
    items.push(makeDoc(i));
  }
  return { items, total, page, perPage };
}
