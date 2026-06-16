import { useState } from 'react';
import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from '@heroui/react';
import { Outlet } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SearchContext } from '@/context/SearchContext';

/**
 * Two-column public shell: header on top, static sidebar (desktop) / drawer
 * (mobile) on the left, routed content on the right. The debounced search term
 * is shared with child routes via SearchContext.
 */
export function PublicLayout() {
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

  return (
    <SearchContext.Provider value={debouncedSearch}>
      <div className="flex h-dvh flex-col">
        <Header search={search} onSearchChange={setSearch} onOpenSidebar={() => setDrawerOpen(true)} />

        <div className="flex min-h-0 flex-1">
          {/* Static sidebar (desktop) */}
          <aside className="hidden w-65 shrink-0 overflow-y-auto border-r border-divider bg-content1/40 md:block">
            <Sidebar />
          </aside>

          {/* Mobile drawer */}
          <Drawer isOpen={drawerOpen} placement="left" onOpenChange={setDrawerOpen} size="xs">
            <DrawerContent>
              <DrawerHeader>Categorías</DrawerHeader>
              <DrawerBody>
                <Sidebar onNavigate={() => setDrawerOpen(false)} />
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SearchContext.Provider>
  );
}
