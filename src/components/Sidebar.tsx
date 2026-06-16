import { Accordion, AccordionItem, Button, Listbox, ListboxItem, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useCategories, splitCategories } from '@/hooks/useCategories';
import { useSidebarSelection } from '@/context/SidebarSelectionContext';
import { toUserMessage } from '@/api/client';
import type { Category } from '@/api/types';
import { CategoryIcon } from './CategoryIcon';

interface SidebarProps {
  /** Called after a selection is made (used to close the mobile drawer). */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: Readonly<SidebarProps>) {
  const { data, isLoading, isError, error, refetch } = useCategories();
  const { selection, select, clear } = useSidebarSelection();
  const navigate = useNavigate();
  const grouped = splitCategories(data);

  function handleSelect(category: Category) {
    select({ categoryId: category.id, categoryName: category.name });
    // The filtered grid only lives on Home; return there so the selection shows.
    navigate('/');
    onNavigate?.();
  }

  function handleClear() {
    clear();
    navigate('/');
    onNavigate?.();
  }

  return (
    <nav aria-label="Categorías" className="flex min-h-full flex-col gap-4 p-4">
      <Button
        size="sm"
        radius="sm"
        variant={selection ? 'flat' : 'solid'}
        color={selection ? 'default' : 'primary'}
        className="shrink-0 justify-start font-medium"
        startContent={<Icon icon="mdi:view-grid-outline" width={18} height={18} aria-hidden />}
        onPress={handleClear}
      >
        Todos los documentos
      </Button>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner label="Cargando categorías…" size="sm" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col gap-2 rounded-medium bg-danger-50 p-3 text-sm text-danger">
          <span>{toUserMessage(error)}</span>
          <Button size="sm" variant="flat" color="danger" onPress={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <Accordion
          selectionMode="multiple"
          isCompact
          showDivider={false}
          itemClasses={{
            title: 'text-sm font-semibold',
            trigger: 'py-2',
            content: 'pt-0 pb-2',
          }}
        >
          <AccordionItem
            key="languages"
            aria-label="Lenguajes"
            title="Lenguajes"
            startContent={<Icon icon="mdi:code-tags" width={20} height={20} aria-hidden />}
          >
            <CategoryList
              categories={grouped.language}
              selectedId={selection?.categoryId ?? null}
              onSelect={handleSelect}
              emptyLabel="Sin lenguajes"
            />
          </AccordionItem>
          <AccordionItem
            key="technologies"
            aria-label="Tecnologías"
            title="Tecnologías"
            startContent={<Icon icon="mdi:layers-outline" width={20} height={20} aria-hidden />}
          >
            <CategoryList
              categories={grouped.technology}
              selectedId={selection?.categoryId ?? null}
              onSelect={handleSelect}
              emptyLabel="Sin tecnologías"
            />
          </AccordionItem>
        </Accordion>
      )}
    </nav>
  );
}

interface CategoryListProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (category: Category) => void;
  emptyLabel: string;
}

function CategoryList({ categories, selectedId, onSelect, emptyLabel }: Readonly<CategoryListProps>) {
  if (categories.length === 0) {
    return <p className="px-2 py-1 text-sm text-default-400">{emptyLabel}</p>;
  }
  return (
    <Listbox aria-label="Lista de categorías" selectionMode="none" variant="flat">
      {categories.map((category) => {
        const isSelected = selectedId === category.id;
        return (
          <ListboxItem
            key={category.id}
            textValue={category.name}
            onPress={() => onSelect(category)}
            startContent={<CategoryIcon icon={category.icon} size={18} />}
            className={
              isSelected
                ? 'bg-primary/15 font-medium text-primary data-[hover=true]:bg-primary/20'
                : 'text-default-600'
            }
          >
            {category.name}
          </ListboxItem>
        );
      })}
    </Listbox>
  );
}
