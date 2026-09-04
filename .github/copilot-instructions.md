# PrioQueue — Copilot Workspace Instructions

## Project Overview

A **Progressive Web App (PWA)** called **PrioQueue** — *Handle your tasks based on priority not on noise* — built with Angular. There is **no backend** — all data is stored entirely in the browser using IndexedDB (via Dexie.js). The app adapts its layout:
- **Mobile browsers (`≤ 720px`):** feels like a native mobile app — bottom tab navigation, full-screen cards, touch-friendly tap targets
- **Desktop browsers (`> 720px`):** feels like a standard web app — 236px left rail sidebar, wider content area, hover states

## UI Design Mockups — Always Refer to These

All UI must match the approved mockups in the `mockups/` folder:

| File | Covers |
|---|---|
| [`mockups/Matrix_Mockup.jpg`](../../mockups/Matrix_Mockup.jpg) | Eisenhower Matrix quadrant names and layout reference |
| [`mockups/01-home-em-tasks.html`](../../mockups/01-home-em-tasks.html) | Home (Today), Eisenhower Matrix view, Tasks list — desktop **and** mobile |
| [`mockups/02-add-edit-task.html`](../../mockups/02-add-edit-task.html) | Add Task / Edit Task form, category popup, delete confirmation — desktop **and** mobile |
| [`mockups/03-profile-settings.html`](../../mockups/03-profile-settings.html) | Profile management, Settings — desktop **and** mobile |

Open the HTML files directly in a browser to see the interactive mockup. Each file contains both desktop and mobile layouts — **resize the browser window below 720px to see the mobile view**.

### Design System (extracted from mockups)

```css
/* CSS custom properties — define in global styles, use everywhere */
--bg: #12141a;            /* page/app background */
--surface: #181b23;       /* card, sidebar, modal surface */
--surface-2: #20242f;     /* input background, secondary surface */
--surface-3: #282d3a;     /* hover state, tertiary surface */
--border: #2e3341;        /* default border */
--text: #edeef3;          /* primary text */
--text-dim: #9095a8;      /* secondary/muted text */
--text-faint: #5c6175;    /* placeholder, meta text */
--brass: #c9a15a;         /* primary accent — active nav, CTAs */
--brass-soft: rgba(201,161,90,0.14); /* accent background tint */

/* Eisenhower quadrant colors */
--do: #dd5b45;            /* Do it now     — urgent + important */
--decide: #4f8fe0;        /* Schedule      — less urgent + important */
--delegate: #e0b84f;      /* Delegate      — urgent + less important */
--delete: #7c8194;        /* Drop altogether — less urgent + less important */
```

### Typography (from mockups)
- **Headings / brand name:** `Fraunces` (serif, Google Fonts)
- **Body / UI text:** `Inter` (sans-serif, Google Fonts)
- **Labels / meta / mono data:** `IBM Plex Mono` (Google Fonts)

### Routes (match mockup navigation)
| Path | Feature |
|---|---|
| `/today` | Home / Today view |
| `/matrix` | Eisenhower Matrix |
| `/tasks` | Full task list |
| `/profile` | Profile & Settings |

## Tech Stack

| Concern | Tool |
|---|---|
| Framework | Angular 19+ (standalone components, Signals) |
| Styling | Tailwind CSS v4 |
| Storage | Dexie.js v4 (IndexedDB) |
| PWA | `@angular/pwa` + Service Worker |
| Routing | Angular Router (lazy `loadComponent`) |
| Icons | Lucide Angular |
| Build | Angular CLI |

## Folder Structure

```
src/
  app/
    core/
      db/            # Dexie database class + table type definitions
      services/      # App-wide services: StorageService, ExportImportService, PwaService
    features/        # One folder per feature
      tasks/
        components/
        services/
        models/
    layout/          # AppShellComponent, BottomNavComponent, SidebarNavComponent
    shared/          # Reusable components, pipes, directives, utils
  assets/
  manifest.webmanifest
```

## Core Principles — Always Follow These

1. **No backend, ever.** Never generate `HttpClient`, API calls, server routes, or backend logic.
2. **Standalone components only.** Never use `NgModule`. Every component, directive, and pipe must have `standalone: true`.
3. **Signals over RxJS for state.** Use `signal()`, `computed()`, `effect()` for local and shared state. Use RxJS only for Dexie `liveQuery` streams (wrap with `from()` → `toSignal()`).
4. **Dexie.js only for data.** Never use `localStorage` or `sessionStorage` for app data. Dexie handles all reads and writes.
5. **Export/Import on every entity.** Every data feature must support JSON export (download) and JSON import (upload with merge/replace option).
6. **Request persistent storage on first launch.** Call `navigator.storage.persist()` during app initialization.
7. **PWA-first.** All features must work offline. No network-dependent logic.
- **Mobile-first responsive.** Write base styles for mobile (`≤ 720px`), override for desktop with Tailwind's `md:` prefix (`> 768px`) or custom `@media (min-width: 721px)` where needed. See mockups.
9. **`OnPush` change detection** on all components. Use signals to trigger updates.
10. **Inject with `inject()`**, not constructor parameters.

## What Copilot Must NOT Generate

- `HttpClient`, `HttpClientModule`, `provideHttpClient`
- `NgModule`, `@NgModule`, `declarations`, `imports` arrays in modules
- Direct `localStorage.setItem` / `localStorage.getItem` calls for app data
- Server-side rendering (SSR) — this is a pure client-side SPA
- Backend frameworks (Express, NestJS, Prisma, Supabase, Firebase)
- Constructor-based dependency injection (`constructor(private svc: MyService)`)
- `@Input()` decorator — use `input()` signal instead
- `@Output() EventEmitter` — use `output()` instead

## Data Safety Rules

- All user data lives in IndexedDB (`PrioQueueDB` Dexie database)
- Persistent storage must be requested: `navigator.storage.persist()`
- Every feature page must have an accessible **Export as JSON** and **Import from JSON** button in Settings or within the feature itself
- Import must use `bulkPut` (merge/upsert), never `bulkAdd` (which fails on duplicates)
- Export filename format: `prioqueue-{entity}-{YYYY-MM-DD}.json`

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Component | `PascalCase` + `Component` suffix | `TaskListComponent` |
| Service | `PascalCase` + `Service` suffix | `TaskService` |
| Interface/Model | `PascalCase`, no prefix | `Task`, `TaskStatus` |
| Signal | camelCase noun | `tasks`, `isLoading`, `selectedTask` |
| Computed | camelCase, describes the derived value | `completedCount`, `filteredTasks` |
| DB table | plural camelCase | `tasks`, `categories` |
| Route path | kebab-case | `/tasks`, `/settings` |
