import { Injectable } from '@angular/core';

/**
 * Central audio service for the fretboard app.
 *
 * Owns a single Tone.js {@link AudioContext} shared by fretboard note playback
 * and the metronome so all sounds stay on the same hardware clock. The context
 * and PluckSynth are started lazily on the first user gesture.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private pluckSynth: unknown = null;
  private reverbNode: unknown = null;
  private audioContextStarted = false;

  /**
   * Plays a note at the given frequency using the Karplus–Strong pluck synth.
   *
   * @param frequencyHz Pitch in hertz (e.g. from a fret position).
   */
  async playFrequencyHz(frequencyHz: number): Promise<void> {
    await this.ensureAudioStarted();
    const synth = this.pluckSynth as { triggerAttack: (freq: number, time?: unknown) => void };
    if (!synth) return;
    const Tone = await import('tone');
    synth.triggerAttack(frequencyHz, Tone.now());
  }

  /**
   * Returns the shared Tone.js `AudioContext`, starting and resuming it if
   * needed. Used by the metronome to schedule clicks on the same clock as
   * fretboard notes.
   */
  async ensureRunningContext(): Promise<AudioContext> {
    await this.ensureAudioStarted();
    const Tone = await import('tone');
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    return Tone.getContext().rawContext as AudioContext;
  }

  /** Initialises Tone.js, the reverb chain, and the pluck synth on first use. */
  private async ensureAudioStarted(): Promise<void> {
    if (this.audioContextStarted) return;

    const Tone = await import('tone');
    await Tone.start();

    const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.25 });
    await reverb.generate();

    const pluck = new Tone.PluckSynth({
      attackNoise: 1.5,
      dampening: 4000,
      resonance: 0.98,
    });

    pluck.connect(reverb);
    reverb.toDestination();

    this.pluckSynth = pluck;
    this.reverbNode = reverb;
    this.audioContextStarted = true;
  }
}
