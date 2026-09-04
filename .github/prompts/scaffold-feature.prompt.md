---
mode: agent
description: Scaffold a complete new feature (route, model, service, list component, detail component)
---

Scaffold a complete new feature called **`${input:featureName}`** (e.g. "projects", "habits", "notes") for the PrioQueue Angular PWA.

Follow ALL rules in `.github/copilot-instructions.md` and the scoped instruction files in `.github/instructions/`.

**UI reference:** Before generating any template HTML, open the relevant mockup file in a browser (`mockups/01-home-em-tasks.html` for list views, `mockups/02-add-edit-task.html` for forms, `mockups/03-profile-settings.html` for settings). Match colors, spacing, font families, and component patterns exactly — especially the dark theme CSS variables (`--bg`, `--surface`, `--brass`, etc.) and the `Fraunces` / `Inter` / `IBM Plex Mono` font stack.

## What to generate

### 1. Model (`src/app/features/${featureName}/models/${featureName}.model.ts`)
- Define a TypeScript interface for the entity with appropriate fields
- Include `id?: number` (Dexie auto-increment), `createdAt: number`, `updatedAt: number`

### 2. Database table
- Add the new table to `src/app/core/db/app-db.ts`
- Bump the Dexie version number
- Index the most commonly queried fields

### 3. Service (`src/app/features/${featureName}/services/${featureName}.service.ts`)
- `providedIn: 'root'`
- Expose a reactive `items` signal via `toSignal(from(liveQuery(...)))`
- Implement `add()`, `update()`, `delete()`, `exportAsJson()`, `importFromJson(file: File)`
- `exportAsJson()` filename: `prioqueue-${featureName}-YYYY-MM-DD.json`
- `importFromJson()` uses `bulkPut` (upsert, never bulkAdd)

### 4. List component (`src/app/features/${featureName}/components/${featureName}-list.component.ts`)
- Standalone, `OnPush`
- Displays all items from the service signal
- Has an **Add** button (opens inline form or navigates to detail)
- Has **Export** and **Import** buttons (top-right area)
- Mobile-first layout: card per item on mobile, denser list on desktop (`md:` prefix)
- Shows empty state when list is empty

### 5. Route
- Add a lazy `loadComponent` route to `src/app/app.routes.ts`
- Path: `/${featureName}`

### 6. Navigation
- Add the new route to `BottomNavComponent` navItems (mobile)
- Add the new route to `SidebarNavComponent` navItems (desktop)
- Choose an appropriate Lucide icon name

## Constraints
- No `HttpClient`, no NgModule, no `@Input`/`@Output` decorators
- All data through Dexie only
- Use `inject()` not constructor injection
- `input()` and `output()` signals for component I/O
