import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { CategoryService } from '../../core/services/category.service';
import { ProfileService } from '../../core/services/profile.service';
import { DrawerService } from '../../core/services/drawer.service';
import { SettingsService } from '../../core/services/settings.service';
import { ProfilePillComponent } from '../../layout/profile-pill/profile-pill.component';
import { IconComponent } from '../../shared/icon.component';
import { Task, getQuadrant, QUADRANT_META } from '../tasks/models/task.model';

@Component({
  selector: 'app-today',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProfilePillComponent, IconComponent],
  styles: [`
    :host { display:flex;flex-direction:column;height:100%; }
    .hamburger-btn:hover { color:var(--brass)!important;border-color:var(--brass)!important; }
    .task-chk { width:16px;height:16px;border-radius:3px;border:1.5px solid var(--border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;transition:all .12s; }
    .task-chk:hover { border-color:var(--decide); }
    @media (max-width:720px) {
      .topbar { padding:16px 18px!important; }
      .topbar h1 { font-size:19px!important; }
      .topbar p { font-size:12px!important; }
      .content { padding:16px 16px 24px!important; }
      .task-card { padding:14px!important;gap:12px!important; }
      .task-card h3 { font-size:14.5px!important; }
    }
  `],
  template: `
    <div class="topbar" style="display:flex;align-items:center;justify-content:space-between;padding:22px 34px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:16px;min-width:0;">
        <button class="hamburger-btn" (click)="drawer.open()" style="width:38px;height:38px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-dim);flex-shrink:0;">
          <app-icon name="menu" [size]="18" />
        </button>
        <div style="min-width:0;">
          <h1 style="font-family:Fraunces,serif;font-weight:600;font-size:24px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ greeting() }}</h1>
        </div>
      </div>
      <app-profile-pill style="flex-shrink:0;margin-left:12px;" />
    </div>

    <div class="content" style="flex:1;overflow-y:auto;padding:30px 34px;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-faint);margin-bottom:12px;">
        Today · {{ todayTasks().length }} {{ todayTasks().length === 1 ? 'task' : 'tasks' }}
      </div>

      @if (todayTasks().length === 0) {
        <div style="padding:48px 0;text-align:center;">
          <p style="color:var(--text-faint);font-size:14px;margin:0 0 16px;">No tasks scheduled for today.</p>
          <a routerLink="/tasks/add" style="display:inline-flex;align-items:center;gap:8px;padding:11px 20px;background:var(--brass);color:#1c1508;border-radius:10px;font-weight:600;font-size:13.5px;">
            <app-icon name="plus" [size]="14" />
            Add a task
          </a>
        </div>
      }

      @for (task of todayTasks(); track task.id) {
        <div class="task-card" style="display:flex;align-items:center;gap:18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px 20px;margin-bottom:14px;">
          <div style="width:4px;align-self:stretch;border-radius:4px;flex-shrink:0;" [style.background]="meta(task).color"></div>
          <button (click)="completeTask(task)" class="task-chk"></button>
          <div style="flex:1;min-width:0;">
              <h3 style="margin:0 0 6px;font-family:Fraunces,serif;font-weight:500;font-size:16.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ trunc(task.name, 25) }}</h3>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                @if (trunc(getCategoryName(task.categoryId), 25); as catName) {
                <span style="font-size:11.5px;padding:4px 10px;border-radius:999px;font-weight:500;font-family:'IBM Plex Mono',monospace;background:var(--surface-3);color:var(--text-dim);">{{ catName }}</span>
              }
              <span style="font-size:11.5px;padding:4px 10px;border-radius:999px;font-weight:500;font-family:'IBM Plex Mono',monospace;display:inline-flex;align-items:center;gap:5px;" [style.background]="meta(task).softColor" [style.color]="meta(task).color">
                <span style="width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;display:inline-block;"></span>
                {{ meta(task).label }}
              </span>
            </div>
          </div>
          @if (task.reminderTime) {
            <div style="display:flex;align-items:center;gap:7px;color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:12.5px;white-space:nowrap;flex-shrink:0;">
              <app-icon name="bell" [size]="14" style="color:var(--brass)" />
              {{ task.reminderTime }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class TodayComponent {
  private readonly taskService = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly profileService = inject(ProfileService);
  readonly drawer = inject(DrawerService);
  private readonly settings = inject(SettingsService);

  readonly todayTasks = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const pid = this.profileService.selectedProfileId();
    const order: Record<string, number> = { do: 0, decide: 1, delegate: 2, delete: 3 };
    return this.taskService.activeTasks()
      .filter(t => t.dueDate === today)
      .filter(t => pid === null || t.profileId === pid)
      .sort((a, b) => order[getQuadrant(a.urgent, a.important)] - order[getQuadrant(b.urgent, b.important)]);
  });

  private readonly categoryMap = computed(() => {
    const m = new Map<number, string>();
    this.categoryService.categories().forEach(c => { if (c.id != null) m.set(c.id, c.name); });
    return m;
  });

  readonly greeting = computed(() => {
    const name = this.settings.userName();
    return name ? `Welcome, ${name}` : 'Welcome';
  });

  meta(task: Task) { return QUADRANT_META[getQuadrant(task.urgent, task.important)]; }

  getCategoryName(id?: number): string {
    if (id == null) return '';
    return this.categoryMap().get(id) ?? '';
  }

  trunc(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  async completeTask(task: Task): Promise<void> {
    await this.taskService.markComplete(task.id!, true);
  }
}
