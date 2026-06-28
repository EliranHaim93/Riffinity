import { ChangeDetectionStrategy, Component } from '@angular/core';

let brandInstanceCounter = 0;

@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.scss',
})
export class BrandComponent {
  /**
   * Unique per-instance prefix for the SVG gradient ids. The brand renders in
   * more than one place at once (shell header + sidebar), so static ids would
   * collide and the second logo would reference the first (hidden) gradients,
   * losing its colors.
   */
  protected readonly uid = `riffinity-brand-${brandInstanceCounter++}`;
}
