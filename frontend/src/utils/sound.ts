/**
 * Sound feedback using Web Audio API.
 * No external audio files needed.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playBeep(frequency: number, duration: number): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.value = 0.3;

    // Fade out to avoid clicks
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch {
    // Audio not available, silently ignore
  }
}

export function playSuccessBeep(): void {
  playBeep(800, 150);
}

export function playErrorBeep(): void {
  playBeep(400, 150);
  setTimeout(() => playBeep(400, 150), 200);
}
