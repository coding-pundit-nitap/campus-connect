"use client";

import { Flame, GraduationCap, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useSession } from "@/lib/auth-client";

export default function SmartHero() {
  const { data: session } = useSession();

  const { greeting, emoji, isGuest } = useMemo(() => {
    const hour = new Date().getHours();

    let greet = "Welcome";
    let emo = "🎓";

    if (hour >= 5 && hour < 12) {
      greet = "Good morning";
      emo = "☀️";
    } else if (hour >= 12 && hour < 17) {
      greet = "Good afternoon";
      emo = "☕";
    } else if (hour >= 17 && hour < 22) {
      greet = "Good evening";
      emo = "👋";
    } else {
      greet = "Up late";
      emo = "🦉";
    }

    const isGuest = !session?.user;
    const firstName = session?.user?.name?.split(" ")[0];

    return {
      greeting: firstName ? `${greet}, ${firstName}` : `${greet}, guest`,
      emoji: emo,
      isGuest,
    };
  }, [session]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-muted/80 bg-gradient-to-br from-indigo-50/45 via-background to-violet-50/30 dark:from-indigo-950/15 dark:via-background dark:to-violet-950/15 p-6 md:p-8 mb-6 shadow-sm transition-all duration-500 hover:border-muted-foreground/20 group">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-violet-500/15 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
        <Sparkles className="w-24 h-24 text-primary" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3.5 border border-primary/20">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>NIT AP Campus Hub</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            <span className="truncate max-w-[180px] sm:max-w-[280px] md:max-w-none inline-block align-bottom">
              {greeting}
            </span>{" "}
            <span>{emoji}</span>
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl leading-relaxed font-medium">
            {isGuest
              ? "Your all-in-one campus store. Get snacks, meals, and essentials delivered right to your hostel."
              : "Ready for a quick study break snack or your next meal? We've got your campus favorites covered."}
          </p>
        </div>

        {/* Premium Campus Features Info Navigation Links */}
        <div className="relative z-10 flex flex-wrap gap-2.5 mt-5">
          <Link
            href="/shops"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all duration-300 hover:bg-indigo-500/20 hover:scale-[1.03] active:scale-95 hover:shadow-xs cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Explore Canteens</span>
          </Link>

          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all duration-300 hover:bg-emerald-500/20 hover:scale-[1.03] active:scale-95 hover:shadow-xs cursor-pointer"
          >
            <span>⚡</span>
            <span>Track Orders</span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all duration-300 hover:bg-amber-500/20 hover:scale-[1.03] active:scale-95 hover:shadow-xs cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500/10" />
            <span>My Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
