export type NoteNamingSystem = 'alphabetical' | 'solfege';
export type ColorMode = 'natural-accidental' | 'per-note';

export interface GeneratorOptions {
  playSound: boolean;
  markPosition: boolean;
  showNoteName: boolean;
  intervalMs: number;
}

export const CHROMATIC_NOTES_ALPHABETICAL: readonly string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export const CHROMATIC_NOTES_SOLFEGE: readonly string[] = [
  'Do',
  'Do#',
  'Ré',
  'Ré#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
];

// Indices of natural (white-key) notes in the chromatic scale: C D E F G A B
export const NATURAL_NOTE_INDICES = new Set([0, 2, 4, 5, 7, 9, 11]);

// One unique color per chromatic pitch class, used in per-note color mode
export const NOTE_COLOR_BY_INDEX: readonly string[] = [
  '#FF4444', // C  – Red
  '#FF7700', // C# – Orange
  '#FFAA00', // D  – Amber
  '#FFD700', // D# – Gold
  '#AACC00', // E  – Yellow-Green
  '#44BB00', // F  – Green
  '#00AA88', // F# – Teal
  '#0099FF', // G  – Sky Blue
  '#4455FF', // G# – Indigo
  '#8833FF', // A  – Purple
  '#CC00AA', // A# – Magenta
  '#FF2288', // B  – Hot Pink
];

// Colors for natural/accidental split color mode
export const NATURAL_NOTE_COLOR = '#64B5F6'; // Light blue
export const ACCIDENTAL_NOTE_COLOR = '#FF8A65'; // Deep orange

export interface FretPosition {
  stringNumber: number; // 1 = high e, 6 = low E
  fretNumber: number; // 0 = open string, 1–12 = fretted
  noteIndex: number; // 0–11, where C = 0
  octave: number;
  frequencyHz: number;
}

export interface GuitarStringConfig {
  stringNumber: number;
  stringName: string; // 'e' | 'B' | 'G' | 'D' | 'A' | 'E'
  openNoteIndex: number; // index of the note in the chromatic scale
  openOctave: number; // octave of the note
  visualThicknessPx: number; // for the string line visual
}

/**
 * Standard EADGBE tuning.
 * stringNumber 1 = high e (displayed at top), stringNumber 6 = low E (displayed at bottom).
 */
export const GUITAR_STRING_CONFIGS: readonly GuitarStringConfig[] = [
  { stringNumber: 1, stringName: 'e', openNoteIndex: 4, openOctave: 4, visualThicknessPx: 1 },
  { stringNumber: 2, stringName: 'B', openNoteIndex: 11, openOctave: 3, visualThicknessPx: 1.5 },
  { stringNumber: 3, stringName: 'G', openNoteIndex: 7, openOctave: 3, visualThicknessPx: 2 },
  { stringNumber: 4, stringName: 'D', openNoteIndex: 2, openOctave: 3, visualThicknessPx: 2.5 },
  { stringNumber: 5, stringName: 'A', openNoteIndex: 9, openOctave: 2, visualThicknessPx: 3 },
  { stringNumber: 6, stringName: 'E', openNoteIndex: 4, openOctave: 2, visualThicknessPx: 3.5 },
];

// Fret inlay positions (matching a real guitar neck)
export const SINGLE_DOT_FRETS = new Set([3, 5, 7, 9]);
export const DOUBLE_DOT_FRETS = new Set([12]);

export const DEFAULT_VISIBLE_FRET_COUNT = 12;

// Equal-temperament reference: A4 = 440 Hz
export const A4_FREQUENCY_HZ = 440;
export const A4_NOTE_INDEX = 9; // A is index 9 in chromatic scale (C=0)
export const A4_OCTAVE = 4;
