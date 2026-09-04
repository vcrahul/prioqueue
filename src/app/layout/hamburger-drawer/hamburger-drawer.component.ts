import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef } from '@angular/core';
import { DrawerService } from '../../core/services/drawer.service';
import { ExportImportService } from '../../core/services/export-import.service';
import { SettingsService } from '../../core/services/settings.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-hamburger-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  styles: [`
    .d-item { display:flex;align-items:center;gap:12px;padding:13px 12px;border-radius:10px;color:var(--text);font-size:14px;font-weight:500;cursor:pointer;margin-bottom:4px;border:none;background:none;width:100%;text-align:left; }
    .d-item:hover { background:var(--surface-2); }
    .d-name { background:var(--surface-2);cursor:default; }
    .d-name:hover { background:var(--surface-2); }
  `],
  template: `
    <div (click)="drawer.close()" style="position:fixed;inset:0;background:rgba(6,7,10,.55);z-index:40;display:flex;">
      <div (click)="$event.stopPropagation()" style="width:300px;max-width:85vw;height:100%;background:var(--surface);border-right:1px solid var(--border);padding:26px 20px;display:flex;flex-direction:column;overflow-y:auto;">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:26px;">
          <span style="font-family:Fraunces,serif;font-size:18px;font-weight:600;">Menu</span>
          <button (click)="drawer.close()" style="width:30px;height:30px;border-radius:8px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-dim);cursor:pointer;">
            <app-icon name="x" [size]="14" />
          </button>
        </div>

        <div class="d-item d-name">
          <app-icon name="user" [size]="17" style="color:var(--brass)" />
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ settings.userName() || 'Your name' }}</div>
            <div style="font-size:11px;color:var(--text-faint);">Stored locally</div>
          </div>
          <button (click)="toggleEdit()" style="font-size:11.5px;color:var(--brass);font-weight:500;flex-shrink:0;cursor:pointer;">Edit</button>
        </div>

        @if (editingName()) {
          <div style="display:flex;gap:8px;padding:4px 4px 8px;">
            <input #nameField type="text" [value]="nameInput()" (input)="nameInput.set($any($event.target).value)" (keydown.enter)="saveName()" placeholder="Your name" style="flex:1;min-width:0;" />
            <button (click)="saveName()" style="padding:8px 14px;background:var(--brass);color:#1c1508;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;flex-shrink:0;">Save</button>
          </div>
        }

        <button class="d-item" (click)="onImport()">
          <app-icon name="import" [size]="17" style="color:var(--text-dim)" />
          Import
        </button>
        <button class="d-item" (click)="onExport()">
          <app-icon name="export" [size]="17" style="color:var(--text-dim)" />
          <span>Export</span>
          <span style="margin-left:auto;color:var(--text-faint);font-size:11px;font-family:'IBM Plex Mono',monospace;">.json</span>
        </button>
        <button class="d-item" (click)="showAbout.set(true)">
          <app-icon name="info" [size]="17" style="color:var(--text-dim)" />
          About
        </button>

        <div style="margin-top:auto;padding-top:16px;font-size:11px;color:var(--text-faint);font-family:'IBM Plex Mono',monospace;padding-left:12px;">
          PrioQueue · v1.0
        </div>
      </div>
    </div>

    <input #fileInput type="file" accept=".json" style="display:none;" (change)="onFileSelected($event)" />

    @if (showImportWarning()) {
      <div style="position:fixed;inset:0;background:rgba(6,7,10,.75);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(420px,100%);background:var(--surface);border:1px solid var(--delegate);border-radius:16px;padding:26px;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--delegate-soft);display:flex;align-items:center;justify-content:center;color:var(--delegate);margin-bottom:16px;">
            <app-icon name="alert-triangle" [size]="20" />
          </div>
          <h2 style="font-family:Fraunces,serif;font-size:18px;margin:0 0 8px;font-weight:600;">Import will merge with existing data</h2>
          <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;margin:0 0 6px;">You already have tasks saved. Importing may <b style="color:var(--delegate)">overwrite or remove existing records</b> where they conflict.</p>
          <p style="color:var(--text-dim);font-size:13.5px;margin:0;">Proceed at your own risk.</p>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px;">
            <button (click)="showImportWarning.set(false)" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:transparent;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;">Cancel</button>
            <button (click)="confirmImport()" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:var(--do);color:#2a0e08;border:none;cursor:pointer;">Import anyway</button>
          </div>
        </div>
      </div>
    }

    @if (showAbout()) {
      <div (click)="showAbout.set(false)" style="position:fixed;inset:0;background:rgba(6,7,10,.75);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div (click)="$event.stopPropagation()" style="width:min(380px,100%);background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:26px;">
          <h2 style="font-family:Fraunces,serif;font-size:19px;margin:0 0 10px;font-weight:600;">PrioQueue</h2>
          <p style="color:var(--text-dim);font-size:13.5px;line-height:1.6;margin:0 0 12px;">Handle your tasks based on priority not on noise. Uses the Eisenhower Matrix to help you focus on what truly matters.</p>
          <p style="color:var(--text-faint);font-size:12px;font-family:'IBM Plex Mono',monospace;margin:0 0 20px;">v1.0.0 · All data stored locally in your browser</p>
          <div style="display:flex;justify-content:flex-end;">
            <button (click)="showAbout.set(false)" style="padding:11px 20px;border-radius:10px;font-size:13.5px;font-weight:600;background:var(--brass);color:#1c1508;border:none;cursor:pointer;">Got it</button>
          </div>
        </div>
      </div>
    }

    @if (importResult()) {
      <div style="position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 20px;font-size:13px;z-index:60;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.4);">
        ✓ Imported {{ importResult()!.tasks }} tasks, {{ importResult()!.profiles }} profiles
      </div>
    }
  `,
})
export class HamburgerDrawerComponent {
  readonly drawer = inject(DrawerService);
  readonly exportImport = inject(ExportImportService);
  readonly settings = inject(SettingsService);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  readonly showImportWarning = signal(false);
  readonly showAbout = signal(false);
  readonly editingName = signal(false);
  readonly nameInput = signal('');
  readonly importResult = signal<{ tasks: number; profiles: number } | null>(null);

  toggleEdit(): void {
    this.nameInput.set(this.settings.userName());
    this.editingName.update(v => !v);
  }

  async saveName(): Promise<void> {
    await this.settings.setUserName(this.nameInput());
    this.editingName.set(false);
  }

  async onImport(): Promise<void> {
    const hasData = await this.exportImport.hasData();
    if (hasData) {
      this.showImportWarning.set(true);
    } else {
      this.fileInput().nativeElement.click();
    }
  }

  confirmImport(): void {
    this.showImportWarning.set(false);
    this.fileInput().nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const result = await this.exportImport.importAll(file);
      this.importResult.set(result);
      setTimeout(() => this.importResult.set(null), 3000);
      this.drawer.close();
    } catch {
      alert('Import failed. Please check the file format.');
    }
  }

  async onExport(): Promise<void> {
    await this.exportImport.exportAll();
    this.drawer.close();
  }
}
