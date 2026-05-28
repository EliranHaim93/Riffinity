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
  template: `
    <div class="timer-widget">
      <div class="timer-header">
        <mat-icon class="timer-icon">timer</mat-icon>
        <span class="timer-title">Practice Timer</span>
      </div>

      <!-- Circular progress display -->
      <div class="timer-display">
        <svg class="progress-ring" viewBox="0 0 120 120">
          <!-- Track circle -->
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            stroke-width="6"
          />
          <!-- Progress arc -->
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            [attr.stroke]="progressColor()"
            stroke-width="6"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset()"
            transform="rotate(-90 60 60)"
            style="transition: stroke-dashoffset 1s linear"
          />
        </svg>
        <div class="time-text">
          <span class="minutes-seconds">{{ formattedTimeRemaining() }}</span>
          @if (store.timerIsRunning()) {
            <span class="timer-status-label">remaining</span>
          } @else if (store.timerElapsedSeconds() > 0) {
            <span class="timer-status-label done">done!</span>
          }
        </div>
      </div>

      <!-- Duration presets (only visible when not running and not started) -->
      @if (!store.timerIsRunning() && store.timerElapsedSeconds() === 0) {
        <div class="duration-presets">
          @for (preset of durationPresets; track preset.seconds) {
            <button
              mat-stroked-button
              class="preset-btn"
              [class.is-selected]="store.timerDurationSeconds() === preset.seconds"
              (click)="store.setTimerDurationSeconds(preset.seconds)"
            >
              {{ preset.label }}
            </button>
          }
        </div>
      }

      <!-- Controls -->
      <div class="timer-controls">
        @if (!store.timerIsRunning()) {
          @if (store.timerRemainingSeconds() > 0) {
            <button
              mat-raised-button
              color="primary"
              class="control-btn"
              (click)="store.startTimer()"
            >
              <mat-icon>{{ store.timerElapsedSeconds() === 0 ? 'play_arrow' : 'play_arrow' }}</mat-icon>
              {{ store.timerElapsedSeconds() === 0 ? 'Start' : 'Resume' }}
            </button>
          }
        } @else {
          <button
            mat-raised-button
            class="control-btn"
            (click)="store.pauseTimer()"
          >
            <mat-icon>pause</mat-icon>
            Pause
          </button>
        }

        <button
          mat-icon-button
          matTooltip="Reset timer"
          (click)="store.resetTimer()"
          [disabled]="store.timerElapsedSeconds() === 0 && !store.timerIsRunning()"
          class="reset-btn"
        >
          <mat-icon>replay</mat-icon>
        </button>
      </div>

      <!-- Progress bar text -->
      @if (store.timerIsRunning() || store.timerElapsedSeconds() > 0) {
        <div class="elapsed-text">
          Elapsed: {{ formattedElapsed() }} / {{ formattedTotal() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .timer-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .timer-header {
      display: flex;
      align-items: center;
      gap: 8px;
      align-self: flex-start;
    }

    .timer-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-sys-primary);
    }

    .timer-title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant);
    }

    .timer-display {
      position: relative;
      width: 120px;
      height: 120px;
    }

    .progress-ring {
      width: 100%;
      height: 100%;
    }

    .time-text {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    .minutes-seconds {
      font-size: 26px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--mat-sys-on-surface);
      letter-spacing: -1px;
    }

    .timer-status-label {
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.done {
        color: var(--mat-sys-primary);
        font-weight: 600;
      }
    }

    .duration-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
    }

    .preset-btn {
      font-size: 12px;
      padding: 0 10px;
      min-width: unset;
      height: 30px;
      border-radius: 15px !important;

      &.is-selected {
        background: var(--mat-sys-primary-container) !important;
        color: var(--mat-sys-on-primary-container) !important;
        border-color: var(--mat-sys-primary) !important;
      }
    }

    .timer-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .control-btn {
      min-width: 110px;
    }

    .reset-btn {
      opacity: 0.7;

      &:not([disabled]):hover {
        opacity: 1;
      }
    }

    .elapsed-text {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
    }
  `],
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
