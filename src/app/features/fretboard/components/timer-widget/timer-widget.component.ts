import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FretboardStore } from '../../../../core/store/fretboard.store';

interface TimerPreset {
  label: string;
  seconds: number;
}

@Component({
  selector: 'app-timer-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './timer-widget.component.html',
  styleUrl: './timer-widget.component.scss',
})
export class TimerWidgetComponent {
  readonly store = inject(FretboardStore);

  readonly durationPresets: TimerPreset[] = [
    { label: '1 min',  seconds: 60  },
    { label: '3 min',  seconds: 180 },
    { label: '5 min',  seconds: 300 },
    { label: '10 min', seconds: 600 },
    { label: '15 min', seconds: 900 },
  ];

  /** SVG circle circumference for r=50 */
  readonly circumference = 2 * Math.PI * 50;

  readonly dashOffset = computed(() => {
    const progress = this.store.timerProgressPercent() / 100;
    return this.circumference * (1 - progress);
  });

  readonly progressColor = computed(() => {
    const percent = this.store.timerProgressPercent();
    if (percent >= 100) return '#4CAF50';
    if (percent >= 75) return '#FF9800';
    return 'var(--mat-sys-primary)';
  });

  readonly formattedTimeRemaining = computed(() => {
    const remaining = this.store.timerRemainingSeconds();
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  readonly formattedElapsed = computed(() => {
    const elapsed = this.store.timerElapsedSeconds();
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  readonly formattedTotal = computed(() => {
    const total = this.store.timerDurationSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });
}
