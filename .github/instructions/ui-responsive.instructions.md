---
applyTo: "src/app/layout/**,src/app/shared/**,src/**/*.html"
---

# Responsive UI — Mobile App on Mobile, Web App on Desktop

## Always Open These Mockups First

Before building or modifying any layout, open the relevant mockup in a browser. Resize below 720px to see the mobile view side-by-side:

| Mockup | What it shows |
|---|---|
| [`mockups/01-home-em-tasks.html`](../../../mockups/01-home-em-tasks.html) | Shell layout, 236px sidebar rail, bottom tab bar, task cards, Eisenhower Matrix grid |
| [`mockups/02-add-edit-task.html`](../../../mockups/02-add-edit-task.html) | Add/Edit form, modal overlays, back-nav pattern (no bottom tab on sub-screens) |
| [`mockups/03-profile-settings.html`](../../../mockups/03-profile-settings.html) | Profile rows, settings sections, modal create/edit pattern |

## Core Layout Rule

- **Mobile (`≤ 720px`):** Bottom tab bar visible, sidebar hidden, max-width 430px, stacked layout, 90px bottom padding to clear tab bar
- **Desktop (`> 720px`):** 236px left rail sidebar visible, bottom tab bar hidden, full-width layout

Use `@media (min-width: 721px)` or Tailwind's `[min-width:721px]:` variant. Write base styles for mobile first.

## Design Tokens — Use CSS Variables, Not Hardcoded Colors

Define in `src/styles.css`. Reference the CSS `:root` block at the top of every mockup file.

```css
:root {
  --bg: #12141a;
  --surface: #181b23;
  --surface-2: #20242f;
  --surface-3: #282d3a;
  --border: #2e3341;
  --text: #edeef3;
  --text-dim: #9095a8;
  --text-faint: #5c6175;
  --brass: #c9a15a;
  --brass-soft: rgba(201, 161, 90, 0.14);
  --do: #dd5b45;       --do-soft: rgba(221, 91, 69, 0.14);       /* Do it now */
  --decide: #4f8fe0;   --decide-soft: rgba(79, 143, 224, 0.14);  /* Schedule */
  --delegate: #e0b84f; --delegate-soft: rgba(224, 184, 79, 0.16);/* Delegate */
  --delete: #7c8194;   --delete-soft: rgba(124, 129, 148, 0.16); /* Drop altogether */
  --radius: 16px;
}
```

## Typography — Load from Google Fonts

```html
<!-- in index.html -->
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Role | Font |
|---|---|
| App name, page headings | `Fraunces` serif |
| Body text, nav labels, inputs | `Inter` sans-serif (default) |
| Meta labels, mono data | `IBM Plex Mono` |

## App Shell (`app-shell.component.ts`)

Reference: `.frame`, `.rail`, `.main` structure in [`mockups/01-home-em-tasks.html`](../../../mockups/01-home-em-tasks.html).

```ts
@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, BottomNavComponent, SidebarNavComponent],
  template: `
    <!-- matches .frame in mockup: flex row, full viewport, dark bg -->
    <div class="flex h-screen overflow-hidden" style="background: var(--bg);">

      <!-- 236px left rail — hidden on mobile, shown on desktop (matches .rail) -->
      <aside class="hidden w-[236px] flex-col flex-shrink-0 border-r"
             style="display: none; background: var(--surface); border-color: var(--border);"
             [style.display]="isDesktop() ? 'flex' : 'none'">
        <app-sidebar-nav />
      </aside>

      <!-- scrollable main content area -->
      <main class="flex-1 flex flex-col overflow-y-auto min-w-0"
            [style.paddingBottom]="isDesktop() ? '0' : '80px'">
        <router-outlet />
      </main>

      <!-- bottom tab bar — visible on mobile only (matches .mobile-tabbar) -->
      @if (!isDesktop()) {
        <nav class="fixed bottom-0 left-0 right-0 z-10">
          <app-bottom-nav />
        </nav>
      }

    </div>
  `
})
export class AppShellComponent {
  // matches mockup breakpoint: @media (max-width: 720px)
  isDesktop = toSignal(
    fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => window.innerWidth > 720)
    ),
    { initialValue: window.innerWidth > 720 }
  );
}
```

## Sidebar Rail — Desktop (`sidebar-nav.component.ts`)

Reference: `.rail`, `.brand`, `.nav-item`, `.nav-item.active` in [`mockups/01-home-em-tasks.html`](../../../mockups/01-home-em-tasks.html).

Specs from mockup:
- Rail: `236px` wide, `26px 16px` padding
- Brand mark: `34×34px`, `9px` radius, conic-gradient of quadrant colors
- Brand name: `Fraunces` `19px` `font-weight:600`
- Nav item: `12px 14px` padding, `10px` radius, `3px` transparent left border, `14.5px` `font-weight:500`
- Active nav item: `var(--brass-soft)` background, `var(--brass)` text and left border
- Icons: `18×18px`

```ts
@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full" style="padding: 26px 16px;">
      <!-- brand (matches .brand in mockup) -->
      <div class="flex items-center gap-[10px] px-2 pb-[26px] mb-[18px] border-b"
           style="border-color: var(--border);">
        <div class="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center relative"
             style="background: conic-gradient(from 45deg, var(--do), var(--delegate), var(--decide), var(--delete), var(--do));">
          <span class="w-3 h-3 rounded-[3px]" style="background: var(--bg);"></span>
        </div>
        <span style="font-family: Fraunces, serif; font-size: 19px; font-weight: 600; color: var(--text);">
          PrioQueue
        </span>
      </div>

      <!-- nav items -->
      <nav class="flex flex-col gap-1 flex-1">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path"
             routerLinkActive="nav-active"
             class="nav-item flex items-center gap-3 rounded-[10px] transition-colors"
             style="padding: 12px 14px; font-size: 14.5px; font-weight: 500; color: var(--text-dim);
                    border-left: 3px solid transparent;">
            <lucide-icon [name]="item.icon" [size]="18" />
            {{ item.label }}
          </a>
        }
      </nav>
    </div>
  `,
  styles: [`
    .nav-item:hover { background: var(--surface-2); color: var(--text); }
    .nav-active { background: var(--brass-soft) !important; color: var(--brass) !important; border-left-color: var(--brass) !important; }
  `]
})
export class SidebarNavComponent {
  // matches the 4 nav items shown in all mockups
  readonly navItems = [
    { path: '/today',   label: 'Today',             icon: 'home' },
    { path: '/matrix',  label: 'Eisenhower Matrix', icon: 'grid-2x2' },
    { path: '/tasks',   label: 'Tasks',             icon: 'list' },
    { path: '/profile', label: 'Profile',           icon: 'user' },
  ];
}
```

