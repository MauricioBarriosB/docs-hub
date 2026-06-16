import { Button } from '@heroui/react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin/moderation', label: 'Cola de moderación' },
  { to: '/admin/documents', label: 'Documentos' },
  { to: '/admin/categories', label: 'Categorías' },
  { to: '/admin/users', label: 'Usuarios' },
] as const;

/** Admin shell: left nav + routed admin page. Full features land later. */
export function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-divider px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Panel de administración</h1>
          <p className="text-xs text-default-500">Conectado como {user?.name}</p>
        </div>
        <Button variant="flat" onPress={() => navigate('/')}>
          Volver al sitio
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-60 shrink-0 border-r border-divider p-3">
          <nav aria-label="Navegación de administración">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      `block rounded-medium px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-default-700 hover:bg-default-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
