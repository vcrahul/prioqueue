import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { ProfileService } from '../../core/services/profile.service';
import { TaskService } from '../../core/services/task.service';
import { DrawerService } from '../../core/services/drawer.service';
import { ProfilePillComponent } from '../../layout/profile-pill/profile-pill.component';
import { IconComponent } from '../../shared/icon.component';
import { Profile, PROFILE_COLORS } from './models/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfilePillComponent, IconComponent],
  styles: [`
    :host { display:flex;flex-direction:column;height:100%; }
    .hamburger-btn:hover { color:var(--brass)!important;border-color:var(--brass)!important; }
    .icon-btn { width:34px;height:34px;border-radius:9px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-dim);flex-shrink:0; }
    .icon-btn:hover { color:var(--brass);border-color:var(--brass); }
    .icon-btn.danger:hover { color:var(--do);border-color:var(--do); }
    .sel-btn { padding:9px 16px;border-radius:9px;font-size:12.5px;font-weight:600;background:var(--surface-2);border:1px solid var(--border);color:var(--text-dim);cursor:pointer;flex-shrink:0; }
    .sel-btn.selected { background:var(--brass);color:#1c1508;border-color:var(--brass); }
    .swatch { width:28px;height:28px;border-radius:50%;cursor:pointer;border:2px solid transparent;flex-shrink:0; }
    .swatch.sel { border-color:var(--text)!important; }
    .add-row { display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 18px;border:1.5px dashed var(--border);border-radius:14px;color:var(--text-faint);cursor:pointer;font-size:13.5px;font-weight:500;margin-top:6px;background:none;width:100%; }
    .add-row:hover { border-color:var(--brass);color:var(--brass); }
    @media (max-width:720px) {
      .topbar { padding:16px 18px!important; }
      .topbar h1 { font-size:19px!important; }
      .content { padding:16px 16px 24px!important; }
      .profile-row { padding:13px 14px!important;gap:12px!important; }
    }
  `],
  template: `
    <div class="topbar" style="display:flex;align-items:center;justify-content:space-between;padding:22px 34px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:16px;">
        <button class="hamburger-btn" (click)="drawer.open()" style="width:38px;height:38px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-dim);flex-shrink:0;">
          <app-icon name="menu" [size]="18" />
        </button>
        <h1 style="font-family:Fraunces,serif;font-weight:600;font-size:24px;margin:0;">Profiles</h1>
      </div>
      <app-profile-pill style="flex-shrink:0;margin-left:12px;" />
    </div>

    <div class="content" style="flex:1;overflow-y:auto;padding:30px 34px;">
      @if (profileService.profiles().length === 0) {
        <p style="color:var(--text-faint);font-size:14px;margin:0 0 16px;">No profiles yet. Create one to organize your tasks.</p>
      }

      @for (profile of profileService.profiles(); track profile.id) {
        <div class="profile-row" style="display:flex;align-items:center;gap:16px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px;margin-bottom:12px;" [style.border-color]="profileService.selectedProfileId() === profile.id ? 'var(--brass)' : 'var(--border)'" [style.background]="profileService.selectedProfileId() === profile.id ? 'var(--brass-soft)' : 'var(--surface)'">
          <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-weight:600;font-size:17px;flex-shrink:0;" [style.background]="profile.color + '22'" [style.color]="profile.color">
            {{ profile.name.charAt(0).toUpperCase() }}
          </div>
          <div style="flex:1;min-width:0;">
            <h3 style="margin:0 0 3px;font-family:Fraunces,serif;font-size:16px;font-weight:600;">{{ profile.name }}</h3>
            <span style="font-size:12px;color:var(--text-faint);">{{ taskCountFor(profile.id!) }} tasks</span>
          </div>
          <button class="sel-btn" [class.selected]="profileService.selectedProfileId() === profile.id" (click)="profileService.selectProfile(profile.id!)">
            {{ profileService.selectedProfileId() === profile.id ? 'Selected' : 'Select' }}
          </button>
          <div style="display:flex;gap:8px;">
            <button class="icon-btn" (click)="startEdit(profile)">
              <app-icon name="edit" [size]="15" />
            </button>
            <button class="icon-btn danger" (click)="confirmDelete(profile)">
              <app-icon name="trash" [size]="15" />
            </button>
          </div>
        </div>
      }

      <button class="add-row" (click)="openAdd()">
        <app-icon name="plus" [size]="16" />
        Add profile
      </button>
    </div>

    <!-- Add / Edit profile modal -->
    @if (showModal()) {
      <div style="position:fixed;inset:0;background:rgba(6,7,10,.75);z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(400px,100%);background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;box-shadow:0 30px 70px -20px rgba(0,0,0,.6);">
          <h2 style="font-family:Fraunces,serif;font-size:19px;margin:0 0 18px;font-weight:600;">{{ editingProfile() ? 'Edit profile' : 'Add profile' }}</h2>
          <div style="margin-bottom:18px;">
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;">Name</label>
            <input type="text" maxlength="12" [value]="formName()" (input)="formName.set($any($event.target).value)" placeholder="e.g. Work" />
          </div>
          <div>
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;">Colour</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              @for (c of profileColors; track c) {
                <button class="swatch" [class.sel]="formColor() === c" [style.background]="c" (click)="formColor.set(c)"></button>
              }
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;">
            <button (click)="closeModal()" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:transparent;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;">Cancel</button>
            <button (click)="saveProfile()" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:var(--brass);color:#1c1508;border:none;cursor:pointer;">Save profile</button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirmation -->
    @if (deletingProfile()) {
      <div style="position:fixed;inset:0;background:rgba(6,7,10,.75);z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(380px,100%);background:var(--surface);border:1px solid var(--do);border-radius:16px;padding:26px;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--do-soft);display:flex;align-items:center;justify-content:center;color:var(--do);margin-bottom:16px;">
            <app-icon name="trash" [size]="20" />
          </div>
          <h2 style="font-family:Fraunces,serif;font-size:18px;margin:0 0 8px;font-weight:600;">Delete "{{ deletingProfile()!.name }}"?</h2>
          <p style="color:var(--text-dim);font-size:13.5px;line-height:1.55;margin:0;">This profile will be removed. Tasks assigned to it will remain but become unassigned.</p>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;">
            <button (click)="deletingProfile.set(null)" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:transparent;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;">Cancel</button>
            <button (click)="deleteProfile()" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:var(--do);color:#2a0e08;border:none;cursor:pointer;">Delete profile</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfileComponent {
  readonly profileService = inject(ProfileService);
  readonly drawer = inject(DrawerService);
  private readonly taskService = inject(TaskService);

  readonly profileColors = PROFILE_COLORS;

  readonly showModal = signal(false);
  readonly editingProfile = signal<Profile | null>(null);
  readonly formName = signal('');
  readonly formColor = signal(PROFILE_COLORS[0]);
  readonly deletingProfile = signal<Profile | null>(null);

  private readonly tasksByProfile = computed(() => {
    const m = new Map<number, number>();
    this.taskService.tasks().forEach(t => {
      if (t.profileId != null) m.set(t.profileId, (m.get(t.profileId) ?? 0) + 1);
    });
    return m;
  });

  taskCountFor(profileId: number): number {
    return this.tasksByProfile().get(profileId) ?? 0;
  }

  openAdd(): void {
    this.editingProfile.set(null);
    this.formName.set('');
    this.formColor.set(PROFILE_COLORS[0]);
    this.showModal.set(true);
  }

  startEdit(p: Profile): void {
    this.editingProfile.set(p);
    this.formName.set(p.name);
    this.formColor.set(p.color);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  async saveProfile(): Promise<void> {
    if (!this.formName().trim()) return;
    const editing = this.editingProfile();
    if (editing?.id != null) {
      await this.profileService.update(editing.id, { name: this.formName().trim(), color: this.formColor() });
    } else {
      await this.profileService.add(this.formName().trim(), this.formColor());
    }
    this.showModal.set(false);
  }

  confirmDelete(p: Profile): void { this.deletingProfile.set(p); }

  async deleteProfile(): Promise<void> {
    const p = this.deletingProfile();
    if (p?.id != null) await this.profileService.delete(p.id);
    this.deletingProfile.set(null);
  }
}
