---
mode: agent
description: Scaffold an Angular service with Dexie reads, writes, and export/import
---

Create an Angular service called **`${input:serviceName}Service`** for the **`${input:entityName}`** entity.

Follow ALL rules in `.github/copilot-instructions.md`, `.github/instructions/angular-standards.instructions.md`, and `.github/instructions/storage-layer.instructions.md`.

## File location

`src/app/features/${input:featureName}/services/${input:serviceName}.service.ts`

## Requirements

### Reactive data
- Expose a readonly `items` signal using `toSignal(from(liveQuery(...)))` with `initialValue: []`
- Expose a readonly `isLoading` signal (`signal(false)`)
- Expose any useful `computed()` signals (e.g. `completedCount`, `totalCount`)

### Write operations
- `add(data: Omit<${input:entityName}, 'id'>): Promise<void>` — sets `createdAt` and `updatedAt` to `Date.now()`
- `update(id: number, changes: Partial<${input:entityName}>): Promise<void>` — updates `updatedAt`
- `remove(id: number): Promise<void>`

### Export
- `exportAsJson(): Promise<void>`
- Downloads a JSON file named `prioqueue-${input:entityName.toLowerCase()}-YYYY-MM-DD.json`
- Includes a `version` and `exportedAt` field in the payload

### Import
- `importFromJson(file: File): Promise<{ imported: number }>`
- Parses the JSON, validates the array exists
- Uses `db.${input:entityName.toLowerCase()}s.bulkPut(items)` — never `bulkAdd`
- Returns count of imported records

### Error handling
- Wrap all Dexie operations in try/catch
- Use `signal<string | null>(null)` for `errorMessage` — set it on failure, clear on success

## Constraints
- `providedIn: 'root'`
- `inject()` only — no constructor injection
- No `HttpClient`, no `localStorage`
- All data through Dexie (`db` imported from `src/app/core/db/app-db`)
