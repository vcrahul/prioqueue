import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  styles: [`
    .tab-item {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      color: var(--text-faint); font-size: 10.5px; font-weight: 500;
      text-decoration: none; padding: 4px 10px; border-radius: 10px;
    }
    .tab-active { color: var(--brass) !important; }
  `],
  template: `
    <div style="display:flex;justify-content:space-around;align-items:center;border-top:1px solid var(--border);background:var(--surface);padding:10px 4px max(14px,env(safe-area-inset-bottom));">
      @for (item of navItems; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="tab-active" class="tab-item">
          <app-icon [name]="item.icon" [size]="20" />
          {{ item.label }}
        </a>
      }
    </div>
  `,
})
export class BottomNavComponent {
  readonly navItems = [
    { path: '/today',   label: 'Today',   icon: 'home' },
    { path: '/matrix',  label: 'EM',      icon: 'grid' },
    { path: '/tasks',   label: 'Tasks',   icon: 'list' },
    { path: '/profile', label: 'Profile', icon: 'user' },
  ];
}
