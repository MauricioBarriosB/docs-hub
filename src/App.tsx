import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/PublicLayout';
import { AuthModal } from '@/components/auth/AuthModal';
import { RequireAuth } from '@/components/guards/RequireAuth';
import { RequireAdmin } from '@/components/guards/RequireAdmin';
import { Home } from '@/pages/Home';
import { DocumentDetail } from '@/pages/DocumentDetail';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Upload } from '@/pages/Upload';
import { MyUploads } from '@/pages/MyUploads';
import { NotFound } from '@/pages/NotFound';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { ModerationQueue } from '@/pages/admin/ModerationQueue';
import { AdminDocuments } from '@/pages/admin/AdminDocuments';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminUsers } from '@/pages/admin/AdminUsers';

export function App() {
  return (
    <>
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
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global auth modal, available from any public route. */}
      <AuthModal />
    </>
  );
}
