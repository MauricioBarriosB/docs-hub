# Docs-Hub

Single-page application for the **docs-hub** document repository: a place where registered
users upload documents, an administrator moderates every submission, and anyone (login required) can browse, 
search and download the documents that have been **published**.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| UI library | **React 19** + **TypeScript** (strict) |
| Build tool / dev server | **Vite** |
| Data fetching / caching | **TanStack Query** (`@tanstack/react-query`) |
| Routing | **React Router** v7 |
| HTTP client | **axios** (typed wrapper with interceptors) |
| Icons | **@iconify/react** + a few inline SVG icons |

> Tailwind is wired the v4 CSS-first way (no `tailwind.config.js` / `postcss.config.js`):
> the `@tailwindcss/vite` plugin in `vite.config.ts`, plus `@import`, `@plugin` and
> `@source` directives in `src/styles/globals.css`.

---

## Key features

### Public site (no authentication)
- **Document card grid** — responsive layout (3 columns on desktop) showing each document's
  title, category chips (languages + technologies), uploader name and publication date.
- **Infinite scroll** — the first page loads 12 cards; more are fetched automatically as you
  scroll, via an `IntersectionObserver` sentinel backed by TanStack Query's
  `useInfiniteQuery`.
- **Debounced search** — a header search box filters documents by title, description, or
  category name; the query is debounced to avoid hammering the API.
- **Category sidebar** — two expandable accordion menus, **Languages** and **Technologies**,
  populated from the API. The current selection **persists in `localStorage`** and is
  restored on reload. Collapses to a drawer on small screens.
- **Light / dark theme toggle** — persisted in `localStorage` and applied via a `.dark`
  class on `<html>`.

### Authentication
- **Login / Register** as both standalone pages and a global modal.
- **JWT access + refresh** flow: the API client attaches `Authorization: Bearer <token>` and
  transparently performs a single refresh-token retry on a `401`, then replays the request.
- Auth state lives in a React context; tokens are kept in a small token store and mirrored to
  `localStorage` so a refresh survives reloads.

### Registered-user features
- **Upload** (`multipart/form-data`): title, description, one or more categories, and a file.
  After upload the user is told the document is **pending admin approval**.
- **My uploads** — the user's own documents with their moderation status
  (`pending` / `published` / `rejected`, including the rejection reason).
- **Document detail page** (`/documents/:id`) — a dedicated view with the full metadata and a
  download button. **Login is required** to open it; anonymous users are redirected to the
  login page and returned to the document after signing in.

### Admin panel (`/admin`, role-guarded)
- **Moderation queue** — list pending documents and **approve** / **reject (with reason)**.
- **Documents management** — list, filter by status, edit, delete.
- **Categories management** — CRUD for languages & technologies (name, slug, type, icon).
- **Users management** — list, toggle active, change role, soft delete.
- All admin routes sit behind an auth **and** role check; non-admins are redirected.

### Security on the client
- ⚠️ HMAC request signing — every `/api` request is signed (`X-Client-Id`, `X-Timestamp`,
  `X-Nonce`, `X-Signature`) to match the backend's client-auth filter. This runs for
  anonymous/public requests too.
- Downloads go through an **authenticated, signed blob request** (not a bare `<a href>`),
  because the backend rejects unsigned download URLs.

---

## Project structure

```
frontend/
├── index.html                 # app shell (single #root mount point)
├── vite.config.ts             # React + Tailwind v4 plugins, vendor chunking, base path
├── tsconfig.json
├── .env                       # VITE_API_BASE_URL, HMAC client id/secret, mocks flag
└── src/
    ├── main.tsx               # providers: HeroUI, Query, Router, Theme, Auth, Sidebar
    ├── App.tsx                # route table (public + /admin)
    ├── api/                   # typed axios client, signing, token store, DTOs, endpoints
    ├── components/            # Header, Sidebar, DocumentCard, DocumentGrid, guards, admin/
    ├── context/               # auth, theme, sidebar selection, search, auth-modal
    ├── hooks/                 # useDocuments, useDocument, useCategories, infinite scroll…
    ├── lib/                   # storage, toast, formatting helpers
    ├── pages/                 # Home, DocumentDetail, Login, Register, Upload, MyUploads…
    └── pages/admin/           # AdminLayout, ModerationQueue, Documents, Categories, Users
```

