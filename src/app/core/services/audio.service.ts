import { Injectable } from '@angular/core';

/**
 * Wraps Tone.js PluckSynth (Karplus–Strong algorithm) for guitar-like
 * pluck sounds. Audio context is started lazily on the first user gesture.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private pluckSynth: unknown = null;
  private reverbNode: unknown = null;
  private audioContextStarted = false;

  async playFrequencyHz(frequencyHz: number): Promise<void> {
    await this.ensureAudioStarted();
    const synth = this.pluckSynth as { triggerAttack: (freq: number, time?: unknown) => void };
    if (!synth) return;
    const Tone = await import('tone');
    synth.triggerAttack(frequencyHz, Tone.now());
  }

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
