import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { ProfileService } from '../../../core/services/profile.service';
import { IconComponent } from '../../../shared/icon.component';
import { db } from '../../../core/db/app-db';
import { getQuadrant, QUADRANT_META } from '../models/task.model';
import { Category, PRESET_COLORS } from '../models/category.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  styles: [`
    :host { display:flex;flex-direction:column;height:100%; }
    .back-btn:hover { color:var(--brass)!important;border-color:var(--brass)!important; }
    .toggle-opt { flex:1;text-align:center;padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);font-size:13.5px;font-weight:500;color:var(--text-dim);cursor:pointer; }
    .active-urgent   { border-color:var(--do)!important;     color:var(--do)!important;     background:var(--do-soft)!important; }
    .active-important{ border-color:var(--decide)!important; color:var(--decide)!important; background:var(--decide-soft)!important; }
    .active-neutral  { border-color:var(--text-dim)!important;color:var(--text)!important;  background:var(--surface-3)!important; }
    .swatch { width:28px;height:28px;border-radius:50%;cursor:pointer;border:2px solid transparent;flex-shrink:0; }
    .swatch.sel { border-color:var(--text)!important; }
    @media (max-width:720px) {
      .topbar { padding:16px 18px!important; }
      .topbar h1 { font-size:19px!important; }
      .content { padding:16px 16px 30px!important; }
      .field-grid { grid-template-columns:1fr!important; }
      .form-actions { flex-direction:column-reverse!important; }
      .form-actions button { width:100%;text-align:center; }
    }
  `],
  template: `
    <div class="topbar" style="display:flex;align-items:center;padding:22px 34px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <button class="back-btn" (click)="goBack()" style="width:38px;height:38px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-dim);flex-shrink:0;margin-right:16px;cursor:pointer;">
        <app-icon name="chevron-left" [size]="18" />
      </button>
      <div>
        <h1 style="font-family:Fraunces,serif;font-weight:600;font-size:24px;margin:0;">{{ isEditMode ? 'Edit task' : 'Add task' }}</h1>
        <p style="margin:3px 0 0;color:var(--text-faint);font-size:13px;">{{ isEditMode ? 'Changes save to the selected profile' : 'Fill in the details below' }}</p>
      </div>
    </div>

    <div class="content" style="flex:1;overflow-y:auto;padding:34px;display:flex;justify-content:center;">
      <div style="width:100%;max-width:640px;">

        <!-- EM preview -->
        <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:10px;margin-bottom:22px;flex-wrap:wrap;" [style.background]="quadrantMeta().softColor" [style.border]="'1px solid ' + quadrantMeta().color">
          <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;" [style.background]="quadrantMeta().color"></span>
          <span style="color:var(--text-dim);font-size:13px;">Falls under</span>
          <b [style.color]="quadrantMeta().color">{{ quadrantMeta().label }}</b>
          <span style="color:var(--text-dim);font-size:13px;">— {{ quadrantMeta().description }}</span>
        </div>

        <!-- Task name -->
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;letter-spacing:.02em;">Task name</label>
          <input type="text" maxlength="25" [value]="name()" (input)="name.set($any($event.target).value)" placeholder="e.g. Submit tax documents" />
        </div>

        <div class="field-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- Category -->
          <div style="margin-bottom:0;">
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;letter-spacing:.02em;">Category <span style="color:var(--do);">*</span></label>
            <div style="display:flex;gap:10px;align-items:center;">
              <select (change)="onCategoryChange($event)" style="flex:1;" [style.border-color]="saveAttempted() && !selectedCategoryId() ? 'var(--do)' : ''">
                <option value="">None</option>
                @for (cat of categoryService.categories(); track cat.id) {
                  <option [value]="cat.id" [selected]="selectedCategoryId() === cat.id">{{ cat.name }}</option>
                }
              </select>
              <button (click)="openCategoryModal()" style="width:44px;height:44px;flex-shrink:0;border-radius:10px;background:var(--brass-soft);border:1px solid var(--brass);color:var(--brass);display:flex;align-items:center;justify-content:center;cursor:pointer;">
                <app-icon name="plus" [size]="18" />
              </button>
            </div>
          </div>

          <!-- Profile -->
          <div style="margin-bottom:0;">
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;letter-spacing:.02em;">Profile <span style="color:var(--do);">*</span></label>
            <select (change)="onProfileChange($event)" [style.border-color]="saveAttempted() && !selectedProfileId() ? 'var(--do)' : ''">
              <option value="">No profile</option>
              @for (p of profileService.profiles(); track p.id) {
                <option [value]="p.id" [selected]="selectedProfileId() === p.id">{{ p.name }}</option>
              }
            </select>
          </div>

          <!-- Date -->
          <div style="margin-bottom:0;">
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;letter-spacing:.02em;">Date <span style="color:var(--do);">*</span></label>
            <input type="date" [value]="dueDate()" (change)="dueDate.set($any($event.target).value)" [style.border-color]="saveAttempted() && !dueDate() ? 'var(--do)' : ''" />
          </div>

          <!-- Reminder time -->
          <div style="margin-bottom:0;">
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;letter-spacing:.02em;">Reminder time <span style="color:var(--do);">*</span></label>
            <input type="time" [value]="reminderTime()" (change)="reminderTime.set($any($event.target).value)" [style.border-color]="saveAttempted() && !reminderTime() ? 'var(--do)' : ''" />
          </div>

          <!-- Urgency -->
          <div style="margin-bottom:0;">
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;letter-spacing:.02em;">Urgency</label>
            <div style="display:flex;gap:10px;">
              <button class="toggle-opt" [class.active-urgent]="urgent()" [class.active-neutral]="!urgent()" (click)="setUrgent(true)">Urgent</button>
              <button class="toggle-opt" [class.active-urgent]="!urgent()" [class.active-neutral]="urgent()" (click)="setUrgent(false)">Less urgent</button>
            </div>
          </div>

          <!-- Importance -->
          <div style="margin-bottom:0;">
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;letter-spacing:.02em;">Importance</label>
            <div style="display:flex;gap:10px;">
              <button class="toggle-opt" [class.active-important]="important()" [class.active-neutral]="!important()" (click)="setImportant(true)">Important</button>
              <button class="toggle-opt" [class.active-important]="!important()" [class.active-neutral]="important()" (click)="setImportant(false)">Less important</button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions" style="display:flex;justify-content:flex-end;gap:12px;margin-top:28px;flex-wrap:wrap;">
          @if (saveAttempted() && !canSave()) {
            <p style="width:100%;margin:0 0 8px;font-size:12.5px;color:var(--do);text-align:right;">Fill in all required fields (category, profile, date and time).</p>
          }
          @if (isEditMode) {
            <button (click)="showDeleteModal.set(true)" style="padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:var(--text-dim);border:1px solid var(--border);">Delete task</button>
          }
          <button (click)="goBack()" style="padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:var(--text-dim);border:1px solid var(--border);">Cancel</button>
          <button (click)="trySave()" style="padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;background:var(--brass);color:#1c1508;border:1px solid var(--brass);" [style.opacity]="canSave() ? '1' : '.6'">Save task</button>
        </div>
      </div>
    </div>

    <!-- Manage categories modal -->
    @if (showCatManager()) {
      <div style="position:fixed;inset:0;background:rgba(6,7,10,.75);z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(440px,100%);background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;box-shadow:0 30px 70px -20px rgba(0,0,0,.6);max-height:90vh;overflow-y:auto;">
          <h2 style="font-family:Fraunces,serif;font-size:19px;margin:0 0 16px;font-weight:600;">Manage categories</h2>

          <!-- Existing categories -->
          <div style="margin-bottom:20px;">
            @for (cat of categoryService.categories(); track cat.id) {
              @if (editingCatId() === cat.id) {
                <div style="background:var(--surface-2);border-radius:10px;padding:12px;margin-bottom:8px;">
            <input type="text" maxlength="25" [value]="editCatName()" (input)="editCatName.set($any($event.target).value)" style="margin-bottom:10px;" />
                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                    @for (c of presetColors; track c) {
                      <button class="swatch" [class.sel]="editCatColor() === c" [style.background]="c" (click)="editCatColor.set(c)"></button>
                    }
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button (click)="saveEditCat()" style="padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;background:var(--brass);color:#1c1508;border:none;cursor:pointer;">Save</button>
                    <button (click)="editingCatId.set(null)" style="padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;background:transparent;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;">Cancel</button>
                  </div>
                </div>
              } @else {
                <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:6px;background:var(--surface-2);border:1px solid var(--border-soft);">
                  <span style="width:14px;height:14px;border-radius:50%;flex-shrink:0;display:block;" [style.background]="cat.color"></span>
                  <span style="flex:1;font-size:13.5px;">{{ cat.name }}</span>
                  <button (click)="startEditCat(cat)" style="width:28px;height:28px;border-radius:7px;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-dim);flex-shrink:0;">
                    <app-icon name="edit" [size]="13" />
                  </button>
                  <button (click)="deleteCat(cat)" style="width:28px;height:28px;border-radius:7px;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-dim);flex-shrink:0;">
                    <app-icon name="trash" [size]="13" />
                  </button>
                </div>
              }
            }
            @if (!categoryService.categories().length) {
              <p style="color:var(--text-faint);font-size:13px;margin:0;">No categories yet.</p>
            }
          </div>

          <!-- Add new category -->
          <div style="border-top:1px solid var(--border);padding-top:16px;">
            <p style="font-size:12px;font-weight:600;color:var(--text-dim);margin:0 0 10px;letter-spacing:.02em;text-transform:uppercase;">Add new</p>
            <input type="text" maxlength="25" [value]="newCatName()" (input)="newCatName.set($any($event.target).value)" placeholder="Category name" style="margin-bottom:10px;" />
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
              @for (c of presetColors; track c) {
                <button class="swatch" [class.sel]="newCatColor() === c" [style.background]="c" (click)="newCatColor.set(c)"></button>
              }
            </div>
            <button (click)="saveNewCat()" [disabled]="!newCatName().trim()" style="width:100%;padding:10px;border-radius:10px;font-size:13.5px;font-weight:600;background:var(--brass);color:#1c1508;border:none;cursor:pointer;" [style.opacity]="newCatName().trim() ? '1' : '.5'">Add category</button>
          </div>

          <div style="display:flex;justify-content:flex-end;margin-top:16px;">
            <button (click)="showCatManager.set(false)" style="padding:10px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:transparent;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;">Done</button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirmation modal -->
    @if (showDeleteModal()) {
      <div style="position:fixed;inset:0;background:rgba(6,7,10,.75);z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(380px,100%);background:var(--surface);border:1px solid var(--do);border-radius:16px;padding:26px;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--do-soft);display:flex;align-items:center;justify-content:center;color:var(--do);margin-bottom:16px;">
            <app-icon name="trash" [size]="20" />
          </div>
          <h2 style="font-family:Fraunces,serif;font-size:18px;margin:0 0 8px;font-weight:600;">Delete this task?</h2>
          <p style="color:var(--text-dim);font-size:13.5px;line-height:1.55;margin:0;">"{{ name() }}" will be permanently removed.</p>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;">
            <button (click)="showDeleteModal.set(false)" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:transparent;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;">Cancel</button>
            <button (click)="deleteTask()" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:var(--do);color:#2a0e08;border:none;cursor:pointer;">Delete task</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TaskFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  readonly taskService = inject(TaskService);
  readonly categoryService = inject(CategoryService);
  readonly profileService = inject(ProfileService);

  readonly presetColors = PRESET_COLORS;

  readonly name = signal('');
  readonly selectedCategoryId = signal<number | null>(null);
  readonly selectedProfileId = signal<number | null>(null);
  readonly dueDate = signal('');
  readonly reminderTime = signal('');
  readonly urgent = signal(false);
  readonly important = signal(false);

  readonly showCatManager = signal(false);
  readonly showDeleteModal = signal(false);
  readonly saveAttempted = signal(false);
  readonly newCatName = signal('');
  readonly newCatColor = signal(PRESET_COLORS[0]);
  readonly editingCatId = signal<number | null>(null);
  readonly editCatName = signal('');
  readonly editCatColor = signal(PRESET_COLORS[0]);

  readonly canSave = computed(() =>
    this.name().trim().length > 0 &&
    this.selectedCategoryId() !== null &&
    this.selectedProfileId() !== null &&
    this.dueDate().length > 0 &&
    this.reminderTime().length > 0
  );

  isEditMode = false;
  private currentTaskId: number | null = null;

  readonly quadrantMeta = computed(() => QUADRANT_META[getQuadrant(this.urgent(), this.important())]);

  constructor() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.currentTaskId = +id;
      db.tasks.get(+id).then(task => {
        if (!task) return;
        this.name.set(task.name);
        this.selectedCategoryId.set(task.categoryId ?? null);
        this.selectedProfileId.set(task.profileId ?? null);
        this.dueDate.set(task.dueDate ?? '');
        this.reminderTime.set(task.reminderTime ?? '');
        this.urgent.set(task.urgent);
        this.important.set(task.important);
      });
    } else {
      this.selectedProfileId.set(this.profileService.selectedProfileId());
    }
  }

  setUrgent(v: boolean): void { this.urgent.set(v); }
  setImportant(v: boolean): void { this.important.set(v); }
  openCategoryModal(): void { this.editingCatId.set(null); this.showCatManager.set(true); }

  trySave(): void {
    this.saveAttempted.set(true);
    if (this.canSave()) this.save();
  }

  startEditCat(cat: Category): void {
    this.editingCatId.set(cat.id!);
    this.editCatName.set(cat.name);
    this.editCatColor.set(cat.color);
  }

  async saveEditCat(): Promise<void> {
    const id = this.editingCatId();
    if (id == null || !this.editCatName().trim()) return;
    await this.categoryService.update(id, { name: this.editCatName().trim(), color: this.editCatColor() });
    this.editingCatId.set(null);
  }

  async deleteCat(cat: Category): Promise<void> {
    if (cat.id == null) return;
    await this.categoryService.delete(cat.id);
    if (this.selectedCategoryId() === cat.id) this.selectedCategoryId.set(null);
  }

  onCategoryChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.selectedCategoryId.set(val ? +val : null);
  }

  onProfileChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.selectedProfileId.set(val ? +val : null);
  }

  goBack(): void { this.location.back(); }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    const now = Date.now();
    const payload = {
      name: this.name().trim(),
      categoryId: this.selectedCategoryId() ?? undefined,
      profileId: this.selectedProfileId() ?? undefined,
      dueDate: this.dueDate() || undefined,
      reminderTime: this.reminderTime() || undefined,
      urgent: this.urgent(),
      important: this.important(),
      updatedAt: now,
    };
    if (this.isEditMode && this.currentTaskId != null) {
      await this.taskService.update(this.currentTaskId, payload);
    } else {
      await this.taskService.add({ ...payload, createdAt: now });
    }
    this.router.navigate(['/tasks']);
  }

  async deleteTask(): Promise<void> {
    if (this.currentTaskId != null) await this.taskService.delete(this.currentTaskId);
    this.router.navigate(['/tasks']);
  }

  async saveNewCat(): Promise<void> {
    if (!this.newCatName().trim()) return;
    const id = await this.categoryService.add(this.newCatName().trim(), this.newCatColor());
    this.selectedCategoryId.set(id);
    this.newCatName.set('');
    this.newCatColor.set(PRESET_COLORS[0]);
  }
}

