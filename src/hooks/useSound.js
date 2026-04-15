// ============================================================
// SOUND SYSTEM HOOK — Howler.js + Web Audio procedural tones
// ============================================================
import { useRef, useCallback, useEffect } from 'react';

// Procedural sound generator using Web Audio API
function createAudioCtx() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    return null;
  }
}

function playTone(ctx, freq, type, duration, gainVal, detune = 0) {
  if (!ctx || ctx.state === 'suspended') return;
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.detune.setValueAtTime(detune, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export function useSound(settings) {
  const ctxRef       = useRef(null);
  const unlockedRef  = useRef(false);
  const musicRef     = useRef(null);
  const musicNodeRef = useRef(null);
  const settingsRef  = useRef(settings);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Unlock audio on first user interaction (mobile requirement)
  const unlockAudio = useCallback(() => {
    if (unlockedRef.current) return;
    if (!ctxRef.current) ctxRef.current = createAudioCtx();
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => { unlockedRef.current = true; });
    } else {
      unlockedRef.current = true;
    }
  }, []);

  // ---- Sound effects ----

  const playDrop = useCallback(() => {
    if (!settingsRef.current?.sfx) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    playTone(ctx, 220, 'sine', 0.15, 0.3, -200);
    playTone(ctx, 330, 'sine', 0.1,  0.2, 0);
  }, []);

  const playBounce = useCallback(() => {
    if (!settingsRef.current?.sfx) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    playTone(ctx, 180, 'triangle', 0.08, 0.15);
  }, []);

  const playMerge = useCallback((level) => {
    if (!settingsRef.current?.sfx) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const baseFreq = 200 + level * 60;
    playTone(ctx, baseFreq, 'sine', 0.2, 0.5);
    playTone(ctx, baseFreq * 1.5, 'sine', 0.15, 0.35, 100);
    if (level >= 5) {
      playTone(ctx, baseFreq * 2, 'triangle', 0.2, 0.4, 200);
    }
    if (level >= 8) {
      playTone(ctx, baseFreq * 0.5, 'sawtooth', 0.3, 0.6, -100);
    }
  }, []);

  const playExplosion = useCallback(() => {
    if (!settingsRef.current?.sfx) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Noise-like explosion via multiple detune
    for (let i = 0; i < 5; i++) {
      playTone(ctx, 80 + i * 30, 'sawtooth', 0.4, 0.3, (Math.random() - 0.5) * 500);
    }
  }, []);

  const playClick = useCallback(() => {
    if (!settingsRef.current?.sfx) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    playTone(ctx, 600, 'square', 0.06, 0.2);
    playTone(ctx, 800, 'square', 0.04, 0.15);
  }, []);

  const playGameOver = useCallback(() => {
    if (!settingsRef.current?.sfx) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const notes = [440, 370, 330, 220];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, freq, 'sine', 0.4, 0.4), i * 200);
    });
  }, []);

  const playPowerup = useCallback(() => {
    if (!settingsRef.current?.sfx) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const notes = [300, 450, 600, 800];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, freq, 'triangle', 0.12, 0.3), i * 80);
    });
  }, []);

  // ---- 8-bit Background Music ----

  const startMusic = useCallback(() => {
    if (!settingsRef.current?.music) return;
    const ctx = ctxRef.current;
    if (!ctx || musicRef.current) return;

    const notes = [
      261.6, 293.6, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3,
      440.0, 392.0, 349.2, 329.6, 293.6, 261.6, 220.0, 261.6,
    ];
    const bpm = 120;
    const noteLen = (60 / bpm) * 0.5; // 8th notes
    let idx = 0;
    let stopped = false;

    function playNextNote() {
      if (stopped || !settingsRef.current?.music) return;
      const freq = notes[idx % notes.length];
      idx++;
      playTone(ctx, freq, 'square', noteLen * 0.8, 0.05, -1200); // very quiet
      musicRef.current = setTimeout(playNextNote, noteLen * 1000);
    }

    playNextNote();

    return () => {
      stopped = true;
      if (musicRef.current) clearTimeout(musicRef.current);
    };
  }, []);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      clearTimeout(musicRef.current);
      musicRef.current = null;
    }
  }, []);

  const toggleMusic = useCallback((on) => {
    if (on) startMusic();
    else stopMusic();
  }, [startMusic, stopMusic]);

  // Haptic vibration
  const haptic = useCallback((pattern = [20]) => {
    if (!settingsRef.current?.haptics) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }, []);

  useEffect(() => {
    // Create audio context lazily
    return () => {
      stopMusic();
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, [stopMusic]);

  return {
    unlockAudio,
    playDrop,
    playBounce,
    playMerge,
    playExplosion,
    playClick,
    playGameOver,
    playPowerup,
    startMusic,
    stopMusic,
    toggleMusic,
    haptic,
  };
}
