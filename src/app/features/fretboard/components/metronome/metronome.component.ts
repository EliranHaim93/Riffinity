import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Standalone metronome widget rendered above the fretboard.
 *
 * ## Architecture
 * Uses a lookahead scheduler to keep audio timing accurate:
 *
 * 1. A `setInterval` fires every 25 ms.
 * 2. Each tick of the interval calls `schedule()`, which looks 100 ms ahead
 *    into the `AudioContext` timeline and pre-queues any beats that fall
 *    within that window.
 * 3. Each beat is rendered as a short sine-wave burst via the Web Audio API
 *    so that audio timing is sample-accurate and immune to JS event-loop jitter.
 * 4. A matching `setTimeout` fires at roughly the same wall-clock moment to
 *    update the `currentBeat` signal, driving the visual beat-dot highlight.
 *
 * ## BPM range
 * 20–240 BPM, adjustable via ±5 buttons or by typing directly into the input.
 * Changing BPM while playing resets `nextTickTime` to `audioCtx.currentTime`
 * so the new tempo takes effect on the very next beat without a gap or overlap.
 */
@Component({
  selector: 'app-metronome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './metronome.component.html',
  styleUrl: './metronome.component.scss',
})
export class MetronomeComponent implements OnDestroy {
  readonly bpm = signal(120); // Clamped to [20, 240]
  readonly isPlaying = signal(false); // Whether the metronome is currently ticking.
  readonly currentBeat = signal(-1); // Index of the beat that should currently be highlighted (0–3). Set to -1 when stopped so no dot appears active.
  readonly beats = [0, 1, 2, 3]; // Beat indices used by the template's `@for` loop.

  /** Lazily created; stays alive for the component's lifetime once opened. */
  private audioCtx: AudioContext | null = null;

  /**
   * Absolute `AudioContext` timestamp (in seconds) at which the next beat
   * should be scheduled. Advanced by one beat duration after each queued tick.
   */
  private nextTickTime = 0;

  /** Cycles through `beats` indices (0 → 1 → 2 → 3 → 0 → …). */
  private beatIndex = 0;

  /** Handle for the 25 ms polling interval; null when stopped. */
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;

  // ── Public API ────────────────────────────────────────────────
  toggle(): void {
    this.isPlaying() ? this.stop() : this.start();
  }

  /**
   * Increments or decrements BPM by `delta`, clamped to [20, 240].
   * If playing, resets the lookahead cursor so the new tempo is picked up
   * immediately on the next scheduler tick.
   *
   * @param delta Positive to increase, negative to decrease (typically ±5).
   */
  adjustBpm(delta: number): void {
    const next = Math.min(240, Math.max(20, this.bpm() + delta));
    this.bpm.set(next);
    if (this.isPlaying()) {
      this.nextTickTime = this.audioCtx!.currentTime;
    }
  }

  /**
   * Handles the `change` event from the BPM `<input>`.
   * Parses and clamps the raw value; keeps the current BPM unchanged if the
   * input is empty or non-numeric.
   *
   * @param event Native DOM change event from the number input.
   */
  onBpmInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = +input.value;
    const clamped = Number.isFinite(raw) && raw !== 0 ? Math.min(240, Math.max(20, raw)) : this.bpm();
    this.bpm.set(clamped);
    input.value = clamped.toString();
    if (this.isPlaying()) {
      this.nextTickTime = this.audioCtx!.currentTime;
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  /** Stops the scheduler and closes the AudioContext to release resources. */
  ngOnDestroy(): void {
    this.stop();
    this.audioCtx?.close();
  }

  // ── Private helpers ───────────────────────────────────────────

  /**
   * Creates (or resumes) the AudioContext, resets beat state, and launches
   * the 25 ms scheduler interval.
   */
  private start(): void {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    } else if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.beatIndex = 0;
    this.nextTickTime = this.audioCtx.currentTime;
    this.isPlaying.set(true);
    this.schedulerTimer = setInterval(() => this.schedule(), 25);
  }

  /**
   * Clears the scheduler interval and resets visual state.
   * The AudioContext is left open so it can be resumed cheaply on next start.
   */
  private stop(): void {
    this.isPlaying.set(false);
    this.currentBeat.set(-1);
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  /**
   * Lookahead scheduler — called every 25 ms while playing.
   *
   * Queues all beats whose scheduled time falls within the next 100 ms
   * (`lookAhead`) of the AudioContext clock. Pre-scheduling into the future
   * decouples audio accuracy from JS timer precision.
   */
  private schedule(): void {
    if (!this.audioCtx) return;
    const secondsPerBeat = 60 / this.bpm();
    const lookAhead = 0.1;

    while (this.nextTickTime < this.audioCtx.currentTime + lookAhead) {
      this.playClick(this.nextTickTime, this.beatIndex === 0);

      const beat = this.beatIndex;
      const delay = Math.max(0, (this.nextTickTime - this.audioCtx.currentTime) * 1000);
      setTimeout(() => this.currentBeat.set(beat), delay);

      this.nextTickTime += secondsPerBeat;
      this.beatIndex = (this.beatIndex + 1) % this.beats.length;
    }
  }

  /**
   * Synthesises a single metronome click using a short sine-wave oscillator
   * routed through a gain node with an exponential decay envelope.
   *
   * @param time   AudioContext timestamp (seconds) at which the click starts.
   * @param accent Whether this is the downbeat (beat 1). Accented beats play
   *               at 1200 Hz and 0.7 gain; regular beats at 880 Hz and 0.4.
   */
  private playClick(time: number, accent: boolean): void {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.frequency.value = accent ? 1200 : 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(accent ? 0.7 : 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.start(time);
    osc.stop(time + 0.05);
  }
}
