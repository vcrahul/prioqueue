import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { ProfileService } from '../../core/services/profile.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-profile-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  styles: [`
    .pill-btn { display:flex;align-items:center;gap:7px;padding:6px 10px 6px 7px;background:var(--surface-2);border:1px solid var(--border);border-radius:999px;cursor:pointer;color:var(--text); }
    .pill-btn:hover { border-color: var(--brass); }
    .p-opt { display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:8px;font-size:13.5px;font-weight:500;width:100%;text-align:left;color:var(--text-dim);border:none;background:none;cursor:pointer; }
    .p-opt:hover { background:var(--surface-2);color:var(--text); }
    .p-opt.active { color: var(--brass); }
  `],
  template: `
    <div style="position:relative;">
      <button class="pill-btn" (click)="toggleOpen()">
        <div style="width:20px;height:20px;border-radius:50%;flex-shrink:0;" [style.background]="displayColor()"></div>
        <div style="text-align:left;">
          <span style="font-size:10px;color:var(--text-faint);display:block;line-height:1.2;">Profile</span>
          <span style="font-size:12.5px;font-weight:600;line-height:1.2;">{{ displayName() }}</span>
        </div>
        <app-icon name="chevron-down" [size]="12" />
      </button>

      @if (isOpen()) {
        <div (click)="isOpen.set(false)" style="position:fixed;inset:0;z-index:10;"></div>
        <div style="position:absolute;right:0;top:calc(100% + 8px);background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:8px;min-width:180px;z-index:11;box-shadow:0 8px 24px rgba(0,0,0,.4);">
          <button class="p-opt" [class.active]="profileService.selectedProfileId() === null" (click)="select(null)">
            <div style="width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,var(--do),var(--delegate),var(--decide));flex-shrink:0;"></div>
            All
          </button>
          @for (p of profileService.profiles(); track p.id) {
            <button class="p-opt" [class.active]="profileService.selectedProfileId() === p.id" (click)="select(p.id!)">
              <div style="width:18px;height:18px;border-radius:50%;flex-shrink:0;" [style.background]="p.color"></div>
              {{ p.name }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class ProfilePillComponent {
  readonly profileService = inject(ProfileService);
  readonly isOpen = signal(false);

  readonly displayName = computed(() => {
    const name = this.profileService.selectedProfile()?.name ?? 'All';
    return name.length > 12 ? name.slice(0, 11) + '…' : name;
  });
  readonly displayColor = computed(() =>
    this.profileService.selectedProfile()?.color ??
    'linear-gradient(135deg,var(--do),var(--delegate),var(--decide))'
  );

  toggleOpen(): void { this.isOpen.update(v => !v); }

  select(id: number | null): void {
    this.profileService.selectProfile(id);
    this.isOpen.set(false);
  }
}
