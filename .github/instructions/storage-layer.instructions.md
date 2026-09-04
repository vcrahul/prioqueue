---
applyTo: "src/app/core/**,src/app/features/**"
---

# Storage Layer — Dexie.js + Export/Import

## Database Definition (`src/app/core/db/app-db.ts`)

```ts
import Dexie, { type Table } from 'dexie';

export class AppDatabase extends Dexie {
  tasks!: Table<Task>;
  // add new tables here as features are added

  constructor() {
    super('PrioQueueDB');
    this.version(1).stores({
      // indexed fields only — non-indexed fields are stored but not searchable
      tasks: '++id, status, priority, createdAt, updatedAt, dueDate'
    });
  }
}

export const db = new AppDatabase();
```

### Schema Evolution Rules
- **Never** modify an existing version's `.stores()` definition
- Add new columns or tables by bumping the version number:
  ```ts
  this.version(2).stores({
    tasks: '++id, status, priority, createdAt, updatedAt, dueDate, projectId',
    projects: '++id, name, createdAt'
  });
  ```
- Non-indexed fields (e.g., `description`, `notes`) do **not** need to be in `.stores()`

## Persistent Storage Initialization

Add to `app.config.ts` providers:

```ts
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';

function initStorage(): () => Promise<void> {
  return async () => {
    if (navigator.storage?.persist) {
      const granted = await navigator.storage.persist();
      if (!granted) console.warn('Persistent storage not granted — data may be evicted.');
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_INITIALIZER, useFactory: initStorage, multi: true }
  ]
};
```

## Live Queries (Reactive Reads)

Always use `liveQuery` + `from()` + `toSignal()` for reactive data:

```ts
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';

// inside a service
readonly tasks = toSignal(
  from(liveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray())),
  { initialValue: [] as Task[] }
);
```

## CRUD Operations

```ts
// Create
async addTask(task: Omit<Task, 'id'>): Promise<void> {
  await db.tasks.add({ ...task, createdAt: Date.now(), updatedAt: Date.now() });
}

// Update
async updateTask(id: number, changes: Partial<Task>): Promise<void> {
  await db.tasks.update(id, { ...changes, updatedAt: Date.now() });
}

// Delete
async deleteTask(id: number): Promise<void> {
  await db.tasks.delete(id);
}

// Bulk delete
async clearAllTasks(): Promise<void> {
  await db.tasks.clear();
}
```

## Export as JSON

```ts
async exportTasks(): Promise<void> {
  const tasks = await db.tasks.toArray();
  const payload = { version: 1, exportedAt: new Date().toISOString(), tasks };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `prioqueue-tasks-${new Date().toISOString().split('T')[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

## Import from JSON

```ts
async importTasks(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await file.text();
  const payload = JSON.parse(text);
  const tasks: Task[] = payload.tasks ?? [];

  if (!Array.isArray(tasks)) throw new Error('Invalid backup file format.');

  // bulkPut = upsert (merge). Never use bulkAdd — it fails on duplicates.
  await db.tasks.bulkPut(tasks);
  return { imported: tasks.length, skipped: 0 };
}
```

## Import UI Pattern

Every feature page that has data must include:
- An **Export** button (top-right or settings panel) that triggers the export method
- An **Import** button that opens a `<input type="file" accept=".json">` file picker
- A confirmation dialog after import: "X tasks imported successfully"
- An optional **Replace All** vs **Merge** toggle on import

## Full Backup / Restore

For a single "backup all data" option in Settings, export all tables together:

```ts
async exportAll(): Promise<void> {
  const [tasks] = await Promise.all([
    db.tasks.toArray(),
    // add more tables here
  ]);
  const payload = { version: 1, exportedAt: new Date().toISOString(), tasks };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `prioqueue-full-backup-${new Date().toISOString().split('T')[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

## Rules — Never Break These

- Never call `localStorage.setItem` for app data — Dexie only
- Never use `bulkAdd` for imports — always `bulkPut` (handles duplicates)
- Always wrap multi-table writes in `db.transaction('rw', db.table1, db.table2, async () => { ... })`
- Always validate imported JSON structure before writing to DB
- Numeric `id` fields from Dexie `++id` are auto-incremented — preserve them on export/import