## Bottom Tab Bar — Mobile (`bottom-nav.component.ts`)

Reference: `.mobile-tabbar`, `.tab-item`, `.tab-item.active` in [`mockups/01-home-em-tasks.html`](../../../mockups/01-home-em-tasks.html).

Specs from mockup:
- Background: `var(--surface)`, top border `var(--border)`
- Padding: `10px 4px 14px` (bottom accounts for home indicator)
- Tab label: `10.5px` `font-weight:500`
- Icons: `20×20px`
- Active: `var(--brass)` color

```ts
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="flex justify-around items-center border-t"
         style="background: var(--surface); border-color: var(--border);
                padding: 10px 4px max(14px, env(safe-area-inset-bottom));">
      @for (item of navItems; track item.path) {
        <a [routerLink]="item.path"
           routerLinkActive="tab-active"
           class="tab-item flex flex-col items-center gap-1 rounded-[10px]"
           style="padding: 4px 10px; font-size: 10.5px; font-weight: 500; color: var(--text-faint);">
          <lucide-icon [name]="item.icon" [size]="20" />
          {{ item.label }}
        </a>
      }
    </div>
  `,
  styles: [`.tab-active { color: var(--brass) !important; }`]
})
export class BottomNavComponent {
  readonly navItems = [
    { path: '/today',   label: 'Today',   icon: 'home' },
    { path: '/matrix',  label: 'Matrix',  icon: 'grid-2x2' },
    { path: '/tasks',   label: 'Tasks',   icon: 'list' },
    { path: '/profile', label: 'Profile', icon: 'user' },
  ];
}
```

## Page Topbar Pattern

Reference: `.topbar`, `.page-heading` in all three mockup files.

Specs from mockup: `22px 34px` padding desktop → `16px 18px` mobile, bottom border, h1 in `Fraunces` `24px` desktop / `19px` mobile.

```html
<header class="flex items-center justify-between flex-shrink-0 border-b"
        style="padding: 16px 18px; border-color: var(--border); background: var(--bg);">
  <div class="flex items-center gap-4">
    <div>
      <h1 style="font-family: Fraunces, serif; font-weight: 600; font-size: 19px; margin: 0; color: var(--text);">
        Page Title
      </h1>
      <p style="font-size: 12px; margin: 3px 0 0; color: var(--text-faint);">Subtitle</p>
    </div>
  </div>
  <!-- right-side action buttons slot -->
</header>

<!-- desktop override — increase padding and font size above 720px -->
<style>
  @media (min-width: 721px) {
    header { padding: 22px 34px; }
    h1 { font-size: 24px !important; }
    p { font-size: 13px !important; }
  }
