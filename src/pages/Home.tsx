import { Breadcrumbs, BreadcrumbItem } from '@heroui/react';
import { DocumentGrid } from '@/components/DocumentGrid';
import { useSidebarSelection } from '@/context/SidebarSelectionContext';
import { useSearchTerm } from '@/context/SearchContext';

export function Home() {
  const { selection } = useSidebarSelection();
  const search = useSearchTerm();

  const heading = selection ? selection.categoryName : 'Todos los documentos';

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <Breadcrumbs>
          <BreadcrumbItem>Inicio</BreadcrumbItem>
          <BreadcrumbItem>Resultados por búsqueda o categoría</BreadcrumbItem>
        </Breadcrumbs>
        <h1 className="text-xl font-semibold">{heading}</h1>
        {search && (
          <p className="text-sm text-default-500">
            Buscando: <span className="font-medium">{search}</span>
          </p>
        )}
      </header>

      <DocumentGrid search={search} categoryId={selection?.categoryId} />
    </section>
  );
}
