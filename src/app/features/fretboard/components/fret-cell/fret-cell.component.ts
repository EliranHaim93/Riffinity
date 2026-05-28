import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  ACCIDENTAL_NOTE_COLOR,
  CHROMATIC_NOTES_ALPHABETICAL,
  CHROMATIC_NOTES_SOLFEGE,
  ColorMode,
  FretPosition,
  NATURAL_NOTE_COLOR,
  NATURAL_NOTE_INDICES,
  NOTE_COLOR_BY_INDEX,
  NoteNamingSystem,
} from '../../../../core/models/note.model';

@Component({
  selector: 'app-fret-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-open-string]': 'position().fretNumber === 0',
    '[class.has-visible-dot]': 'isDotVisible()',
  },
  templateUrl: './fret-cell.component.html',
  styleUrl: './fret-cell.component.scss',
})
export class FretCellComponent {
  readonly position = input.required<FretPosition>();
  readonly isMarked = input(false);
  readonly isGenerated = input(false);
  readonly colorMode = input<ColorMode>('natural-accidental');
  readonly noteNamingSystem = input<NoteNamingSystem>('alphabetical');
  readonly showNoteName = input(false);
  readonly stringThicknessPx = input(2);

  readonly positionClicked = output<FretPosition>();

  readonly isDotVisible = computed(
    () => this.isMarked() || this.isGenerated() || this.showNoteName(),
  );

  readonly noteName = computed(() => {
    const noteIndex = this.position().noteIndex;
    return this.noteNamingSystem() === 'alphabetical'
      ? CHROMATIC_NOTES_ALPHABETICAL[noteIndex]
      : CHROMATIC_NOTES_SOLFEGE[noteIndex];
  });

  readonly dotColor = computed(() => {
    const noteIndex = this.position().noteIndex;
    if (this.colorMode() === 'per-note') {
      return NOTE_COLOR_BY_INDEX[noteIndex];
    }
    return NATURAL_NOTE_INDICES.has(noteIndex) ? NATURAL_NOTE_COLOR : ACCIDENTAL_NOTE_COLOR;
  });

  readonly tooltipText = computed(() => {
    const position = this.position();
    const label = this.noteName();
    return `String ${position.stringNumber}, Fret ${position.fretNumber}: ${label}${position.octave}`;
  });

  handleClick(): void {
    this.positionClicked.emit(this.position());
  }
}