### Notable modules
- `src/api/client.ts` — the axios instance: base URL + `/api` prefix, bearer token
  injection, HMAC signing interceptor, `401 → refresh → replay`, and typed `ApiError` /
  `NetworkError`. Exposes `apiClient`, `downloadDocument()` and `toUserMessage()`.
- `src/api/types.ts` — DTOs that mirror the backend's camelCase JSON (`DocumentListItem`,
  `DocumentItem`, `Category`, `User`, response envelopes, auth payloads).
- `src/config/env.ts` — the single typed entry point for `import.meta.env`.

---

## Environment variables

Create a `.env` (or `.env.local`) in this directory. All client-exposed vars must be
prefixed with `VITE_`.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | yes (prod) | Backend origin, **no** trailing slash, **no** `/api` suffix — e.g. `http://localhost:8080`. Falls back to `http://localhost:8080` when unset. |
| `VITE_API_CLIENT_ID` | recommended | HMAC client identifier sent as `X-Client-Id`.|
| `VITE_API_CLIENT_SECRET` | recommended | Shared HMAC key; **must match the backend byte-for-byte**. |
| `VITE_USE_MOCKS` | no | `true` serves bundled mock data when the API is unreachable (dev convenience only). |

---

## Getting started

> Console commands assume **Git Bash** (the project standard); use forward slashes and
> `$VAR`. The dev server is pinned to port **5173** so its origin matches the backend's
> CORS allow-list (`strictPort` makes Vite fail loudly if 5173 is taken rather than drifting
> to 5174, whose origin the API would reject).

```bash
cd /c/wamp64/www/docs-hub/frontend

# install dependencies
npm install

# start the dev server (http://localhost:5173)
npm run dev
```

Make sure the backend is running and reachable at whatever `VITE_API_BASE_URL` points to.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/`. |
| `npm run preview` | Serve the production build locally for a smoke test. |
| `npm run typecheck` | Run `tsc --noEmit` (types only, no build). |

---

## Backend contract (summary)

The SPA expects the JSON shapes defined by the backend. Quick reference:

- **Base path** `/api`; JSON in, JSON out.
- **Success**: `{ "success": true, "message"?, "data"? }`
- **Error**: `{ "error": true, "code", "message", "userMessage", "timestamp" }` —
  `userMessage` is safe to display to end users.
- **Auth**: `Authorization: Bearer <accessToken>` (JWT, HS256) with a refresh-token flow.
- **Public, no-auth** endpoints: listing/searching/downloading **published** documents and
  listing categories. Everything that mutates or exposes private data is filtered.
- The public listing (`GET /api/documents`) returns a **compact** item shape
  (`DocumentListItem`); the full metadata is fetched per document via
  `GET /api/documents/:id` (`DocumentItem`) on the detail page.

See `backend/CLAUDE.md` for the authoritative data model and full API surface.

---

## Deployment (GitHub Pages)

The app is deployed to GitHub Pages via the workflow in `.github/workflows/deploy.yml`
(build with Vite → upload artifact → deploy).

Because Pages serves the project under a sub-path (`https://<user>.github.io/docs-hub/`),
the **production build** sets Vite's `base` to `/docs-hub/`, while the dev server stays at
`/`. React Router reads this through `import.meta.env.BASE_URL` as its `basename`, so the
same code works in both contexts.

For the deployed site to reach the API:
- Set the build-time secrets (`VITE_API_BASE_URL`, `VITE_API_CLIENT_ID`,
  `VITE_API_CLIENT_SECRET`) in the repository settings.
- The API must be served over **HTTPS** (Pages is HTTPS — mixed content is blocked).
- The backend **CORS allow-list** must include the Pages origin
  `https://<user>.github.io` (origin is scheme + host only — no `/docs-hub/` path).

---

## Conventions

- TypeScript strict; explicit prop types; no `any` — components consume the generated DTO
  types that mirror the backend's camelCase fields.
- Prefer HeroUI components over hand-rolled ones; theme via Tailwind tokens, not inline color.
- Data fetching lives in hooks; presentation lives in components.
- Persisted UI state (theme, sidebar selection) goes through a small `localStorage` helper
  with versioned keys and is restored on mount.
