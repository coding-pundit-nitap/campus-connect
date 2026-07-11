import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { ReloadButton } from "./ReloadButton";

export const metadata: Metadata = {
  title: "Offline | Campus Connect",
};

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-6">
        <Image
          src="/android-chrome-192x192.png"
          alt="Campus Connect"
          width={80}
          height={80}
          className="rounded-2xl"
          priority
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <WifiOff
            className="h-8 w-8"
            style={{ color: "oklch(0.141 0.005 285.823)" }}
          />
        </div>

        <div className="space-y-2">
          <h1
            className="font-heading text-2xl font-bold"
            style={{ color: "oklch(0.21 0.006 285.885)" }}
          >
            You&apos;re offline
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "oklch(0.141 0.005 285.823)" }}
          >
            It looks like you&apos;ve lost your internet connection. Some
            features may be unavailable.
          </p>
        </div>

        <ReloadButton />
      </div>
    </main>
  );
}
