# Riffinity

> A musical orientation app for beginner guitar players — learn the fretboard interactively, train your ear, and build muscle memory one note at a time.

Riffinity is an Angular 21 web app built with Material Design that helps guitarists internalize note positions across the fretboard. Click any string–fret intersection to hear the corresponding note played back on a synthesized guitar pluck, mark positions for reference, randomize drills, and practice against a built-in timer.

---

## Features

### Fretboard orientation
- **Realistic 6-string fretboard** in standard EADGBE tuning, frets 0–12, with nut, fret dividers, and inlay marker dots at positions 3, 5, 7, 9, and 12.
- **Click any position to play and mark** — every fret on every string is interactive. Clicking the low-E string's 1st fret plays an F and lights it up; click again to unmark.
- **Audio playback** uses a Karplus–Strong pluck synth (via Tone.js) with subtle reverb for a guitar-like timbre. Frequencies are computed from equal-temperament math relative to A4 = 440 Hz.

### Note naming
- Toggle between **Alphabetical** (C, C#, D, D#, …) and **Solfège** (Do, Do#, Ré, Ré#, …) at any time.

### Color coding
- **Natural / Accidental mode (default)** — natural notes (C D E F G A B) in light blue, accidentals (sharps/flats) in deep orange. Great for spotting the diatonic notes at a glance.
- **Per-note mode** — each of the 12 chromatic pitch classes gets its own unique color (all A's yellow, all C's red, all G#'s purple, etc.) with a built-in legend.

### Display options
- **Reveal all notes** — overlays the note name on every fret simultaneously, useful for memorization.
- **Clear marked** — wipes all currently marked positions with a single click.

### Random note generator
Three independent options that can be mixed and matched:
- **Play sound** — only hear the note (best for ear training).
- **Mark position** — only highlight the fretboard position (best for finger placement).
- **Show note name** — display the note name in a large banner (best for name recall).

Modes:
- **Random Note** — generate a single random note on demand.
- **Auto Play** — continuously generate notes at a configurable interval (0.5 s – 5 s).

### Practice timer
- Circular SVG progress ring with **preset durations** (1, 3, 5, 10, 15 minutes).
- Start, pause/resume, and reset controls.
- Color shifts as time runs down; turns green when complete.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | **Angular 21** (standalone components, signal-based inputs/outputs, `@for` / `@if` control flow) |
| UI | **Angular Material** (Material Design 3, dark theme) |
| State | **NGRX Signals** (`signalStore` with `withState` / `withComputed` / `withMethods`) |
| Audio | **Tone.js** (`PluckSynth` + `Reverb`) |
| Language | TypeScript 5.9, SCSS |
| Build | Angular CLI 21.2 |
| Tests | Vitest |

### Modern Angular best practices used
- Standalone components (no NgModules)
- `ChangeDetectionStrategy.OnPush` everywhere (ready for the v22 default flip)
- Signals end-to-end: `input.required()`, `output()`, `computed()`, `signalStore`
- Lazy-loaded routes
- `inject()` instead of constructor injection
- New control flow syntax (`@if`, `@for`, `@else`)

---

## Project structure

```
src/app/
├── core/
│   ├── models/        — types, constants, tuning configs
│   ├── services/      — fretboard math, Tone.js audio wrapper
│   └── store/         — NGRX Signals store (all app state)
├── features/
│   └── fretboard/
│       ├── components/
│       │   ├── fret-cell/        — clickable note position
│       │   ├── controls-panel/   — sidebar settings
│       │   └── timer-widget/     — practice timer
│       └── fretboard.component.* — main fretboard view
└── layout/
    └── shell.component.ts        — app header & router outlet
```

---

## Getting started

### Prerequisites
- Node.js 20+ and npm 10+

### Install
```bash
npm install
```

### Development server
```bash
ng serve
```
Open `http://localhost:4200/`. The app reloads on file changes.

> First note click: the browser will start the Web Audio context. Allow audio playback if prompted.

### Production build
```bash
ng build
```
Outputs to `dist/Riffinity/`.

### Unit tests
```bash
ng test
```
Runs the [Vitest](https://vitest.dev/) test runner.

---

## Browser support

Riffinity uses modern web platform features including the **Web Audio API** and **CSS Subgrid**. Tested on the latest versions of:
- Chrome / Edge
- Firefox
- Safari 16+

---

## Roadmap ideas

- More tunings (Drop D, DADGAD, Open G)
- Scale & chord overlays
- Stats / progress tracking
- Mobile-first layout polish
- Bass guitar mode

---

## License

Personal project — all rights reserved unless otherwise noted.
