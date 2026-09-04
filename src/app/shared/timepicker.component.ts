import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-timepicker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  styles: [`
    :host { display:block; }
    .tp { display:inline-flex;align-items:stretch;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:border-color .15s; }
    .tp.err { border-color:var(--do); }
    .seg { display:flex;flex-direction:column;align-items:center;padding:10px 28px;gap:7px; }
    .arr { width:34px;height:34px;border-radius:8px;background:var(--surface-3);border:1px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-dim);transition:all .12s;flex-shrink:0; }
    .arr:hover { background:var(--brass-soft);color:var(--brass);border-color:var(--brass); }
    .digit { font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:700;line-height:1;color:var(--text);min-width:54px;text-align:center;letter-spacing:.02em;cursor:default; }
    .seg-lbl { font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--text-faint); }
    .sep { display:flex;align-items:center;justify-content:center;padding-bottom:24px; }
  `],
  template: `
    <div class="tp" [class.err]="error()">
      <div class="seg">
        <button class="arr" (click)="changeH(1)"><app-icon name="chevron-up" [size]="15" /></button>
        <span class="digit">{{ padH() }}</span>
        <button class="arr" (click)="changeH(-1)"><app-icon name="chevron-down" [size]="15" /></button>
        <span class="seg-lbl">hour</span>
      </div>
      <div class="sep">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:700;color:var(--brass);">:</span>
      </div>
      <div class="seg">
        <button class="arr" (click)="changeM(1)"><app-icon name="chevron-up" [size]="15" /></button>
        <span class="digit">{{ padM() }}</span>
        <button class="arr" (click)="changeM(-1)"><app-icon name="chevron-down" [size]="15" /></button>
        <span class="seg-lbl">min</span>
      </div>
    </div>
  `,
})
export class TimepickerComponent {
  value = input<string>('00:00');
  error = input<boolean>(false);
  valueChange = output<string>();

  readonly h = computed(() => +(this.value().split(':')[0] ?? 0) || 0);
  readonly m = computed(() => +(this.value().split(':')[1] ?? 0) || 0);
  readonly padH = computed(() => String(this.h()).padStart(2, '0'));
  readonly padM = computed(() => String(this.m()).padStart(2, '0'));

  changeH(delta: number): void {
    this.emit(((this.h() + delta) + 24) % 24, this.m());
  }

  changeM(delta: number): void {
    // 5-minute steps
    this.emit(this.h(), ((this.m() + delta * 5) + 60) % 60);
  }

  private emit(h: number, m: number): void {
    this.valueChange.emit(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}
