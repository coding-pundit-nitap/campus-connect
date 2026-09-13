"use client";

import { useMemo } from "react";

import { useIsMounted } from "@/hooks/common/useIsMounted";
import { useSession } from "@/lib/auth-client";

function getTimeGreeting(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export default function HomepageGreeting() {
  const isMounted = useIsMounted();
  const { data: session } = useSession();

  const greeting = useMemo(() => getTimeGreeting(new Date().getHours()), []);
  const firstName = session?.user?.name?.split(" ")[0];

  if (!isMounted) {
    return <div className="h-7 mb-3" />;
  }

  return (
    <p className="text-lg sm:text-xl font-heading font-bold text-foreground mb-3">
      {greeting}
      {firstName ? `, ${firstName}` : ""}
    </p>
  );
}
