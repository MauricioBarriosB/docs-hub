import { useState } from 'react';
import { Autocomplete, AutocompleteItem } from '@heroui/react';
import { toUserMessage } from '@/api/client';
import type { DownloadLogItem } from '@/api/types';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { ADMIN_DOWNLOADS_PAGE_SIZE, useAdminDownloads } from '@/hooks/useAdminDownloads';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDate } from '@/lib/format';
import { SearchIcon } from '@/components/icons';
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/admin/DataTable';

/** Admin view of the per-user download log, filterable by user. */
export function AdminDownloads() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);
  const [sort, setSort] = useState<DataTableSort | null>(null);

  // User search box: query users on demand (debounced) so the filter isn't
  // capped at the first page of users like the old Select was.
  const [userSearchInput, setUserSearchInput] = useState('');
  const userSearch = useDebouncedValue(userSearchInput, 300);
  const { data: usersData, isFetching: usersFetching } = useAdminUsers({
    offset: 0,
    search: userSearch,
  });
  const users = usersData?.users ?? [];

  const { data, isLoading, isError, error, isFetching } = useAdminDownloads({ page, userId, sort });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_DOWNLOADS_PAGE_SIZE));

  function handleUserSelect(key: number | null) {
    setUserId(key);
    setPage(1);
  }

  const columns: DataTableColumn<DownloadLogItem>[] = [
    {
      key: 'downloadedAt',
      label: 'FECHA',
      allowsSorting: true,
      sortField: 'downloaded_at',
      className: 'whitespace-nowrap text-sm text-default-600',
      render: (row) => formatDate(row.downloadedAt),
    },
    {
      key: 'user',
      label: 'USUARIO',
      allowsSorting: true,
      sortField: 'user',
      className: 'text-sm',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.userName ?? `#${row.userId}`}</span>
          {row.userEmail && <span className="text-xs text-default-400">{row.userEmail}</span>}
        </div>
      ),
    },
    {
      key: 'document',
      label: 'DOCUMENTO',
      allowsSorting: true,
      sortField: 'document',
      className: 'text-sm',
      render: (row) => row.documentTitle ?? `#${row.documentId}`,
    },
    {
      key: 'ip',
      label: 'IP',
      className: 'text-xs text-default-400',
      render: (row) => row.ip ?? '—',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Registro de descargas"
        title={
          <div>
            <h2 className="text-lg font-semibold">Documentos descargados</h2>
          </div>
        }
        columns={columns}
        items={items}
        getRowKey={(row) => row.id}
        isLoading={isLoading}
        isFetching={isFetching}
        errorMessage={isError ? toUserMessage(error) : null}
        emptyContent="Sin descargas registradas."
        isStriped
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        pagination={{ page, totalPages, onChange: setPage }}
        toolbar={
          <Autocomplete
            aria-label="Buscar usuario"
            placeholder="Buscar usuario por nombre/correo"
            className="w-full sm:max-w-xs"
            startContent={<SearchIcon size={16} className="text-default-400" />}
            items={users}
            isLoading={usersFetching}
            selectedKey={userId !== null ? String(userId) : null}
            onInputChange={setUserSearchInput}
            onSelectionChange={(key) => handleUserSelect(key == null ? null : Number(key))}
            allowsCustomValue={false}
          >
            {(user) => (
              <AutocompleteItem key={String(user.id)} textValue={`${user.name} (${user.email})`}>
                <div className="flex flex-col">
                  <span className="text-sm">{user.name}</span>
                  <span className="text-xs text-default-400">{user.email}</span>
                </div>
              </AutocompleteItem>
            )}
          </Autocomplete>
        }
      />
    </div>
  );
}
