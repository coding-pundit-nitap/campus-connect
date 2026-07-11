"use client";

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="cursor-pointer rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      style={{ backgroundColor: "oklch(0.21 0.006 285.885)" }}
    >
      Try Again
    </button>
  );
}
