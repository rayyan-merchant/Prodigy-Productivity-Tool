import { useCallback, useRef } from 'react';

// Generate tones using Web Audio API - no external files needed
const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
  const AudioContextConstructor = window.AudioContext
    || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextConstructor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);

  setTimeout(() => ctx.close(), (duration + 0.5) * 1000);
};

const playFocusStartSound = () => {
  // Rising chime: C5 → E5 → G5
  createTone(523.25, 0.3, 'sine', 0.25);
  setTimeout(() => createTone(659.25, 0.3, 'sine', 0.25), 150);
  setTimeout(() => createTone(783.99, 0.5, 'sine', 0.2), 300);
};

const playFocusEndSound = () => {
  // Gentle descending: G5 → E5 → C5 with longer sustain
  createTone(783.99, 0.4, 'sine', 0.25);
  setTimeout(() => createTone(659.25, 0.4, 'sine', 0.25), 200);
  setTimeout(() => createTone(523.25, 0.7, 'sine', 0.2), 400);
};

const playBreakStartSound = () => {
  // Soft two-note: E5 → G5
  createTone(659.25, 0.4, 'sine', 0.2);
  setTimeout(() => createTone(783.99, 0.6, 'sine', 0.15), 250);
};

const playBreakEndSound = () => {
  // Upbeat wake-up: C5 → E5 → G5 → C6
  createTone(523.25, 0.2, 'triangle', 0.2);
  setTimeout(() => createTone(659.25, 0.2, 'triangle', 0.2), 120);
  setTimeout(() => createTone(783.99, 0.2, 'triangle', 0.2), 240);
  setTimeout(() => createTone(1046.5, 0.5, 'triangle', 0.15), 360);
};

export const useFocusSounds = () => {
  const soundEnabled = useRef(true);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabled.current = enabled;
  }, []);

  const playStartSound = useCallback((isBreak: boolean) => {
    if (!soundEnabled.current) return;
    try {
      if (isBreak) {
        playBreakStartSound();
      } else {
        playFocusStartSound();
      }
    } catch (e) {
      console.warn('Could not play sound:', e);
    }
  }, []);

  const playEndSound = useCallback((isBreak: boolean) => {
    if (!soundEnabled.current) return;
    try {
      if (isBreak) {
        playBreakEndSound();
      } else {
        playFocusEndSound();
      }
    } catch (e) {
      console.warn('Could not play sound:', e);
    }
  }, []);

  return { playStartSound, playEndSound, setSoundEnabled };
};
