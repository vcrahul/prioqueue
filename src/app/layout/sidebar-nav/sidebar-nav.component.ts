import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  styles: [`
    .nav-item {
      display: flex; align-items: center; gap: 12px; padding: 12px 14px;
      border-radius: 10px; color: var(--text-dim); font-size: 14.5px; font-weight: 500;
      cursor: pointer; margin-bottom: 4px; border-left: 3px solid transparent;
      transition: background .15s, color .15s; text-decoration: none;
    }
    .nav-item:hover { background: var(--surface-2); color: var(--text); }
    .nav-active { background: var(--brass-soft) !important; color: var(--brass) !important; border-left-color: var(--brass) !important; }
  `],
  template: `
    <div style="display:flex;flex-direction:column;height:100%;padding:26px 16px;">
      <div style="display:flex;align-items:center;gap:10px;padding:0 8px 26px;margin-bottom:18px;border-bottom:1px solid var(--border);">
        <div style="width:34px;height:34px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:conic-gradient(from 45deg,var(--do),var(--delegate),var(--decide),var(--delete),var(--do));">
          <span style="width:12px;height:12px;background:var(--bg);border-radius:3px;display:block;"></span>
        </div>
        <span style="font-family:Fraunces,serif;font-size:19px;font-weight:600;letter-spacing:.01em;">PrioQueue</span>
      </div>
      <nav style="display:flex;flex-direction:column;flex:1;">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="nav-active" class="nav-item">
            <app-icon [name]="item.icon" [size]="18" />
            {{ item.label }}
          </a>
        }
      </nav>
    </div>
  `,
})
export class SidebarNavComponent {
  readonly navItems = [
    { path: '/today',   label: 'Today',             icon: 'home' },
    { path: '/matrix',  label: 'Eisenhower Matrix', icon: 'grid' },
    { path: '/tasks',   label: 'Tasks',             icon: 'list' },
    { path: '/profile', label: 'Profile',           icon: 'user' },
  ];
}
