import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { HamburgerDrawerComponent } from '../hamburger-drawer/hamburger-drawer.component';
import { WelcomeModalComponent } from '../../shared/welcome-modal.component';
import { DrawerService } from '../../core/services/drawer.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarNavComponent, BottomNavComponent, HamburgerDrawerComponent, WelcomeModalComponent],
  template: `
    <div style="display:flex;height:100dvh;overflow:hidden;background:var(--bg);">
      @if (isDesktop()) {
        <aside style="width:236px;flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto;">
          <app-sidebar-nav />
        </aside>
      }

      <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;position:relative;">
        <main style="flex:1;overflow-y:auto;" [style.padding-bottom]="(!isDesktop() && !hideBottomNav()) ? '68px' : '0'">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (!isDesktop() && !hideBottomNav()) {
      <div style="position:fixed;bottom:0;left:0;right:0;z-index:20;">
        <app-bottom-nav />
      </div>
    }

    @if (drawerService.isOpen()) {
      <app-hamburger-drawer />
    }

    <app-welcome-modal />
  `,
})
export class AppShellComponent {
  readonly drawerService = inject(DrawerService);
  private readonly router = inject(Router);

  // matchMedia fires exactly when breakpoint is crossed — more reliable than polling resize events
  readonly isDesktop = signal(window.matchMedia('(min-width: 721px)').matches);

  constructor() {
    const mql = window.matchMedia('(min-width: 721px)');
    const handler = (e: MediaQueryListEvent) => this.isDesktop.set(e.matches);
    mql.addEventListener('change', handler);
    inject(DestroyRef).onDestroy(() => mql.removeEventListener('change', handler));
  }

  readonly hideBottomNav = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => /\/(add|edit)/.test(this.router.url))
    ),
    { initialValue: false }
  );
}
