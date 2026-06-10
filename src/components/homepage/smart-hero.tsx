"use client";

import { Flame, GraduationCap, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";

import { useSession } from "@/lib/auth-client";

/**
 * Pure helper function to compute greeting time-of-day salutation and guest context
 */
function getGreetingAndTimeContext(
  user:
    | { name?: string | null; email?: string | null; image?: string | null }
    | undefined
    | null
) {
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

  const isGuest = !user;
  const firstName = user?.name?.split(" ")[0];

  return {
    greeting: firstName ? `${greet}, ${firstName}` : `${greet}, guest`,
    emoji: emo,
    isGuest,
  };
}

interface SmartHeroProps {
  selectedCategoryName?: string | null;
  onClearCategory?: () => void;
}

export default function SmartHero({
  selectedCategoryName,
  onClearCategory,
}: SmartHeroProps = {}) {
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const { greeting, emoji, isGuest } = useMemo(() => {
    if (!mounted) {
      const isGuest = !session?.user;
      const firstName = session?.user?.name?.split(" ")[0];
      return {
        greeting: firstName ? `Welcome, ${firstName}` : "Welcome, guest",
        emoji: "🎓",
        isGuest,
      };
    }
    return getGreetingAndTimeContext(session?.user);
  }, [session?.user, mounted]);

  if (selectedCategoryName) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-primary/20 bg-gradient-to-tr from-blue-600/10 via-orange-500/5 to-indigo-600/10 dark:from-blue-950/20 dark:via-orange-950/5 dark:to-indigo-950/20 p-5 mb-6 shadow-md transition-all duration-300 hover:border-primary/45 group animate-aurora">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        {/* Auroral blurs */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-orange-500/15 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/25 dark:bg-primary/20 dark:text-primary-foreground select-none">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>NIT AP Campus Feed</span>
            </div>
            <h2 className="text-xl md:text-2xl font-heading font-black tracking-tight text-foreground flex items-center gap-2">
              <span>Browsing</span>
              <span className="text-orange-500 dark:text-orange-400 capitalize bg-orange-500/10 dark:bg-orange-500/20 px-2.5 py-0.5 rounded-lg border border-orange-500/25">
                {selectedCategoryName}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground font-sans font-medium">
              Showing available dishes and snacks in this category
            </p>
          </div>

          <button
            onClick={onClearCategory}
            className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-background/90 hover:bg-muted text-foreground border border-muted transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span>Show All Categories</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-primary/20 bg-gradient-to-tr from-blue-600/10 via-orange-500/5 to-indigo-600/10 dark:from-blue-950/20 dark:via-orange-950/5 dark:to-indigo-950/20 p-6 md:p-8 mb-6 shadow-md transition-all duration-500 hover:border-primary/45 group animate-aurora">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Auroral blurs */}
      <div className="absolute -right-8 -top-8 w-44 h-44 bg-blue-500/20 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-orange-500/15 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute right-6 bottom-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transition-transform duration-700 group-hover:scale-110">
        <Sparkles className="w-32 h-32 text-primary" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-4 border border-primary/25 dark:bg-primary/20 dark:text-primary-foreground select-none">
            <GraduationCap className="w-4 h-4" />
            <span>NIT AP Campus Hub</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-foreground leading-none">
            <span className="truncate max-w-[200px] sm:max-w-[320px] md:max-w-none inline-block align-bottom">
              {greeting}
            </span>{" "}
            <span className="inline-block animate-bounce">{emoji}</span>
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-xl leading-relaxed font-sans font-medium">
            {isGuest
              ? "Your all-in-one campus store. Get snacks, meals, and essentials delivered right to your hostel."
              : "Ready for a quick study break snack or your next meal? We've got your campus favorites covered."}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 mt-6">
          <Link
            href="/shops"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white border border-orange-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Explore Canteens</span>
          </Link>

          <Link
            href="/orders"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border border-blue-700/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>⚡</span>
            <span>Track Orders</span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-background/85 hover:bg-muted text-foreground border border-muted transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm cursor-pointer"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500/10" />
            <span>My Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
