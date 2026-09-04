import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { SettingsService } from '../core/services/settings.service';
import { db } from '../core/db/app-db';

@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div style="position:fixed;inset:0;background:rgba(6,7,10,.92);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(440px,100%);background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:40px 34px;text-align:center;box-shadow:0 40px 100px rgba(0,0,0,.5);">
          <div style="width:52px;height:52px;border-radius:13px;background:conic-gradient(from 45deg,var(--do),var(--delegate),var(--decide),var(--delete),var(--do));display:flex;align-items:center;justify-content:center;margin:0 auto 22px;">
            <span style="width:16px;height:16px;background:var(--surface);border-radius:4px;display:block;"></span>
          </div>
          <h1 style="font-family:Fraunces,serif;font-size:26px;font-weight:600;margin:0 0 10px;">Welcome to PrioQueue</h1>
          <p style="color:var(--text-dim);font-size:14px;line-height:1.6;margin:0 0 28px;">Handle your tasks based on priority, not on noise.</p>

          <div style="text-align:left;margin-bottom:16px;">
            <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-dim);margin-bottom:8px;letter-spacing:.02em;">What's your name?</label>
            <input type="text" [value]="nameInput()" (input)="nameInput.set($any($event.target).value)" (keydown.enter)="save()" placeholder="e.g. Alex" style="font-size:15px;" autofocus />
          </div>

          <p style="color:var(--text-faint);font-size:11.5px;line-height:1.6;margin:0 0 24px;font-family:'IBM Plex Mono',monospace;text-align:left;">
            🔒 Trust us — we save all your details in your browser itself. We don't store anything on our servers.
          </p>

          <button (click)="save()" style="width:100%;padding:14px;background:var(--brass);color:#1c1508;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;border:none;">
            Get started →
          </button>
        </div>
      </div>
    }
  `,
})
export class WelcomeModalComponent {
  private readonly settings = inject(SettingsService);
  readonly nameInput = signal('');
  readonly show = signal(false);

  constructor() {
    db.settings.where('key').equals('userName').first().then(row => {
      if (!row?.value?.trim()) this.show.set(true);
    });
  }

  async save(): Promise<void> {
    const name = this.nameInput().trim();
    if (name) await this.settings.setUserName(name);
    this.show.set(false);
  }
}
