"use client";
import { MapPin, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <MapPin className="h-5 w-5 shrink-0" />
        <p className="text-sm font-semibold truncate">
          Add your hostel address to start ordering!
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="h-8 text-xs font-bold"
        >
          <Link href="/profile#addresses">Add Address</Link>
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/20 rounded cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
