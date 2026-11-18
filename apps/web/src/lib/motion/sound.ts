/**
 * HealthBridge India — Optional Synthesized UI Sound Engine (Web Audio API)
 *
 * Rules:
 * - Strictly DISABLED by default (opt-in only via localStorage['healthbridge-sound-enabled']).
 * - Zero autoplay; AudioContext is lazily initialized only after an explicit user interaction.
 * - Never fired on hover; reserved exclusively for selected confirmation interactions.
 * - Synthesizes crisp original low-volume tones with zero external MP3/WAV dependencies (CSP-safe).
 */

import { prefersReducedMotion } from './haptics';

export type UiSoundType = 'confirm' | 'success' | 'error' | 'toggle' | 'copy';

export const SOUND_STORAGE_KEY = 'healthbridge-sound-enabled';

let sharedAudioContext: AudioContext | null = null;

function getAudioContextConstructor(): (new () => AudioContext) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    AudioContext?: new () => AudioContext;
    webkitAudioContext?: new () => AudioContext;
  };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

export function isSoundSupported(): boolean {
  return getAudioContextConstructor() !== null;
}

export function getSoundPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSoundPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}

function getOrCreateAudioContext(): AudioContext | null {
  const Ctor = getAudioContextConstructor();
  if (!Ctor) return null;
  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new Ctor();
    } catch {
      return null;
    }
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {
      // Browser autoplay policy blocked resume
    });
  }
  return sharedAudioContext;
}

function scheduleTone(
  ctx: AudioContext,
  frequency: number,
  startOffsetSec: number,
  durationSec: number,
  peakGain: number
) {
  const now = ctx.currentTime + startOffsetSec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + 0.01);
}

export function playUiSound(type: UiSoundType, options?: { force?: boolean }): boolean {
  if (!isSoundSupported()) return false;
  if (prefersReducedMotion()) return false;
  if (!options?.force && !getSoundPreference()) return false;

  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    switch (type) {
      case 'toggle':
        scheduleTone(ctx, 520, 0, 0.055, 0.04);
        break;
      case 'copy':
        scheduleTone(ctx, 640, 0, 0.06, 0.045);
        break;
      case 'confirm':
        scheduleTone(ctx, 587.33, 0, 0.075, 0.045); // D5
        break;
      case 'success':
        scheduleTone(ctx, 523.25, 0, 0.07, 0.045); // C5
        scheduleTone(ctx, 659.25, 0.055, 0.095, 0.05); // E5
        break;
      case 'error':
        scheduleTone(ctx, 329.63, 0, 0.09, 0.045); // E4
        scheduleTone(ctx, 261.63, 0.07, 0.11, 0.045); // C4
        break;
    }
    return true;
  } catch {
    return false;
  }
}
