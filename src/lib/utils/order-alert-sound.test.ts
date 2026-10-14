import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * order-alert-sound caches its AudioContext and unlock state at module level,
 * so every test loads a fresh copy against freshly stubbed browser globals.
 */

type Ctx = ReturnType<typeof makeContext>;

function makeContext(state: "running" | "suspended" = "running") {
  const source = { buffer: null as unknown, connect: vi.fn(), start: vi.fn() };
  return {
    state,
    sampleRate: 100,
    destination: { kind: "destination" },
    resume: vi.fn().mockResolvedValue(undefined),
    createBuffer: vi.fn((_ch: number, length: number) => {
      const data = new Float32Array(length);
      return { getChannelData: () => data, data };
    }),
    createBufferSource: vi.fn(() => source),
    source,
  };
}

let contexts: Ctx[];
let nextState: "running" | "suspended";
let listeners: Map<string, () => void>;

const stubBrowser = ({
  audio = true,
  vibrate = true,
}: { audio?: boolean; vibrate?: boolean } = {}) => {
  vi.stubGlobal("window", {});
  vi.stubGlobal("document", {
    addEventListener: vi.fn((event: string, fn: () => void) =>
      listeners.set(event, fn)
    ),
    removeEventListener: vi.fn((event: string) => listeners.delete(event)),
  });
  vi.stubGlobal(
    "AudioContext",
    audio
      ? vi.fn(function () {
          const ctx = makeContext(nextState);
          contexts.push(ctx);
          return ctx;
        })
      : vi.fn(function () {
          throw new Error("no audio");
        })
  );
  vi.stubGlobal("navigator", vibrate ? { vibrate: vi.fn() } : {});
};

const load = async () => import("./order-alert-sound");

describe("order-alert-sound", () => {
  beforeEach(() => {
    vi.resetModules();
    contexts = [];
    nextState = "running";
    listeners = new Map();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("playOrderAlertSound", () => {
    it("plays a generated chime and vibrates", async () => {
      stubBrowser();
      const { playOrderAlertSound } = await load();

      playOrderAlertSound();

      const [ctx] = contexts;
      expect(ctx.createBuffer).toHaveBeenCalledWith(1, 15, 100);
      expect(ctx.source.connect).toHaveBeenCalledWith(ctx.destination);
      expect(ctx.source.start).toHaveBeenCalled();
      expect(ctx.resume).not.toHaveBeenCalled();
      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
    });

    it("writes a decaying sine wave into the buffer", async () => {
      stubBrowser();
      const { playOrderAlertSound } = await load();

      playOrderAlertSound();

      const buffer = contexts[0].createBuffer.mock.results[0].value;
      expect(buffer.data[0]).toBe(0);
      expect(buffer.data.some((v: number) => v !== 0)).toBe(true);
    });

    it("reuses the audio context across alerts", async () => {
      stubBrowser();
      const { playOrderAlertSound } = await load();

      playOrderAlertSound();
      playOrderAlertSound();

      expect(contexts).toHaveLength(1);
      expect(contexts[0].source.start).toHaveBeenCalledTimes(2);
    });

    it("resumes a suspended context before playing", async () => {
      nextState = "suspended";
      stubBrowser();
      const { playOrderAlertSound } = await load();

      playOrderAlertSound();

      expect(contexts[0].resume).toHaveBeenCalled();
    });

    it("ignores playback errors and still vibrates", async () => {
      stubBrowser();
      const { playOrderAlertSound } = await load();
      playOrderAlertSound();
      contexts[0].createBufferSource.mockImplementation(() => {
        throw new Error("autoplay blocked");
      });

      expect(() => playOrderAlertSound()).not.toThrow();
      expect(navigator.vibrate).toHaveBeenCalledTimes(2);
    });

    it("still vibrates when AudioContext is unavailable", async () => {
      stubBrowser({ audio: false });
      const { playOrderAlertSound } = await load();

      expect(() => playOrderAlertSound()).not.toThrow();
      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it("does nothing without vibration support", async () => {
      stubBrowser({ vibrate: false });
      const { playOrderAlertSound } = await load();

      expect(() => playOrderAlertSound()).not.toThrow();
      expect(contexts[0].source.start).toHaveBeenCalled();
    });

    it("is a no-op on the server", async () => {
      const { playOrderAlertSound } = await load();

      expect(() => playOrderAlertSound()).not.toThrow();
    });
  });

  describe("ensureOrderAlertAudioUnlocked", () => {
    it("attaches one-shot gesture listeners only once", async () => {
      stubBrowser();
      const { ensureOrderAlertAudioUnlocked } = await load();

      ensureOrderAlertAudioUnlocked();
      ensureOrderAlertAudioUnlocked();

      expect(document.addEventListener).toHaveBeenCalledTimes(3);
      expect(document.addEventListener).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
        { once: true, passive: true }
      );
    });

    it("resumes a suspended context on the first gesture and detaches listeners", async () => {
      nextState = "suspended";
      stubBrowser();
      const { ensureOrderAlertAudioUnlocked } = await load();
      ensureOrderAlertAudioUnlocked();

      listeners.get("keydown")!();

      expect(contexts[0].resume).toHaveBeenCalled();
      expect(document.removeEventListener).toHaveBeenCalledTimes(3);
      expect(listeners.size).toBe(0);
    });

    it("swallows a failed resume", async () => {
      nextState = "suspended";
      stubBrowser();
      const { ensureOrderAlertAudioUnlocked } = await load();
      ensureOrderAlertAudioUnlocked();
      const unlock = listeners.get("touchstart")!;
      // The context is created lazily inside unlock(); make its resume reject.
      vi.mocked(AudioContext).mockImplementationOnce(function () {
        const ctx = makeContext("suspended");
        ctx.resume.mockRejectedValue(new Error("denied"));
        contexts.push(ctx);
        return ctx as unknown as AudioContext;
      });

      expect(() => unlock()).not.toThrow();
      await Promise.resolve();
      expect(contexts[0].resume).toHaveBeenCalled();
    });

    it.each([
      ["running", true],
      ["unavailable", false],
    ])("does not resume when audio is %s", async (_label, audio) => {
      stubBrowser({ audio });
      const { ensureOrderAlertAudioUnlocked } = await load();
      ensureOrderAlertAudioUnlocked();

      expect(() => listeners.get("pointerdown")!()).not.toThrow();
      for (const ctx of contexts) expect(ctx.resume).not.toHaveBeenCalled();
    });

    it("is a no-op without a document", async () => {
      const { ensureOrderAlertAudioUnlocked } = await load();

      expect(() => ensureOrderAlertAudioUnlocked()).not.toThrow();
    });
  });
});
