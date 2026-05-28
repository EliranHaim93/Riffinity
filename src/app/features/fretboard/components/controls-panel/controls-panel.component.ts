import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  CHROMATIC_NOTES_ALPHABETICAL,
  CHROMATIC_NOTES_SOLFEGE,
  NOTE_COLOR_BY_INDEX,
} from '../../../../core/models/note.model';
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

  /**
   * Per-note color legend, derived from the canonical note constants so it
   * stays in sync with `NOTE_COLOR_BY_INDEX` and follows the user's current
   * naming choice (alphabetical vs. solfège).
   */
  readonly noteColorLegend = computed(() => {
    const noteNames = this.store.noteNamingSystem() === 'alphabetical'
      ? CHROMATIC_NOTES_ALPHABETICAL
      : CHROMATIC_NOTES_SOLFEGE;

    return noteNames.map((noteName, noteIndex) => ({
      name: noteName,
      color: NOTE_COLOR_BY_INDEX[noteIndex],
    }));
  });

  formattedInterval(): string {
    const intervalMs = this.store.generatorOptions().intervalMs;
    return intervalMs >= 1000 ? `${intervalMs / 1000}s` : `${intervalMs}ms`;
  }
}
