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

let unlockListenersAttached = false;

/**
 * Browsers only let an AudioContext actually produce sound after a real user
 * gesture on the page; resuming it later from an async event (like an SSE
 * message) is not enough. Call this once on app mount to prime the context
 * the moment the user first clicks/taps/types anywhere, so it's already
 * unlocked by the time a notification needs to play.
 */
export function ensureOrderAlertAudioUnlocked() {
  if (unlockListenersAttached || typeof document === "undefined") return;
  unlockListenersAttached = true;

  const events = ["pointerdown", "keydown", "touchstart"] as const;
  const unlock = () => {
    events.forEach((event) => document.removeEventListener(event, unlock));
    const resources = getAudioResources();
    if (resources?.ctx.state === "suspended") {
      resources.ctx.resume().catch(() => {
        // Ignore - will retry resuming on the next actual alert
      });
    }
  };

  events.forEach((event) =>
    document.addEventListener(event, unlock, { once: true, passive: true })
  );
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
