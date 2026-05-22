"use client";

import { ArrowRight, Flame,GraduationCap, Sparkles } from "lucide-react";
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

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-muted/80 bg-gradient-to-br from-indigo-50/45 via-background to-violet-50/30 dark:from-indigo-950/15 dark:via-background dark:to-violet-950/15 p-6 md:p-8 mb-6 shadow-sm transition-all duration-500 hover:border-muted-foreground/20 group">
      {/* ambient background */}
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
              : "Ready for a quick study break snack or your next meal? We’ve got your campus favorites covered."}
          </p>
        </div>

        {/* CTA Chips */}
        <div className="relative z-10 flex flex-wrap gap-2.5 mt-5">
          <button
            onClick={() => handleScrollTo("category-pills-section")}
            className="h-9 px-4 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 bg-primary text-primary-foreground border border-primary hover:bg-primary/95 hover:shadow-md hover:shadow-primary/20 flex items-center gap-1 group/btn cursor-pointer"
          >
            Explore Categories
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </button>

          <button
            onClick={() => handleScrollTo("hot-deals-section")}
            className="h-9 px-4 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 bg-card/45 backdrop-blur-sm border border-muted/80 text-muted-foreground hover:text-foreground hover:bg-card hover:border-muted-foreground/30 shadow-sm flex items-center gap-1.5 group/btn cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500/10 group-hover/btn:animate-pulse" />
            Browse Hot Deals
          </button>

          <button
            onClick={() => handleScrollTo("products-feed-section")}
            className="h-9 px-4 rounded-full text-xs font-semibold transition-all duration-300 active:scale-95 bg-card/45 backdrop-blur-sm border border-muted/80 text-muted-foreground hover:text-foreground hover:bg-card hover:border-muted-foreground/30 shadow-sm flex items-center gap-1 cursor-pointer"
          >
            All Products
          </button>
        </div>
      </div>
    </div>
  );
}
