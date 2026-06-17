import { useMemo, useState, type Key, type ReactNode } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type SortDescriptor,
} from '@heroui/react';
import { SearchIcon } from '@/components/icons';

export type SortDirection = 'asc' | 'desc';

export interface DataTableSort {
  /** Server sort token (or client sortField). */
  field: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  /** Unique column id, also the HeroUI column uid / sortDescriptor.column. */
  key: string;
  label: string;
  align?: 'start' | 'center' | 'end';
  allowsSorting?: boolean;
  /** Server sort token; defaults to `key`. In client mode, the accessor key. */
  sortField?: string;
  /** Client-mode comparison value for this column. */
  sortAccessor?: (item: T) => string | number | null;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface DataTableSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export interface DataTableClientPaging<T> {
  pageSize: number;
  /** Optional case-insensitive global filter applied to each item against the search query. */
  globalFilter?: (item: T, query: string) => boolean;
}

export interface DataTableProps<T> {
  'aria-label': string;
  columns: DataTableColumn<T>[];
  items: T[];
  getRowKey: (item: T) => Key;
  isLoading?: boolean;
  /** Shows a small Spinner next to the title while refetching. */
  isFetching?: boolean;
  errorMessage?: string | null;
  emptyContent?: ReactNode;
  title?: ReactNode;
  /** e.g. a "Nuevo usuario" button. */
  headerActions?: ReactNode;
  /** Extra filters (status/user Select) rendered in the header toolbar. */
  toolbar?: ReactNode;
  /** Arbitrary content rendered above the table inside the body. */
  beforeTable?: ReactNode;
  search?: DataTableSearch;
  isStriped?: boolean;

  /* server mode (all controlled) */
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort) => void;
  pagination?: DataTablePagination;

  /* client mode */
  clientPaging?: DataTableClientPaging<T>;
}

const ROWS_PER_LOADING = 'Cargando…';

function toSortDescriptor(sort: DataTableSort | null | undefined): SortDescriptor | undefined {
  if (!sort) return undefined;
  return {
    column: sort.field,
    direction: sort.direction === 'asc' ? 'ascending' : 'descending',
  };
}

/**
 * Generic, presentational admin table wrapping HeroUI `Table`.
 *
 * - **server mode**: parent passes already-fetched `items`, controlled `search`,
 *   `sort`, and `pagination`; this component only renders and emits callbacks.
 * - **client mode** (`clientPaging` set): the full list is filtered, sorted, and
 *   paginated internally.
 *
 * It has no knowledge of users/documents/etc. — columns supply all rendering.
 */
export function DataTable<T>(props: Readonly<DataTableProps<T>>) {
  const {
    columns,
    items,
    getRowKey,
    isLoading = false,
    isFetching = false,
    errorMessage,
    emptyContent = 'No hay resultados.',
    title,
    headerActions,
    toolbar,
    beforeTable,
    search,
    isStriped = false,
    sort = null,
    onSortChange,
    pagination,
    clientPaging,
  } = props;

  const ariaLabel = props['aria-label'];

  // Internal page for client mode only.
  const [clientPage, setClientPage] = useState(1);

  const columnByKey = useMemo(() => {
    const map = new Map<string, DataTableColumn<T>>();
    for (const column of columns) map.set(column.key, column);
    return map;
  }, [columns]);

  /* ----------------------------- client mode ----------------------------- */
  const clientResult = useMemo(() => {
    if (!clientPaging) return null;
    const query = (search?.value ?? '').trim().toLowerCase();

    let rows = items;
    if (query && clientPaging.globalFilter) {
      rows = rows.filter((item) => clientPaging.globalFilter!(item, query));
    }

    if (sort) {
      const column = columns.find((c) => (c.sortField ?? c.key) === sort.field);
      const accessor = column?.sortAccessor;
      if (accessor) {
        const factor = sort.direction === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) => {
          const av = accessor(a);
          const bv = accessor(b);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === 'number' && typeof bv === 'number') {
            return (av - bv) * factor;
          }
          return String(av).localeCompare(String(bv)) * factor;
        });
      }
    }

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / clientPaging.pageSize));
    const page = Math.min(clientPage, totalPages);
    const start = (page - 1) * clientPaging.pageSize;
    const pageRows = rows.slice(start, start + clientPaging.pageSize);
    return { pageRows, totalPages, page };
  }, [clientPaging, items, search?.value, sort, columns, clientPage]);

  const rows = clientResult ? clientResult.pageRows : items;

  /* ------------------------------ sorting -------------------------------- */
  const sortDescriptor = toSortDescriptor(sort);

  function handleSortChange(descriptor: SortDescriptor) {
    const column = columnByKey.get(String(descriptor.column));
    const field = column?.sortField ?? String(descriptor.column);
    const direction: SortDirection = descriptor.direction === 'ascending' ? 'asc' : 'desc';
    const next: DataTableSort = { field, direction };
    if (clientPaging) {
      setClientPage(1);
    }
    onSortChange?.(next);
  }

  /* ----------------------------- pagination ------------------------------ */
  let bottomContent: ReactNode = null;
  if (clientPaging && clientResult) {
    if (clientResult.totalPages > 1) {
      bottomContent = (
        <div className="flex justify-center">
          <Pagination
            showControls
            page={clientResult.page}
            total={clientResult.totalPages}
            onChange={setClientPage}
          />
        </div>
      );
    }
  } else if (pagination && pagination.totalPages > 1) {
    bottomContent = (
      <div className="flex justify-center">
        <Pagination
          showControls
          page={pagination.page}
          total={pagination.totalPages}
          onChange={pagination.onChange}
        />
      </div>
    );
  }

  const resolvedEmpty: ReactNode = errorMessage ? errorMessage : emptyContent;

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {title}
          {isFetching && <Spinner size="sm" aria-label="Actualizando" />}
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {search && (
            <Input
              aria-label={search.placeholder ?? 'Buscar'}
              placeholder={search.placeholder}
              value={search.value}
              onValueChange={(value) => {
                search.onChange(value);
                if (clientPaging) setClientPage(1);
              }}
              startContent={<SearchIcon size={16} className="text-default-400" />}
              className="w-full sm:max-w-xs"
              isClearable
              onClear={() => {
                search.onChange('');
                if (clientPaging) setClientPage(1);
              }}
            />
          )}
          {toolbar}
          {headerActions}
        </div>
      </CardHeader>
      <CardBody className="gap-2">
        {beforeTable}
        {/* Scope horizontal overflow to the table itself so a wide table
            doesn't trigger a page-level horizontal scrollbar. The pagination
            is rendered outside this scroll area so it stays centered/fixed. */}
        <div className="overflow-x-auto">
          <Table
            aria-label={ariaLabel}
            removeWrapper
            isStriped={isStriped}
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  align={column.align}
                  allowsSorting={column.allowsSorting}
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={rows}
              isLoading={isLoading}
              loadingContent={<Spinner label={ROWS_PER_LOADING} />}
              emptyContent={resolvedEmpty}
            >
              {(item) => (
                <TableRow key={getRowKey(item)}>
                  {(columnKey) => {
                    const column = columnByKey.get(String(columnKey));
                    return (
                      <TableCell className={column?.className}>
                        {column ? column.render(item) : null}
                      </TableCell>
                    );
                  }}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {bottomContent}
      </CardBody>
    </Card>
  );
}
