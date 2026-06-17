import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@heroui/react';
import { PublicLayout } from '@/components/PublicLayout';
import { AuthModal } from '@/components/auth/AuthModal';
import { RequireAuth } from '@/components/guards/RequireAuth';
import { RequireAdmin } from '@/components/guards/RequireAdmin';
// Public pages load eagerly (entry points / first paint).
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';

// Non-public pages (auth/admin guarded) are code-split and loaded on demand.
// The named exports are mapped to `default` so React.lazy can consume them.
const DocumentDetail = lazy(() =>
  import('@/pages/DocumentDetail').then((m) => ({ default: m.DocumentDetail })),
);
const Upload = lazy(() => import('@/pages/Upload').then((m) => ({ default: m.Upload })));
const MyUploads = lazy(() => import('@/pages/MyUploads').then((m) => ({ default: m.MyUploads })));
const AdminLayout = lazy(() =>
  import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const ModerationQueue = lazy(() =>
  import('@/pages/admin/ModerationQueue').then((m) => ({ default: m.ModerationQueue })),
);
const AdminDocuments = lazy(() =>
  import('@/pages/admin/AdminDocuments').then((m) => ({ default: m.AdminDocuments })),
);
const AdminCategories = lazy(() =>
  import('@/pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })),
);
const AdminUsers = lazy(() =>
  import('@/pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })),
);
const AdminDownloads = lazy(() =>
  import('@/pages/admin/AdminDownloads').then((m) => ({ default: m.AdminDownloads })),
);

/** Fallback shown while a lazily-loaded page chunk is being fetched. */
function PageFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <Spinner label="Cargando…" />
    </div>
  );
}

export function App() {
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
        {/* Standalone auth pages (no sidebar/header) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public site */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route
            path="documents/:id"
            element={
              <RequireAuth>
                <DocumentDetail />
              </RequireAuth>
            }
          />
          <Route
            path="upload"
            element={
              <RequireAuth>
                <Upload />
              </RequireAuth>
            }
          />
          <Route
            path="my-uploads"
            element={
              <RequireAuth>
                <MyUploads />
              </RequireAuth>
            }
          />
        </Route>

        {/* Admin shell (auth + role guarded) */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="moderation" replace />} />
          <Route path="moderation" element={<ModerationQueue />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="downloads" element={<AdminDownloads />} />
        </Route>

        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* Global auth modal, available from any public route. */}
      <AuthModal />
    </>
  );
}
