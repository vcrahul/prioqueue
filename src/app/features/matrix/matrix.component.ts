import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { TaskService } from '../../core/services/task.service';
import { ProfileService } from '../../core/services/profile.service';
import { DrawerService } from '../../core/services/drawer.service';
import { SettingsService } from '../../core/services/settings.service';
import { ProfilePillComponent } from '../../layout/profile-pill/profile-pill.component';
import { IconComponent } from '../../shared/icon.component';
import { Task, getQuadrant, QUADRANT_META, EMQuadrant } from '../tasks/models/task.model';

@Component({
  selector: 'app-matrix',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfilePillComponent, IconComponent],
  styles: [`
    :host { display:flex;flex-direction:column;height:100%; }
    .hamburger-btn:hover { color:var(--brass)!important;border-color:var(--brass)!important; }
    .filter-btn { display:flex;align-items:center;gap:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:9px 14px;font-size:13.5px;font-weight:500;cursor:pointer;color:var(--text); }
    .filter-btn:hover { border-color:var(--brass); }
    .filter-opt { display:block;padding:9px 14px;border-radius:8px;font-size:13.5px;cursor:pointer;color:var(--text-dim);border:none;background:none;width:100%;text-align:left; }
    .filter-opt:hover { background:var(--surface-2);color:var(--text); }
    .filter-opt.sel { color:var(--brass); }
    .quad-task { background:var(--surface-2);border:1px solid var(--border-soft);border-radius:9px;padding:8px 11px;margin-bottom:7px;font-size:12.5px;color:var(--text); }
    .quad-task .t-name { display:block;word-break:break-word;overflow-wrap:break-word;font-weight:500; }
    .quad-task small { display:block;color:var(--text-faint);font-size:10.5px;margin-top:2px;font-family:'IBM Plex Mono',monospace; }
    .quad { min-width:0;overflow:hidden; }
    .task-chk { width:15px;height:15px;border-radius:3px;border:1.5px solid var(--border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;color:white;transition:all .12s; }
    .task-chk:hover { border-color:var(--decide); }
    .name-edit-input { font-family:Fraunces,serif;font-size:15px;font-weight:600;background:var(--surface-2);border-radius:6px;padding:4px 8px;outline:none;width:100%; }
    @media (max-width:720px) {
      .topbar { padding:16px 18px!important; }
      .topbar h1 { font-size:19px!important; }
      .content { padding:16px 16px 24px!important; }
      .matrix-wrap { padding:16px 14px 4px!important; }
      .quad { padding:14px 10px 14px 12px!important;min-height:130px!important; }
      .quad h4 { font-size:13px!important;margin-bottom:8px!important; }
      .quad-icon { width:32px!important;height:32px!important;border-radius:9px!important;margin-bottom:8px!important; }
      .col-hdr { font-size:9px!important;padding-bottom:10px!important; }
      .row-hdr { font-size:9px!important; }
    }
  `],
  template: `
    <div class="topbar" style="display:flex;align-items:center;justify-content:space-between;padding:22px 34px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:16px;">
        <button class="hamburger-btn" (click)="drawer.open()" style="width:38px;height:38px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-dim);flex-shrink:0;cursor:pointer;">
          <app-icon name="menu" [size]="18" />
        </button>
        <div>
          <h1 style="font-family:Fraunces,serif;font-weight:600;font-size:24px;margin:0;">Eisenhower Matrix</h1>
        </div>
      </div>
      <app-profile-pill style="flex-shrink:0;margin-left:12px;" />
    </div>

    <div class="content" style="flex:1;overflow-y:auto;padding:30px 34px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
        <div style="position:relative;flex-shrink:0;">
          <button class="filter-btn" (click)="filterOpen.update(v=>!v)">
            {{ filter() === 'today' ? 'Today' : 'All tasks' }}
            <app-icon name="chevron-down" [size]="14" />
          </button>
          @if (filterOpen()) {
            <div (click)="filterOpen.set(false)" style="position:fixed;inset:0;z-index:10;"></div>
            <div style="position:absolute;top:calc(100% + 6px);left:0;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:6px;min-width:140px;z-index:11;box-shadow:0 8px 24px rgba(0,0,0,.4);">
              <button class="filter-opt" [class.sel]="filter()==='today'" (click)="setFilter('today')">Today</button>
              <button class="filter-opt" [class.sel]="filter()==='all'" (click)="setFilter('all')">All tasks</button>
            </div>
          }
        </div>
        <p style="flex:1;min-width:0;color:var(--text-dim);font-size:12.5px;line-height:1.5;margin:0;">Tasks flow into four quadrants based on urgency and importance. Focus on <b style="color:var(--do)">Do it now</b> first.</p>
      </div>

      <div class="matrix-wrap" style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:26px 26px 8px;">
        <div style="display:grid;grid-template-columns:28px minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto 1fr 1fr;">
          <div></div>
          <div class="col-hdr" style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint);padding-bottom:16px;padding-left:26px;">Urgent</div>
          <div class="col-hdr" style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint);padding-bottom:16px;padding-left:26px;">Less urgent</div>

          <!-- Row 1: Important -->
          <div class="row-hdr" style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint);writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;justify-content:center;border-right:1px solid var(--border);">Important</div>
          <div class="quad" style="padding:22px 22px 22px 26px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);">
            <div class="quad-icon" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:var(--do-soft);color:var(--do);">
              <app-icon name="zap" [size]="22" />
            </div>
            <h4 style="margin:0 0 12px;font-family:Fraunces,serif;font-size:17px;font-weight:600;color:var(--do);">Do it now</h4>
            <div style="height:120px;overflow-y:auto;overflow-x:hidden;padding-right:4px;">
              @for (t of quadTasks('do'); track t.id) { <div class="quad-task" style="display:flex;align-items:flex-start;gap:5px;"><button (click)="completeTask(t.id!)" class="task-chk"></button><div style="flex:1;min-width:0;overflow:hidden;"><span class="t-name">{{ trunc(t.name) }}</span>@if (t.dueDate) {<small>{{ t.dueDate }}</small>}</div></div> }
              @if (!quadTasks('do').length) { <span style="color:var(--text-faint);font-size:12.5px;font-style:italic;">No tasks</span> }
            </div>
          </div>
          <div class="quad" style="padding:22px 22px 22px 26px;border-bottom:1px solid var(--border);">
            <div class="quad-icon" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:var(--decide-soft);color:var(--decide);">
              <app-icon name="calendar" [size]="22" />
            </div>
            <h4 style="margin:0 0 12px;font-family:Fraunces,serif;font-size:17px;font-weight:600;color:var(--decide);">Schedule</h4>
            <div style="height:120px;overflow-y:auto;overflow-x:hidden;padding-right:4px;">
              @for (t of quadTasks('decide'); track t.id) { <div class="quad-task" style="display:flex;align-items:flex-start;gap:5px;"><button (click)="completeTask(t.id!)" class="task-chk"></button><div style="flex:1;min-width:0;overflow:hidden;"><span class="t-name">{{ trunc(t.name) }}</span>@if (t.dueDate) {<small>{{ t.dueDate }}</small>}</div></div> }
              @if (!quadTasks('decide').length) { <span style="color:var(--text-faint);font-size:12.5px;font-style:italic;">No tasks</span> }
            </div>
          </div>

          <!-- Row 2: Less important (editable names) -->
          <div class="row-hdr" style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint);writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;justify-content:center;border-right:1px solid var(--border);">Less important</div>
          <div class="quad" style="padding:22px 22px 22px 26px;border-right:1px solid var(--border);">
            <div class="quad-icon" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:var(--delegate-soft);color:var(--delegate);">
              <app-icon name="user" [size]="22" />
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
              @if (editingDelegate()) {
                <input class="name-edit-input" type="text" [value]="delegateInput()" (input)="delegateInput.set($any($event.target).value)" (keydown.enter)="saveDelegateName()" [style.border]="'1px solid var(--delegate)'" [style.color]="'var(--delegate)'" />
                <button (click)="saveDelegateName()" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:var(--delegate-soft);color:var(--delegate);border:1px solid var(--delegate);cursor:pointer;flex-shrink:0;">Save</button>
              } @else {
                <h4 style="margin:0;font-family:Fraunces,serif;font-size:17px;font-weight:600;color:var(--delegate);">{{ settings.delegateName() }}</h4>
                <button (click)="startEditDelegate()" style="color:var(--text-faint);cursor:pointer;padding:2px;flex-shrink:0;" title="Edit name">
                  <app-icon name="edit" [size]="13" />
                </button>
              }
            </div>
            <div style="height:120px;overflow-y:auto;overflow-x:hidden;padding-right:4px;">
              @for (t of quadTasks('delegate'); track t.id) { <div class="quad-task" style="display:flex;align-items:flex-start;gap:5px;"><button (click)="completeTask(t.id!)" class="task-chk"></button><div style="flex:1;min-width:0;overflow:hidden;"><span class="t-name">{{ trunc(t.name) }}</span>@if (t.dueDate) {<small>{{ t.dueDate }}</small>}</div></div> }
              @if (!quadTasks('delegate').length) { <span style="color:var(--text-faint);font-size:12.5px;font-style:italic;">No tasks</span> }
            </div>
          </div>
          <div class="quad" style="padding:22px 22px 22px 26px;">
            <div class="quad-icon" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:var(--delete-soft);color:var(--delete);">
              <app-icon name="trash" [size]="22" />
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
              @if (editingDelete()) {
                <input class="name-edit-input" type="text" [value]="deleteInput()" (input)="deleteInput.set($any($event.target).value)" (keydown.enter)="saveDeleteName()" [style.border]="'1px solid var(--delete)'" [style.color]="'var(--delete)'" />
                <button (click)="saveDeleteName()" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:var(--delete-soft);color:var(--delete);border:1px solid var(--delete);cursor:pointer;flex-shrink:0;">Save</button>
              } @else {
                <h4 style="margin:0;font-family:Fraunces,serif;font-size:17px;font-weight:600;color:var(--delete);">{{ settings.deleteName() }}</h4>
                <button (click)="startEditDelete()" style="color:var(--text-faint);cursor:pointer;padding:2px;flex-shrink:0;" title="Edit name">
                  <app-icon name="edit" [size]="13" />
                </button>
              }
            </div>
            <div style="height:120px;overflow-y:auto;overflow-x:hidden;padding-right:4px;">
              @for (t of quadTasks('delete'); track t.id) { <div class="quad-task" style="display:flex;align-items:flex-start;gap:5px;"><button (click)="completeTask(t.id!)" class="task-chk"></button><div style="flex:1;min-width:0;overflow:hidden;"><span class="t-name">{{ trunc(t.name) }}</span>@if (t.dueDate) {<small>{{ t.dueDate }}</small>}</div></div> }
              @if (!quadTasks('delete').length) { <span style="color:var(--text-faint);font-size:12.5px;font-style:italic;">No tasks</span> }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MatrixComponent {
  readonly drawer = inject(DrawerService);
  readonly settings = inject(SettingsService);
  private readonly taskService = inject(TaskService);
  private readonly profileService = inject(ProfileService);

  readonly filter = signal<'today' | 'all'>('all');
  readonly filterOpen = signal(false);

  readonly editingDelegate = signal(false);
  readonly editingDelete = signal(false);
  readonly delegateInput = signal('');
  readonly deleteInput = signal('');

  readonly filteredTasks = computed(() => {
    const pid = this.profileService.selectedProfileId();
    let tasks = this.taskService.activeTasks();
    if (pid !== null) tasks = tasks.filter(t => t.profileId === pid);
    if (this.filter() === 'today') {
      const today = new Date().toISOString().split('T')[0];
      tasks = tasks.filter(t => t.dueDate === today);
    }
    return tasks;
  });

  quadTasks(q: EMQuadrant): Task[] {
    return this.filteredTasks().filter(t => getQuadrant(t.urgent, t.important) === q);
  }

  setFilter(v: 'today' | 'all'): void { this.filter.set(v); this.filterOpen.set(false); }

  async completeTask(id: number): Promise<void> {
    await this.taskService.markComplete(id, true);
  }

  // 25-char hard cap keeps each quadrant cell single-line
  trunc(text: string, max = 25): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  startEditDelegate(): void { this.delegateInput.set(this.settings.delegateName()); this.editingDelegate.set(true); }
  startEditDelete(): void { this.deleteInput.set(this.settings.deleteName()); this.editingDelete.set(true); }

  async saveDelegateName(): Promise<void> {
    await this.settings.setDelegateName(this.delegateInput());
    this.editingDelegate.set(false);
  }

  async saveDeleteName(): Promise<void> {
    await this.settings.setDeleteName(this.deleteInput());
    this.editingDelete.set(false);
  }
}

