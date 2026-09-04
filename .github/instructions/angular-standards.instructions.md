---
applyTo: "src/**/*.ts"
---

# Angular 19+ Coding Standards

## Component Template

Always generate components using this skeleton:

```ts
import { Component, ChangeDetectionStrategy, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="...tailwind classes...">
      <!-- template here -->
    </div>
  `
})
export class ExampleComponent {
  // 1. injected services
  private readonly exampleService = inject(ExampleService);

  // 2. signal-based inputs (not @Input decorator)
  title = input<string>('');
  items = input<Item[]>([]);

  // 3. outputs (not @Output EventEmitter)
  itemSelected = output<Item>();

  // 4. local state signals
  isLoading = signal(false);

  // 5. computed derived values
  itemCount = computed(() => this.items().length);

  // 6. methods
}
```

## Inputs and Outputs

```ts
// CORRECT — signal-based
title = input<string>('');
required = input.required<string>();
itemSelected = output<Item>();

// WRONG — never use these
@Input() title: string = '';
@Output() itemSelected = new EventEmitter<Item>();
```

## Dependency Injection

```ts
// CORRECT
private readonly taskService = inject(TaskService);

// WRONG — never use constructor injection
constructor(private taskService: TaskService) {}
```

## State Management

```ts
// local component state
count = signal(0);
increment() { this.count.update(v => v + 1); }

// derived/computed state
doubled = computed(() => this.count() * 2);

// side effects that react to signal changes
constructor() {
  effect(() => {
    console.log('count changed:', this.count());
  });
}
```

## Services

```ts
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExampleService {
  // expose state as signals
  private readonly _items = signal<Item[]>([]);
  readonly items = this._items.asReadonly();

  async loadItems(): Promise<void> {
    // use Dexie, not fetch/HttpClient
  }
}
```

## Routing — Lazy Load with loadComponent

```ts
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/components/task-list.component')
      .then(m => m.TaskListComponent)
  },
  { path: '', redirectTo: 'tasks', pathMatch: 'full' }
];
```

## Connecting Dexie liveQuery to a Signal

```ts
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../core/db/app-db';

@Injectable({ providedIn: 'root' })
export class TaskService {
  // reactive — auto-updates when IndexedDB changes
  readonly tasks = toSignal(
    from(liveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray())),
    { initialValue: [] }
  );
}
```

## Change Detection

- Always `ChangeDetectionStrategy.OnPush`
- Signals automatically mark the view dirty — no need for `markForCheck()`
- Avoid `ChangeDetectorRef` unless integrating third-party non-signal code

## Template Control Flow (Angular 17+ syntax)

```html
<!-- CORRECT — new control flow syntax -->
@if (isLoading()) {
  <app-spinner />
} @else {
  @for (task of tasks(); track task.id) {
    <app-task-card [task]="task" />
  } @empty {
    <p>No tasks yet.</p>
  }
}

<!-- WRONG — do not use *ngIf, *ngFor directives -->
<div *ngIf="isLoading">...</div>
<div *ngFor="let task of tasks">...</div>
```
