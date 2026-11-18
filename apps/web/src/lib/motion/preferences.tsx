'use client';

import * as React from 'react';
import {
  getHapticsPreference,
  setHapticsPreference,
  isHapticsSupported,
  triggerHaptic,
  type HapticPattern,
} from './haptics';
import {
  getSoundPreference,
  setSoundPreference,
  isSoundSupported,
  playUiSound,
  type UiSoundType,
} from './sound';

export interface InteractionPreferencesContextValue {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundSupported: boolean;
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  hapticsSupported: boolean;
  reducedMotion: boolean;
  triggerFeedback: (kind: 'toggle' | 'copy' | 'confirm' | 'success' | 'error') => void;
}

const InteractionPreferencesContext =
  React.createContext<InteractionPreferencesContextValue | null>(null);

const HAPTIC_MAP: Record<'toggle' | 'copy' | 'confirm' | 'success' | 'error', HapticPattern> = {
  toggle: 'selection',
  copy: 'selection',
  confirm: 'confirm',
  success: 'success',
  error: 'error',
};

const SOUND_MAP: Record<'toggle' | 'copy' | 'confirm' | 'success' | 'error', UiSoundType> = {
  toggle: 'toggle',
  copy: 'copy',
  confirm: 'confirm',
  success: 'success',
  error: 'error',
};

export function InteractionPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = React.useState(false);
  const [hapticsEnabled, setHapticsEnabledState] = React.useState(true);
  const [soundSupported, setSoundSupported] = React.useState(false);
  const [hapticsSupported, setHapticsSupported] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    setSoundEnabledState(getSoundPreference());
    setHapticsEnabledState(getHapticsPreference());
    setSoundSupported(isSoundSupported());
    setHapticsSupported(isHapticsSupported());

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', handleChange);
      return () => mq.removeEventListener('change', handleChange);
    }
    return undefined;
  }, []);

  const setSoundEnabled = React.useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    setSoundPreference(enabled);
    if (enabled) {
      playUiSound('toggle', { force: true });
    }
  }, []);

  const setHapticsEnabled = React.useCallback((enabled: boolean) => {
    setHapticsEnabledState(enabled);
    setHapticsPreference(enabled);
    if (enabled) {
      triggerHaptic('selection');
    }
  }, []);

  const triggerFeedback = React.useCallback(
    (kind: 'toggle' | 'copy' | 'confirm' | 'success' | 'error') => {
      if (reducedMotion) return;
      if (hapticsEnabled) {
        triggerHaptic(HAPTIC_MAP[kind]);
      }
      if (soundEnabled) {
        playUiSound(SOUND_MAP[kind]);
      }
    },
    [hapticsEnabled, soundEnabled, reducedMotion]
  );

  const value = React.useMemo<InteractionPreferencesContextValue>(
    () => ({
      soundEnabled,
      setSoundEnabled,
      soundSupported,
      hapticsEnabled,
      setHapticsEnabled,
      hapticsSupported,
      reducedMotion,
      triggerFeedback,
    }),
    [
      soundEnabled,
      setSoundEnabled,
      soundSupported,
      hapticsEnabled,
      setHapticsEnabled,
      hapticsSupported,
      reducedMotion,
      triggerFeedback,
    ]
  );

  return (
    <InteractionPreferencesContext.Provider value={value}>
      {children}
    </InteractionPreferencesContext.Provider>
  );
}

export function useInteractionPreferences(): InteractionPreferencesContextValue {
  const ctx = React.useContext(InteractionPreferencesContext);
  if (!ctx) {
    return {
      soundEnabled: false,
      setSoundEnabled: setSoundPreference,
      soundSupported: isSoundSupported(),
      hapticsEnabled: false,
      setHapticsEnabled: setHapticsPreference,
      hapticsSupported: isHapticsSupported(),
      reducedMotion: false,
      triggerFeedback: () => undefined,
    };
  }
  return ctx;
}
