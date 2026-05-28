import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FretboardStore } from '../../../../core/store/fretboard.store';

@Component({
  selector: 'app-controls-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './controls-panel.component.html',
  styleUrl: './controls-panel.component.scss',
})
export class ControlsPanelComponent {
  readonly store = inject(FretboardStore);

  readonly noteColorLegend = [
    { name: 'C',   color: '#FF4444' },
    { name: 'C#',  color: '#FF7700' },
    { name: 'D',   color: '#FFAA00' },
    { name: 'D#',  color: '#FFD700' },
    { name: 'E',   color: '#AACC00' },
    { name: 'F',   color: '#44BB00' },
    { name: 'F#',  color: '#00AA88' },
    { name: 'G',   color: '#0099FF' },
    { name: 'G#',  color: '#4455FF' },
    { name: 'A',   color: '#8833FF' },
    { name: 'A#',  color: '#CC00AA' },
    { name: 'B',   color: '#FF2288' },
  ];

  formattedInterval(): string {
    const intervalMs = this.store.generatorOptions().intervalMs;
    return intervalMs >= 1000 ? `${intervalMs / 1000}s` : `${intervalMs}ms`;
  }
}
