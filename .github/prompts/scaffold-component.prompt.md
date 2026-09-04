---
mode: agent
description: Scaffold a single standalone Angular component
---

Create a new Angular standalone component called **`${input:componentName}`** inside **`${input:targetFolder}`** (e.g. `src/app/features/tasks/components`).

Follow ALL rules in `.github/copilot-instructions.md` and `.github/instructions/angular-standards.instructions.md`.

**UI reference:** Match the visual design from the mockups in `mockups/`. Use the dark theme CSS variables (`--bg`, `--surface`, `--brass`, quadrant colors), `Fraunces` for headings, `Inter` for body text, and `IBM Plex Mono` for labels/meta. Breakpoint is `720px` (not 768px).

## Requirements

- `standalone: true`
- `ChangeDetectionStrategy.OnPush`
- Use `inject()` for services — no constructor injection
- Use `input()` / `output()` signals — no `@Input` / `@Output` decorators
- Tailwind CSS utility classes only — no component-scoped CSS
- Mobile-first layout: base classes for mobile, `md:` prefix for desktop overrides
- Minimum touch target size: `min-h-[44px]` on interactive elements
- Use Angular 17+ `@if`, `@for`, `@switch` control flow — no `*ngIf`, `*ngFor`

## Component purpose

${input:componentPurpose}

## Generate

1. The `.ts` component file with inline template
2. If the component is a page/route — also add a lazy `loadComponent` route to `app.routes.ts`

## Selector naming

- Feature component: `app-{feature}-{name}` (e.g. `app-task-card`)
- Shared component: `app-{name}` (e.g. `app-empty-state`)
