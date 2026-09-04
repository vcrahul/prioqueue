import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { ProfileService } from '../../../core/services/profile.service';
import { DrawerService } from '../../../core/services/drawer.service';
import { ProfilePillComponent } from '../../../layout/profile-pill/profile-pill.component';
import { IconComponent } from '../../../shared/icon.component';
import { Task, getQuadrant, QUADRANT_META } from '../models/task.model';

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProfilePillComponent, IconComponent],
  styles: [`
    :host { display:flex;flex-direction:column;height:100%; }
    .hamburger-btn:hover { color:var(--brass)!important;border-color:var(--brass)!important; }
    .icon-btn { width:34px;height:34px;border-radius:9px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-dim);flex-shrink:0; }
    .icon-btn:hover { color:var(--brass);border-color:var(--brass); }
    .icon-btn.danger:hover { color:var(--do);border-color:var(--do); }
    .fab { display:flex;align-items:center;gap:9px;background:var(--brass);color:#1c1508;font-weight:600;font-size:14px;padding:13px 22px;border-radius:999px;cursor:pointer;box-shadow:0 12px 30px -8px rgba(201,161,90,.5);border:none;text-decoration:none; }
    .fab-completed { display:flex;align-items:center;gap:7px;background:var(--surface);color:var(--text-dim);font-weight:600;font-size:13px;padding:11px 18px;border-radius:999px;border:1px solid var(--border);cursor:pointer; }
    .fab-completed:hover { color:var(--brass);border-color:var(--brass); }
    .task-chk { width:16px;height:16px;border-radius:3px;border:1.5px solid var(--border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;transition:all .12s; }
    .task-chk:hover { border-color:var(--decide); }
    .task-chk-done { background:var(--decide)!important;border-color:var(--decide)!important;color:white; }
    .em-chip { font-size:10.5px;padding:3px 9px;border-radius:999px;font-family:'IBM Plex Mono',monospace;display:inline-flex;align-items:center;gap:4px;flex-shrink:0;white-space:nowrap; }
    @media (max-width:560px) { .em-chip { display:none; } }
    @media (max-width:720px) {
      .topbar { padding:16px 18px!important; }
      .topbar h1 { font-size:19px!important; }
      .content { padding:16px 16px 24px!important; }
      .task-row { padding:13px 14px!important;gap:10px!important; }
      .task-row h3 { font-size:14px!important; }
      .fab { padding:12px 18px!important;font-size:13px!important; }
    }
  `],
  template: `
    <div class="topbar" style="display:flex;align-items:center;justify-content:space-between;padding:22px 34px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:16px;">
        <button class="hamburger-btn" (click)="drawer.open()" style="width:38px;height:38px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-dim);flex-shrink:0;cursor:pointer;">
          <app-icon name="menu" [size]="18" />
        </button>
        <h1 style="font-family:Fraunces,serif;font-weight:600;font-size:24px;margin:0;">Tasks</h1>
      </div>
      <app-profile-pill style="flex-shrink:0;margin-left:12px;" />
    </div>

    <div class="content" style="flex:1;overflow-y:auto;padding:30px 34px;position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <p style="margin:0;color:var(--text-faint);font-size:12px;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.08em;">{{ totalCount() }} tasks</p>
      </div>

      @if (groupedTasks().length === 0) {
        <div style="padding:48px 0;text-align:center;">
          <p style="color:var(--text-faint);font-size:14px;margin:0;">No tasks yet.</p>
        </div>
      }

      @for (group of groupedTasks(); track group.date) {
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-faint);margin:20px 0 10px;">
          {{ group.label }} · {{ group.tasks.length }}
        </div>
        @for (task of group.tasks; track task.id) {
          <div class="task-row" style="display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px 18px;margin-bottom:10px;">
            <div style="width:4px;align-self:stretch;border-radius:4px;flex-shrink:0;" [style.background]="meta(task).color"></div>
            <button (click)="completeTask(task)" class="task-chk"></button>
            <div style="flex:1;min-width:0;">
              <h3 style="margin:0 0 5px;font-family:Fraunces,serif;font-weight:500;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ trunc(task.name, 25) }}</h3>
              @if (trunc(getCategoryName(task.categoryId), 25); as cat) {
                <span style="font-size:11px;padding:3px 9px;border-radius:999px;font-family:'IBM Plex Mono',monospace;background:var(--surface-3);color:var(--text-dim);display:inline-block;">{{ cat }}</span>
              }
            </div>
            <!-- EM quadrant chip on the right -->
            <span class="em-chip" [style.background]="meta(task).softColor" [style.color]="meta(task).color">
              <span style="width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;"></span>
              {{ meta(task).label }}
            </span>
            <div style="display:flex;gap:8px;flex-shrink:0;">
              <a [routerLink]="['/tasks/edit', task.id]" class="icon-btn">
                <app-icon name="edit" [size]="15" />
              </a>
              <button class="icon-btn danger" (click)="confirmDelete(task)">
                <app-icon name="trash" [size]="15" />
              </button>
            </div>
          </div>
        }
      }

      <!-- FAB -->
      <div style="position:sticky;bottom:0;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:18px 0 0;">
        <button (click)="showCompleted.set(true)" class="fab-completed">
          <app-icon name="check" [size]="14" />
          Completed
        </button>
        <a routerLink="/tasks/add" class="fab">
          <app-icon name="plus" [size]="16" />
          Add task
        </a>
      </div>
    </div>

    <!-- Completed tasks popup -->
    @if (showCompleted()) {
      <div style="position:fixed;inset:0;background:rgba(6,7,10,.75);z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(520px,100%);max-height:80vh;background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;">
          <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
            <h2 style="font-family:Fraunces,serif;font-size:18px;font-weight:600;margin:0;">Completed tasks</h2>
            <button (click)="showCompleted.set(false)" style="width:30px;height:30px;border-radius:8px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-dim);">
              <app-icon name="x" [size]="14" />
            </button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:8px 22px 16px;">
            @if (!taskService.completedTasks().length) {
              <p style="color:var(--text-faint);font-size:13px;text-align:center;padding:28px 0;margin:0;">No completed tasks yet.</p>
            }
            @for (task of taskService.completedTasks(); track task.id) {
              <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-soft);">
                <button (click)="restoreTask(task.id!)" class="task-chk task-chk-done">
                  <app-icon name="check" [size]="10" [strokeWidth]="2.5" />
                </button>
                <div style="flex:1;min-width:0;">
                  <span style="text-decoration:line-through;color:var(--text-dim);font-size:13.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ trunc(task.name, 25) }}</span>
                  @if (task.completedAt) {
                    <small style="color:var(--text-faint);font-size:11px;font-family:'IBM Plex Mono',monospace;">Completed {{ formatCompletedDate(task.completedAt) }}</small>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
    @if (deletingTask()) {
      <div style="position:fixed;inset:0;background:rgba(6,7,10,.75);z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(380px,100%);background:var(--surface);border:1px solid var(--do);border-radius:16px;padding:26px;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--do-soft);display:flex;align-items:center;justify-content:center;color:var(--do);margin-bottom:16px;">
            <app-icon name="trash" [size]="20" />
          </div>
          <h2 style="font-family:Fraunces,serif;font-size:18px;margin:0 0 8px;font-weight:600;">Delete this task?</h2>
          <p style="color:var(--text-dim);font-size:13.5px;margin:0;">"{{ deletingTask()!.name }}" will be permanently removed.</p>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;">
            <button (click)="deletingTask.set(null)" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:transparent;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;">Cancel</button>
            <button (click)="deleteTask()" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:var(--do);color:#2a0e08;border:none;cursor:pointer;">Delete task</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TaskListComponent {
  readonly taskService = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly profileService = inject(ProfileService);
  readonly drawer = inject(DrawerService);

  readonly deletingTask = signal<Task | null>(null);
  readonly showCompleted = signal(false);

  private readonly filteredTasks = computed(() => {
    const pid = this.profileService.selectedProfileId();
    const tasks = this.taskService.activeTasks();
    return pid === null ? tasks : tasks.filter(t => t.profileId === pid);
  });

  readonly totalCount = computed(() => this.filteredTasks().length);

  readonly groupedTasks = computed(() => {
    const tasks = this.filteredTasks();
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const key = t.dueDate ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    const result: { date: string; label: string; tasks: Task[] }[] = [];
    // Dated groups sorted descending (most recent first)
    [...map.keys()]
      .filter(k => k !== '')
      .sort((a, b) => b.localeCompare(a))
      .forEach(date => result.push({ date, label: formatDateLabel(date), tasks: map.get(date)! }));
    // Undated tasks at the end
    const undated = map.get('');
    if (undated?.length) result.push({ date: '', label: 'No date', tasks: undated });
    return result;
  });

  private readonly categoryMap = computed(() => {
    const m = new Map<number, string>();
    this.categoryService.categories().forEach(c => { if (c.id != null) m.set(c.id, c.name); });
    return m;
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

  async restoreTask(id: number): Promise<void> {
    await this.taskService.markComplete(id, false);
  }

  formatCompletedDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  confirmDelete(task: Task): void { this.deletingTask.set(task); }

  async deleteTask(): Promise<void> {
    const task = this.deletingTask();
    if (task?.id != null) await this.taskService.delete(task.id);
    this.deletingTask.set(null);
  }
}

