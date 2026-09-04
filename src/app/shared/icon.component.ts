import { Component, ChangeDetectionStrategy, ElementRef, effect, inject, input } from '@angular/core';
import { ICON_PATHS } from './icons';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Write SVG directly to the host element via native DOM — avoids DomSanitizer stripping SVG attributes
  host: { style: 'display:inline-flex;align-items:center;flex-shrink:0;' },
  template: '',
})
export class IconComponent {
  name = input.required<string>();
  size = input<number>(18);
  strokeWidth = input<number>(1.8);

  private readonly el = inject(ElementRef);

  constructor() {
    effect(() => {
      const paths = ICON_PATHS[this.name()] ?? '';
      (this.el.nativeElement as HTMLElement).innerHTML =
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${this.strokeWidth()}" width="${this.size()}" height="${this.size()}" style="display:block;overflow:visible;">${paths}</svg>`;
    });
  }
}
