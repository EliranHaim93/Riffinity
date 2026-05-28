import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import {
  ColorMode,
  DEFAULT_VISIBLE_FRET_COUNT,
  FretPosition,
  GeneratorOptions,
  NoteNamingSystem,
} from '../models/note.model';
import { AudioService } from '../services/audio.service';
import { FretboardService } from '../services/fretboard.service';

interface FretboardState {
  noteNamingSystem: NoteNamingSystem;
  colorMode: ColorMode;
  showAllNoteNames: boolean;
  markedPositions: FretPosition[];
  visibleFretCount: number;

  timerDurationSeconds: number;
  timerElapsedSeconds: number;
  timerIsRunning: boolean;

  generatorIsRunning: boolean;
  generatorOptions: GeneratorOptions;
  currentGeneratedPosition: FretPosition | null;
  displayedGeneratedNoteName: string | null;
}

const INITIAL_STATE: FretboardState = {
  noteNamingSystem: 'alphabetical',
  colorMode: 'natural-accidental',
  showAllNoteNames: false,
  markedPositions: [],
  visibleFretCount: DEFAULT_VISIBLE_FRET_COUNT,

  timerDurationSeconds: 60,
  timerElapsedSeconds: 0,
  timerIsRunning: false,

  generatorIsRunning: false,
  generatorOptions: {
    playSound: true,
    markPosition: true,
    showNoteName: true,
    intervalMs: 2,
  },
  currentGeneratedPosition: null,
  displayedGeneratedNoteName: null,
};

export const FretboardStore = signalStore(
  { providedIn: 'root' },
  withState(INITIAL_STATE),

  withComputed(({ markedPositions, timerDurationSeconds, timerElapsedSeconds }) => ({
    /** Set of "stringNumber-fretNumber" strings for O(1) marked-position lookups. */
    markedPositionKeySet: computed(() => {
      return new Set(
        markedPositions().map((position) => `${position.stringNumber}-${position.fretNumber}`),
      );
    }),

    timerRemainingSeconds: computed(() =>
      Math.max(0, timerDurationSeconds() - timerElapsedSeconds()),
    ),

    timerProgressPercent: computed(() => {
      const duration = timerDurationSeconds();
      if (duration === 0) return 0;
      return Math.min(100, (timerElapsedSeconds() / duration) * 100);
    }),
  })),

  withMethods(
    (store, fretboardService = inject(FretboardService), audioService = inject(AudioService)) => {
      let timerIntervalId: ReturnType<typeof setInterval> | null = null;
      let generatorIntervalId: ReturnType<typeof setInterval> | null = null;

      function stopTimerInterval(): void {
        if (timerIntervalId !== null) {
          clearInterval(timerIntervalId);
          timerIntervalId = null;
        }
      }

      function stopGeneratorInterval(): void {
        if (generatorIntervalId !== null) {
          clearInterval(generatorIntervalId);
          generatorIntervalId = null;
        }
      }

      async function runGeneratorTick(): Promise<void> {
        const position = fretboardService.getRandomFretPosition(store.visibleFretCount());
        const options = store.generatorOptions();
        const noteName = fretboardService.getNoteName(position.noteIndex, store.noteNamingSystem());

        patchState(store, {
          currentGeneratedPosition: options.markPosition ? position : null,
          displayedGeneratedNoteName: options.showNoteName ? noteName : null,
        });

        if (options.playSound) {
          await audioService.playFrequencyHz(position.frequencyHz);
        }
      }

      return {
        // ── Note naming & colour ─────────────────────────────────────────
        setNoteNamingSystem(system: NoteNamingSystem): void {
          patchState(store, { noteNamingSystem: system });
        },

        setColorMode(mode: ColorMode): void {
          patchState(store, { colorMode: mode });
        },

        toggleShowAllNoteNames(): void {
          patchState(store, { showAllNoteNames: !store.showAllNoteNames() });
        },

        // ── Fret position interaction ────────────────────────────────────
        async onFretPositionClicked(clickedPosition: FretPosition): Promise<void> {
          const existingPositions = store.markedPositions();
          const isAlreadyMarked = existingPositions.some((position) =>
            fretboardService.isSamePosition(position, clickedPosition),
          );

          const updatedPositions = isAlreadyMarked
            ? existingPositions.filter(
                (position) => !fretboardService.isSamePosition(position, clickedPosition),
              )
            : [...existingPositions, clickedPosition];

          patchState(store, { markedPositions: updatedPositions });
          await audioService.playFrequencyHz(clickedPosition.frequencyHz);
        },

        clearAllMarkedPositions(): void {
          patchState(store, { markedPositions: [] });
        },

        // ── Timer ────────────────────────────────────────────────────────
        startTimer(): void {
          if (store.timerIsRunning()) return;
          patchState(store, { timerIsRunning: true });

          timerIntervalId = setInterval(() => {
            const newElapsed = store.timerElapsedSeconds() + 1;

            if (newElapsed >= store.timerDurationSeconds()) {
              patchState(store, {
                timerElapsedSeconds: store.timerDurationSeconds(),
                timerIsRunning: false,
              });
              stopTimerInterval();
            } else {
              patchState(store, { timerElapsedSeconds: newElapsed });
            }
          }, 1000);
        },

        pauseTimer(): void {
          patchState(store, { timerIsRunning: false });
          stopTimerInterval();
        },

        resetTimer(): void {
          patchState(store, { timerIsRunning: false, timerElapsedSeconds: 0 });
          stopTimerInterval();
        },

        setTimerDurationSeconds(seconds: number): void {
          patchState(store, { timerDurationSeconds: seconds, timerElapsedSeconds: 0 });
        },

        // ── Random note generator ────────────────────────────────────────
        async startGenerator(): Promise<void> {
          if (store.generatorIsRunning()) return;
          patchState(store, { generatorIsRunning: true });

          await runGeneratorTick();

          generatorIntervalId = setInterval(async () => {
            if (!store.generatorIsRunning()) {
              stopGeneratorInterval();
              return;
            }
            await runGeneratorTick();
          }, store.generatorOptions().intervalMs);
        },

        stopGenerator(): void {
          patchState(store, {
            generatorIsRunning: false,
            currentGeneratedPosition: null,
            displayedGeneratedNoteName: null,
          });
          stopGeneratorInterval();
        },

        async generateSingleRandomNote(): Promise<void> {
          await runGeneratorTick();
        },

        updateGeneratorOptions(partialOptions: Partial<GeneratorOptions>): void {
          const wasRunning = store.generatorIsRunning();

          if (wasRunning) {
            // Restart generator with new interval
            patchState(store, {
              generatorIsRunning: false,
              generatorOptions: { ...store.generatorOptions(), ...partialOptions },
            });
            stopGeneratorInterval();
          } else {
            patchState(store, {
              generatorOptions: { ...store.generatorOptions(), ...partialOptions },
            });
          }
        },
      };
    },
  ),
);
