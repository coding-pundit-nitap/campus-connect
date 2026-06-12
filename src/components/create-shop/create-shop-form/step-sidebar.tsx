import { CheckCircle2, LucideIcon } from "lucide-react";
import React from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";

interface StepMeta {
  num: number;
  title: string;
  desc: string;
  icon: LucideIcon;
}

interface StepSidebarProps {
  step: number;
  stepsMeta: StepMeta[];
  stepEstimates: Record<number, string>;
}

export function StepSidebar({
  step,
  stepsMeta,
  stepEstimates,
}: StepSidebarProps) {
  return (
    <div className="sticky top-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black font-heading tracking-tight text-foreground">
          Create Shop
        </h1>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
          Set up your store and delivery details in 5 simple steps.
        </p>
      </div>

      <div className="space-y-2 mb-8">
        <div className="flex justify-between text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
          <span>Progress</span>
          <span>{Math.round((step / 5) * 100)}%</span>
        </div>
        <Progress
          value={(step / 5) * 100}
          className="h-1.5 bg-muted rounded-full [&_div]:bg-gradient-to-r [&_div]:from-blue-600 [&_div]:to-orange-500"
        />
        <p className="text-[10px] text-muted-foreground/80 font-medium mt-1">
          {stepEstimates[step]}
        </p>
      </div>

      <nav className="relative flex flex-col gap-6 pl-2">
        <div className="absolute left-4.5 top-2 bottom-2 w-[1.5px] bg-border/40 pointer-events-none" />

        {stepsMeta.map((s) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          const StepIcon = s.icon;

          return (
            <div
              key={s.num}
              className={cn(
                "relative flex items-start gap-4 transition-all duration-200",
                isActive ? "opacity-100" : "opacity-60 hover:opacity-80"
              )}
            >
              <div
                className={cn(
                  "z-10 flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-300",
                  isCompleted
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : isActive
                      ? "border-orange-500 bg-orange-500/10 text-orange-500 scale-110 shadow-lg shadow-orange-500/[0.08]"
                      : "border-border/60 bg-muted/20 text-muted-foreground/60"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <StepIcon className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-xs font-semibold leading-tight transition-colors duration-200",
                    isActive
                      ? "text-foreground font-bold"
                      : "text-muted-foreground"
                  )}
                >
                  {s.title}
                </span>
                <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                  {s.desc}
                </span>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
