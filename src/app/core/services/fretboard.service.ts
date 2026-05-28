import { Injectable } from '@angular/core';

import {
  A4_FREQUENCY_HZ,
  A4_NOTE_INDEX,
  A4_OCTAVE,
  CHROMATIC_NOTES_ALPHABETICAL,
  CHROMATIC_NOTES_SOLFEGE,
  DEFAULT_VISIBLE_FRET_COUNT,
  FretPosition,
  GUITAR_STRING_CONFIGS,
  NoteNamingSystem,
} from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class FretboardService {

  /**
   * Calculates the frequency in Hz for a given note index and octave
   * using the equal-temperament formula relative to A4 = 440 Hz.
   */
  calculateFrequencyHz(noteIndex: number, octave: number): number {
    const semitonesFromA4 = (noteIndex - A4_NOTE_INDEX) + (octave - A4_OCTAVE) * 12;
    return A4_FREQUENCY_HZ * Math.pow(2, semitonesFromA4 / 12);
  }

  /**
   * Returns the note index (0–11) and octave for a given open string
   * tuning after advancing the specified number of frets (semitones).
   */
  getNoteAtFret(
    openNoteIndex: number,
    openOctave: number,
    fretNumber: number,
  ): { noteIndex: number; octave: number } {
    const totalSemitones = openNoteIndex + fretNumber;
    const noteIndex = totalSemitones % 12;
    const octaveOffset = Math.floor(totalSemitones / 12);
    return { noteIndex, octave: openOctave + octaveOffset };
  }

  /**
   * Builds a 2D array of FretPosition objects: one array per string,
   * each containing positions for frets 0 (open) through visibleFretCount.
   */
  buildFretboardPositions(
    visibleFretCount = DEFAULT_VISIBLE_FRET_COUNT,
  ): FretPosition[][] {
    return GUITAR_STRING_CONFIGS.map(guitarString => {
      return Array.from({ length: visibleFretCount + 1 }, (_, fretIndex) => {
        const { noteIndex, octave } = this.getNoteAtFret(
          guitarString.openNoteIndex,
          guitarString.openOctave,
          fretIndex,
        );
        return {
          stringNumber: guitarString.stringNumber,
          fretNumber: fretIndex,
          noteIndex,
          octave,
          frequencyHz: this.calculateFrequencyHz(noteIndex, octave),
        };
      });
    });
  }

  /** Returns the display name for a note index in the requested naming system. */
  getNoteName(noteIndex: number, namingSystem: NoteNamingSystem): string {
    return namingSystem === 'alphabetical'
      ? CHROMATIC_NOTES_ALPHABETICAL[noteIndex]
      : CHROMATIC_NOTES_SOLFEGE[noteIndex];
  }

  /** Picks a random position anywhere on the visible fretboard. */
  getRandomFretPosition(visibleFretCount = DEFAULT_VISIBLE_FRET_COUNT): FretPosition {
    const randomStringIndex = Math.floor(Math.random() * GUITAR_STRING_CONFIGS.length);
    const randomFretNumber = Math.floor(Math.random() * (visibleFretCount + 1));
    const guitarString = GUITAR_STRING_CONFIGS[randomStringIndex];
    const { noteIndex, octave } = this.getNoteAtFret(
      guitarString.openNoteIndex,
      guitarString.openOctave,
      randomFretNumber,
    );
    return {
      stringNumber: guitarString.stringNumber,
      fretNumber: randomFretNumber,
      noteIndex,
      octave,
      frequencyHz: this.calculateFrequencyHz(noteIndex, octave),
    };
  }

  /** Returns true when two positions refer to the same string + fret. */
  isSamePosition(positionA: FretPosition, positionB: FretPosition | null): boolean {
    if (!positionB) return false;
    return (
      positionA.stringNumber === positionB.stringNumber &&
      positionA.fretNumber === positionB.fretNumber
    );
  }

  /** Builds a unique string key for a position, useful for Set lookups. */
  buildPositionKey(position: FretPosition): string {
    return `${position.stringNumber}-${position.fretNumber}`;
  }
}
