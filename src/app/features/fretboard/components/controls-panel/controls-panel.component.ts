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
  template: `
    <div class="controls-panel">

      <!-- ── Note naming ───────────────────────────────────────── -->
      <section class="panel-section">
        <div class="section-header">
          <mat-icon class="section-icon">music_note</mat-icon>
          <span class="section-title">Note Names</span>
        </div>
        <mat-button-toggle-group
          class="full-width-toggle"
          [value]="store.noteNamingSystem()"
          (change)="store.setNoteNamingSystem($event.value)"
          hideSingleSelectionIndicator
        >
          <mat-button-toggle value="alphabetical" matTooltip="C, D, E, F, G, A, B">
            Alphabetical
          </mat-button-toggle>
          <mat-button-toggle value="solfege" matTooltip="Do, Re, Mi, Fa, Sol, La, Si">
            Solfège
          </mat-button-toggle>
        </mat-button-toggle-group>
      </section>

      <mat-divider />

      <!-- ── Color mode ────────────────────────────────────────── -->
      <section class="panel-section">
        <div class="section-header">
          <mat-icon class="section-icon">palette</mat-icon>
          <span class="section-title">Color Mode</span>
        </div>
        <mat-button-toggle-group
          class="full-width-toggle"
          [value]="store.colorMode()"
          (change)="store.setColorMode($event.value)"
          hideSingleSelectionIndicator
        >
          <mat-button-toggle
            value="natural-accidental"
            matTooltip="Natural notes in blue, accidentals in orange"
          >
            Natural / Accidental
          </mat-button-toggle>
          <mat-button-toggle
            value="per-note"
            matTooltip="Each of the 12 pitch classes gets its own unique color"
          >
            Per Note
          </mat-button-toggle>
        </mat-button-toggle-group>

        <!-- Color legend for per-note mode -->
        @if (store.colorMode() === 'per-note') {
          <div class="note-color-legend">
            @for (item of noteColorLegend; track item.name) {
              <div class="legend-item" [matTooltip]="item.name">
                <span class="legend-dot" [style.background-color]="item.color"></span>
                <span class="legend-label">{{ item.name }}</span>
              </div>
            }
          </div>
        }
      </section>

      <mat-divider />

      <!-- ── Display options ───────────────────────────────────── -->
      <section class="panel-section">
        <div class="section-header">
          <mat-icon class="section-icon">visibility</mat-icon>
          <span class="section-title">Display</span>
        </div>
        <mat-slide-toggle
          [checked]="store.showAllNoteNames()"
          (change)="store.toggleShowAllNoteNames()"
          color="primary"
        >
          Reveal all note names
        </mat-slide-toggle>
        <div class="clear-action">
          <button
            mat-stroked-button
            (click)="store.clearAllMarkedPositions()"
            [disabled]="store.markedPositions().length === 0"
          >
            <mat-icon>clear_all</mat-icon>
            Clear marked
          </button>
        </div>
      </section>

      <mat-divider />

      <!-- ── Note generator ────────────────────────────────────── -->
      <section class="panel-section">
        <div class="section-header">
          <mat-icon class="section-icon">shuffle</mat-icon>
          <span class="section-title">Note Generator</span>
        </div>

        <div class="generator-options">
          <mat-checkbox
            [checked]="store.generatorOptions().playSound"
            (change)="store.updateGeneratorOptions({ playSound: $event.checked })"
            color="primary"
          >
            Play sound
          </mat-checkbox>
          <mat-checkbox
            [checked]="store.generatorOptions().markPosition"
            (change)="store.updateGeneratorOptions({ markPosition: $event.checked })"
            color="primary"
          >
            Mark position
          </mat-checkbox>
          <mat-checkbox
            [checked]="store.generatorOptions().showNoteName"
            (change)="store.updateGeneratorOptions({ showNoteName: $event.checked })"
            color="primary"
          >
            Show note name
          </mat-checkbox>
        </div>

        <!-- Interval slider -->
        <div class="interval-control">
          <span class="interval-label">
            Interval: <strong>{{ formattedInterval() }}</strong>
          </span>
          <mat-slider
            class="interval-slider"
            [min]="500"
            [max]="5000"
            [step]="500"
            [discrete]="true"
          >
            <input
              matSliderThumb
              [value]="store.generatorOptions().intervalMs"
              (valueChange)="store.updateGeneratorOptions({ intervalMs: $event })"
            />
          </mat-slider>
        </div>

        <!-- Single-shot and auto-play buttons -->
        <div class="generator-actions">
          <button
            mat-raised-button
            class="random-btn"
            (click)="store.generateSingleRandomNote()"
            matTooltip="Generate one random note"
          >
            <mat-icon>casino</mat-icon>
            Random Note
          </button>

          @if (!store.generatorIsRunning()) {
            <button
              mat-raised-button
              color="primary"
              (click)="store.startGenerator()"
              matTooltip="Start auto-generating notes at the set interval"
            >
              <mat-icon>play_arrow</mat-icon>
              Auto Play
            </button>
          } @else {
            <button
              mat-raised-button
              color="warn"
              (click)="store.stopGenerator()"
            >
              <mat-icon>stop</mat-icon>
              Stop
            </button>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .controls-panel {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .panel-section {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-sys-primary);
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant);
    }

    .full-width-toggle {
      width: 100%;

      mat-button-toggle {
        flex: 1;
        font-size: 12px;
      }
    }

    .note-color-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: default;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    .legend-label {
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }

    .clear-action {
      margin-top: 4px;

      button {
        width: 100%;
        font-size: 13px;
      }
    }

    .generator-options {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .interval-control {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .interval-label {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .interval-slider {
      width: 100%;
    }

    .generator-actions {
      display: flex;
      gap: 8px;

      button {
        flex: 1;
        font-size: 12px;
      }
    }

    .random-btn {
      background: rgba(255, 255, 255, 0.08) !important;
    }
  `],
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
    const ms = this.store.generatorOptions().intervalMs;
    return ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`;
  }
}