</style>
```

## Sub-Screen (Add/Edit) Pattern

Reference: [`mockups/02-add-edit-task.html`](../../../mockups/02-add-edit-task.html) — this is a pushed sub-screen with back arrow. **No bottom tab bar on this screen.**

- Back button: `.back` — `38×38px`, `10px` radius, `var(--surface-2)` background, `var(--border)` border
- The shell must hide the bottom tab bar when on a sub-screen (use route data or a signal in shell)
- Mobile: fields stack to 1 column, action buttons full-width reversed

```html
<!-- back button (.back in mockup 02) -->
<button class="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center border"
        style="background: var(--surface-2); border-color: var(--border); color: var(--text-dim);"
        (click)="goBack()">
  <lucide-icon name="chevron-left" [size]="18" />
</button>
```

## Form Layout (Add/Edit Task)

Reference: `.form-card`, `.field-grid`, `.field` in [`mockups/02-add-edit-task.html`](../../../mockups/02-add-edit-task.html).

- Form card: centered, `max-width: 640px`
- Field grid: 2 columns desktop → 1 column mobile
- Input: `var(--surface-2)` bg, `var(--border)` border, `10px` radius, `12px 14px` padding, `14px` font size
- Quadrant preview strip above form: colored background + border matching the assigned quadrant variable (`--do` = Do it now, `--decide` = Schedule, `--delegate` = Delegate, `--delete` = Drop altogether)

```html
<!-- quadrant preview strip (.em-preview in mockup 02) -->
<div class="flex items-center gap-[10px] rounded-[10px] mb-[22px]"
     style="padding: 14px 16px; background: var(--do-soft); border: 1px solid var(--do);">
  <span class="w-[9px] h-[9px] rounded-full" style="background: var(--do);"></span>
  <span style="color: var(--text-dim); font-size: 13px;">Falls under</span>
  <b style="color: var(--do);">Do it now</b>
  <span style="color: var(--text-dim); font-size: 13px;">— urgent and important</span>
</div>
```

## Modal Overlay Pattern

Reference: `.overlay`, `.modal` in [`mockups/02-add-edit-task.html`](../../../mockups/02-add-edit-task.html) and [`mockups/03-profile-settings.html`](../../../mockups/03-profile-settings.html).

- Overlay backdrop: `rgba(6,7,10,0.68)`
- Modal: `400px` wide, `var(--surface)` bg, `var(--border)` border, `16px` radius, `26px` padding
- On mobile: modal width `92vw`

```html
<div class="fixed inset-0 flex items-center justify-center z-20"
     style="background: rgba(6,7,10,0.68);">
  <div class="w-[400px] max-w-[92vw] rounded-[16px]"
       style="background: var(--surface); border: 1px solid var(--border);
              padding: 26px; box-shadow: 0 30px 70px -20px rgba(0,0,0,0.6);">
    <h2 style="font-family: Fraunces, serif; font-size: 19px; font-weight: 600;
               margin: 0 0 18px; color: var(--text);">Modal Title</h2>
    <!-- content -->
  </div>
</div>
```

## Profile / Settings Rows

Reference: `.profile-row`, `.add-row` in [`mockups/03-profile-settings.html`](../../../mockups/03-profile-settings.html).

- Profile row: `var(--surface)` bg, `var(--border)` border, `14px` radius, `16px 18px` padding
- Selected row: `var(--brass)` border + `var(--brass-soft)` background
- Add new (dashed): `1.5px dashed var(--border)`, centered, hover → `var(--brass)`

## Content Padding Reference

| Area | Mobile | Desktop |
|---|---|---|
| Page content | `16px` sides, `90px` bottom (clears tab bar) | `34px` sides |
| Form pages | `16px 16px 30px` | `34px` |
| Max form width | full width | `640px` centered |
| Max content width | `430px` (centered) | unrestricted |

## Button Styles

```html
<!-- primary (brass) — matches .btn-primary in mockups -->
<button style="background: var(--brass); color: #1c1508; border: 1px solid var(--brass);
               padding: 12px 22px; border-radius: 10px; font-size: 14px; font-weight: 600;">
  Save
</button>

<!-- ghost — matches .btn-ghost -->
<button style="background: transparent; color: var(--text-dim); border: 1px solid var(--border);
               padding: 12px 22px; border-radius: 10px; font-size: 14px; font-weight: 600;">
  Cancel
</button>

<!-- icon button — matches .icon-btn (34×34px) -->
<button class="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center border"
        style="background: var(--surface-2); border-color: var(--border); color: var(--text-dim);">
  <lucide-icon name="pencil" [size]="15" />
</button>
```
