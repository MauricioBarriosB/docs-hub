# docs-hub — Frontend (React 19 + TypeScript + HeroUI)

Single-page app for the docs-hub document repository. Read the root
[../CLAUDE.md](../CLAUDE.md) first for product spec, roles, and the shared API contract.

> Use the **senior-react-developer** subagent for work in this directory.

## Stack

- **React 19** + **TypeScript** (strict).
- **Vite** as the build tool/dev server.
- **HeroUI** (`@heroui/react` v2.8) for all UI components — **required**. HeroUI 2.8.x
  requires **Tailwind CSS v4** (its `@heroui/theme` peer is `tailwindcss >=4.0.0`) plus
  `framer-motion` and the `HeroUIProvider` at the app root. **Do NOT use Tailwind v3** — the
  `heroui()` plugin emits no styles under v3 and every component renders unstyled.
  Tailwind v4 is wired the CSS-first way (no `tailwind.config.js` / `postcss.config.js`):
  - `@tailwindcss/vite` plugin in `vite.config.ts`.
  - `src/styles/globals.css`: `@import "tailwindcss";` + `@plugin "../../hero.ts";` +
    `@source "../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}";` +
    `@custom-variant dark (&:is(.dark *));`.
  - `hero.ts` at the frontend root: `import {heroui} from '@heroui/react'; export default heroui();`.
  - Dark/light via the `.dark` class on `<html>` (ThemeContext toggles it).
- **TanStack Query** (`@tanstack/react-query`) for data fetching + the infinite-scroll
  pagination (`useInfiniteQuery`).
- **React Router** for routing (public site + `/admin/*`).
- Console commands are **Git Bash** (no PowerShell).

## Layout (match the SnippetsApp reference / image.png)

A two-column shell: fixed sidebar on the left, header + scrollable content on the right.

### Header
- Document **search** input (debounced; drives the documents query).
- **Login** button, **Register** button (open HeroUI modals or routed pages).
- **Theme toggle** (dark ⇄ light), persisted in `localStorage`.

### Sidebar (static, responsive)
- Two expandable accordion menus: **Languages** and **Technologies**, populated from
  `GET /api/categories`.
- The selected category/language **persists in `localStorage`** and is **restored on
  reload** so the user's selection survives a refresh.
- Collapses to a drawer/sheet on small screens (HeroUI `Drawer`/`Navbar` menu).

### Main content
- Responsive **card grid: 3 columns**, showing **12 cards** initially.
- **Infinite scroll**: when more than 12 results exist, fetch the next page on scroll
  (IntersectionObserver sentinel + `useInfiniteQuery`).
- Each **card** (HeroUI `Card`) shows: document **name/title**, **category tags**
  (language and/or technology chips), **author**, and a **button linking directly to the
  document** (`/api/documents/:id/download`).
- Breadcrumb header like the reference ("Resultados por búsqueda o categoría").

## Admin panel (`/admin`)

Build all pages/components for a senior-grade admin experience:
- **Moderation queue** — list `pending` documents, preview metadata, **Approve** / **Reject
  (with reason)** actions.
- **Documents management** — list/filter all docs by status, delete.
- **Categories management** — CRUD for languages & technologies (name, slug, type, icon).
- **Users management** — list, toggle active, change role, soft delete.
- Guard all admin routes behind an auth+role check; redirect non-admins.

## Auth & API integration

- Central typed API client (`src/api/`) using `fetch`/`axios` with an interceptor that
  attaches `Authorization: Bearer <accessToken>` and handles **401 → refresh-token retry**,
  matching the backend's refresh flow.
- Store tokens securely; keep auth state in a context/store. Public browsing/downloading
  works with **no token**.
- Honor the shared response shape: read `data` on success, surface `userMessage` on error.
- Upload uses `multipart/form-data` (title, description, category ids, file). After upload,
  show the user that the document is **pending admin approval**.

## Project structure (target)

```
frontend/
├── index.html
├── vite.config.ts            (react + @tailwindcss/vite plugins)
├── hero.ts                   (HeroUI Tailwind v4 plugin entry — exports heroui())
├── tsconfig.json
├── .env                      (VITE_API_BASE_URL, …)
└── src/
    ├── main.tsx              (HeroUIProvider, QueryClientProvider, Router, ThemeProvider)
    ├── api/                  (client, endpoints, typed DTOs matching the data model)
    ├── hooks/                (useDocuments infinite query, usePersistedFilter, useAuth, …)
    ├── stores/ or context/   (auth, theme, sidebar selection)
    ├── components/           (Header, Sidebar, DocumentCard, DocumentGrid, ThemeToggle, …)
    ├── pages/                (Home, Login, Register, MyUploads)
    └── pages/admin/          (Dashboard, ModerationQueue, Documents, Categories, Users)
```

## Conventions

- TypeScript strict; explicit prop types; no `any` (use generated DTO types that mirror the
  backend camelCase fields).
- Prefer HeroUI components over hand-rolled ones; theme via Tailwind tokens, not inline color.
- Persisted UI state (theme, sidebar selection) goes through a small `localStorage` helper
  with a versioned key, restored on mount.
- Keep components focused; data fetching in hooks, presentation in components.

## Running (Git Bash)

```bash
cd /c/wamp64/www/docs-hub/frontend
npm install
npm run dev        # Vite dev server
```
Set `VITE_API_BASE_URL` to the backend (e.g. `http://localhost:8080`).
