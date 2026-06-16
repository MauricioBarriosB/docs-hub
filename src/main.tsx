import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useHref, useNavigate } from 'react-router-dom';
import { App } from './App';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { SidebarSelectionProvider } from '@/context/SidebarSelectionContext';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * HeroUIProvider needs router navigation wired so its `as`/`href` components use
 * client-side navigation. It must therefore live *inside* BrowserRouter.
 */
function Providers() {
  const navigate = useNavigate();
  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      {/* Global toast outlet for success/error feedback (admin actions, etc.). */}
      <ToastProvider placement="top-right" toastProps={{ timeout: 4000 }} />
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthModalProvider>
              <SidebarSelectionProvider>
                <App />
              </SidebarSelectionProvider>
            </AuthModalProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HeroUIProvider>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

// Vite injects BASE_URL from `base` ('/docs-hub/'); React Router wants the
// basename without a trailing slash ('' === root).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <Providers />
    </BrowserRouter>
  </StrictMode>,
);
