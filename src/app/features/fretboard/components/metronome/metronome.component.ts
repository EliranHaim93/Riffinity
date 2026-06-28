import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AudioService } from '../../../../core/services/audio.service';

/**
 * Standalone metronome widget rendered above the fretboard.
 *
 * ## Architecture
 * Uses a lookahead scheduler on the shared Tone.js AudioContext so clicks stay
 * locked to the same clock as fretboard notes:
 *
 * 1. A self-rescheduling timer fires every ~25 ms.
 * 2. Each tick calls `schedule()`, which looks 250 ms ahead into the
 *    AudioContext timeline and pre-queues beats in that window.
 * 3. Each beat is a short sine-wave burst scheduled sample-accurately.
 * 4. A `requestAnimationFrame` loop reads the same AudioContext clock for
 *    beat-dot visuals instead of per-beat `setTimeout` callbacks.
 * 5. If the main thread falls behind by more than half a beat, missed beats
 *    are skipped rather than bunched into a burst of late clicks.
 * 6. `visibilitychange` and `statechange` listeners resume the context and
 *    re-schedule when the tab or AudioContext was suspended.
 *
 * ## BPM range
 * 20–240 BPM, adjustable via ±5 buttons, tap tempo, or by typing directly into
 * the input. Changing BPM while playing resets `nextTickTime` to `audioCtx.currentTime`
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
  private readonly audioService = inject(AudioService);

  readonly bpm = signal(120); // Clamped to [20, 240]
  readonly isPlaying = signal(false); // Whether the metronome is currently ticking.
  readonly currentBeat = signal(-1); // Index of the beat that should currently be highlighted (0–3). Set to -1 when stopped so no dot appears active.
  readonly beats = [0, 1, 2, 3]; // Beat indices used by the template's `@for` loop.

  /** Shared Tone.js AudioContext; owned by {@link AudioService}, not closed here. */
  private audioCtx: AudioContext | null = null;

  /** Absolute AudioContext timestamp (seconds) for the next beat to schedule. */
  private nextTickTime = 0;

  /** Index of the next beat to schedule (0–3). */
  private beatIndex = 0;

  /** AudioContext time and beat index of the most recently queued click. */
  private lastBeatTime = 0;
  private lastBeatIndex = -1;

  /** Self-rescheduling timeout that drives the lookahead scheduler. */
  private schedulerTimer: ReturnType<typeof setTimeout> | null = null;

  /** rAF handle for syncing beat-dot visuals to the audio clock. */
  private visualFrameId: number | null = null;

  /** Wall-clock timestamps from recent tap-tempo clicks. */
  private tapTimestamps: number[] = [];

  /** Tap history resets when the gap between taps exceeds this value. */
  private static readonly TAP_RESET_MS = 2000;

  /** Maximum number of tap intervals averaged when deriving BPM. */
  private static readonly MAX_TAP_SAMPLES = 4;

  /** How often `schedule()` polls for beats to queue (ms). */
  private static readonly SCHEDULE_INTERVAL_MS = 25;

  /** How far ahead of `audioCtx.currentTime` beats are pre-scheduled (s). */
  private static readonly SCHEDULE_AHEAD_S = 0.25;

  /** Skip missed beats when lateness exceeds this fraction of a beat. */
  private static readonly LATE_SKIP_THRESHOLD = 0.5;

  /** Resumes audio and re-schedules when the tab becomes visible again. */
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible' || !this.isPlaying()) return;
    void this.audioCtx?.resume().then(() => this.schedule());
  };

  /** Attempts to resume the AudioContext when the browser suspends it mid-playback. */
  private readonly onAudioStateChange = (): void => {
    if (this.audioCtx?.state === 'suspended' && this.isPlaying()) {
      void this.audioCtx.resume();
    }
  };

  /** Drives `syncVisualBeat()` on every animation frame while playing. */
  private readonly runVisualLoop = (): void => {
    this.syncVisualBeat();
    if (this.isPlaying()) {
      this.visualFrameId = requestAnimationFrame(this.runVisualLoop);
    }
  };

  // ── Public API ────────────────────────────────────────────────

  /** Starts or stops the metronome. */
  toggle(): void {
    this.isPlaying() ? this.stop() : void this.start();
  }

  /**
   * Increments or decrements BPM by `delta`, clamped to [20, 240].
   * If playing, resets the lookahead cursor so the new tempo is picked up
   * immediately on the next scheduler tick.
   *
   * @param delta Positive to increase, negative to decrease (typically ±5).
   */
  adjustBpm(delta: number): void {
    this.applyBpm(this.bpm() + delta);
  }

  /**
   * Records a tap and derives BPM from the average interval between recent taps.
   * Requires at least two taps; history resets after 2 s of inactivity and only
   * the last four intervals are averaged.
   */
  tapTempo(): void {
    const now = performance.now();
    const lastTap = this.tapTimestamps.at(-1);

    if (lastTap !== undefined && now - lastTap > MetronomeComponent.TAP_RESET_MS) {
      this.tapTimestamps = [];
    }

    this.tapTimestamps.push(now);

    if (this.tapTimestamps.length > MetronomeComponent.MAX_TAP_SAMPLES + 1) {
      this.tapTimestamps.shift();
    }

    if (this.tapTimestamps.length < 2) return;

    let totalInterval = 0;
    for (let i = 1; i < this.tapTimestamps.length; i++) {
      totalInterval += this.tapTimestamps[i] - this.tapTimestamps[i - 1];
    }

    this.applyBpm(Math.round(60000 / (totalInterval / (this.tapTimestamps.length - 1))));
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
    const clamped =
      Number.isFinite(raw) && raw !== 0 ? Math.min(240, Math.max(20, raw)) : this.bpm();
    this.applyBpm(clamped);
    input.value = clamped.toString();
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  /** Stops the scheduler and removes document/context listeners. */
  ngOnDestroy(): void {
    this.stop();
    this.detachListeners();
  }

  // ── Private helpers ───────────────────────────────────────────

  /** Clamps BPM to [20, 240] and resets the beat cursor when playing. */
  private applyBpm(raw: number): void {
    this.bpm.set(Math.min(240, Math.max(20, raw)));
    if (this.isPlaying() && this.audioCtx) {
      this.resetBeatCursor(this.audioCtx.currentTime);
    }
  }

  /**
   * Acquires the shared AudioContext, resets beat state, and starts the
   * scheduler loop plus the visual sync rAF chain.
   */
  private async start(): Promise<void> {
    this.audioCtx = await this.audioService.ensureRunningContext();
    this.attachListeners();

    this.resetBeatCursor(this.audioCtx.currentTime);
    this.isPlaying.set(true);
    this.schedule();
    this.schedulerTimer = setTimeout(
      () => this.scheduleLoop(),
      MetronomeComponent.SCHEDULE_INTERVAL_MS,
    );
    this.visualFrameId = requestAnimationFrame(this.runVisualLoop);
  }

  /** Clears timers, resets visual state, and detaches event listeners. */
  private stop(): void {
    this.isPlaying.set(false);
    this.currentBeat.set(-1);
    this.lastBeatIndex = -1;
    this.detachListeners();

    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    if (this.visualFrameId !== null) {
      cancelAnimationFrame(this.visualFrameId);
      this.visualFrameId = null;
    }
  }

  /** Aligns the scheduler and visual cursors to `currentTime`, starting on beat 0. */
  private resetBeatCursor(currentTime: number): void {
    this.beatIndex = 0;
    this.nextTickTime = currentTime;
    this.lastBeatTime = 0;
    this.lastBeatIndex = -1;
  }

  /** Repeatedly calls `schedule()` while the metronome is playing. */
  private scheduleLoop(): void {
    this.schedule();
    if (!this.isPlaying()) return;
    this.schedulerTimer = setTimeout(
      () => this.scheduleLoop(),
      MetronomeComponent.SCHEDULE_INTERVAL_MS,
    );
  }

  /**
   * Lookahead scheduler — pre-queues beats within 250 ms of the AudioContext
   * clock. Skips beats that are more than half a beat late to avoid burst
   * clicks after main-thread lag.
   */
  private schedule(): void {
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
      return;
    }

    const currentTime = this.audioCtx.currentTime;
    const secondsPerBeat = 60 / this.bpm();
    const lookAhead = MetronomeComponent.SCHEDULE_AHEAD_S;

    while (this.nextTickTime < currentTime + lookAhead) {
      const lateness = currentTime - this.nextTickTime;

      if (lateness > secondsPerBeat * MetronomeComponent.LATE_SKIP_THRESHOLD) {
        const skip = Math.floor(lateness / secondsPerBeat) + 1;
        this.beatIndex = (this.beatIndex + skip) % this.beats.length;
        this.nextTickTime += skip * secondsPerBeat;
        continue;
      }

      this.playClick(this.nextTickTime, this.beatIndex === 0);
      this.lastBeatTime = this.nextTickTime;
      this.lastBeatIndex = this.beatIndex;

      this.nextTickTime += secondsPerBeat;
      this.beatIndex = (this.beatIndex + 1) % this.beats.length;
    }
  }

  /** Highlights the beat dot whose scheduled window contains `audioCtx.currentTime`. */
  private syncVisualBeat(): void {
    if (!this.audioCtx || !this.isPlaying() || this.lastBeatIndex < 0) return;

    const secondsPerBeat = 60 / this.bpm();
    const t = this.audioCtx.currentTime;

    if (t >= this.lastBeatTime && t < this.lastBeatTime + secondsPerBeat) {
      this.currentBeat.set(this.lastBeatIndex);
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

  /** Registers tab-visibility and AudioContext state listeners. */
  private attachListeners(): void {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.audioCtx?.addEventListener('statechange', this.onAudioStateChange);
  }

  /** Removes tab-visibility and AudioContext state listeners. */
  private detachListeners(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.audioCtx?.removeEventListener('statechange', this.onAudioStateChange);
  }
}
