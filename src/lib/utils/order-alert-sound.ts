"use client";

let audioCtx: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;

function getAudioResources() {
  if (typeof window === "undefined") return null;

  if (!audioCtx || !audioBuffer) {
    try {
      audioCtx = new AudioContext();
      const buffer = audioCtx.createBuffer(
        1,
        audioCtx.sampleRate * 0.15,
        audioCtx.sampleRate
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] =
          Math.sin(2 * Math.PI * 880 * (i / audioCtx.sampleRate)) *
          Math.exp(-i / (audioCtx.sampleRate * 0.05));
      }
      audioBuffer = buffer;
    } catch {
      return null;
    }
  }

  return { ctx: audioCtx, buffer: audioBuffer };
}

/** Plays a short chime + vibration for a new order alert. Safe to call from anywhere client-side. */
export function playOrderAlertSound() {
  const resources = getAudioResources();
  if (resources) {
    try {
      const { ctx, buffer } = resources;
      if (ctx.state === "suspended") ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start();
    } catch {
      // Ignore audio errors (e.g. autoplay restrictions before user gesture)
    }
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
}
