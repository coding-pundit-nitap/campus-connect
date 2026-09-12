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
  totalSteps: number;
  stepsMeta: StepMeta[];
  stepEstimates: Record<number, string>;
}

export function StepSidebar({
  step,
  totalSteps,
  stepsMeta,
  stepEstimates,
}: StepSidebarProps) {
  return (
    <div className="sticky top-8">
      <div className="mb-7">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Create your shop
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set up your storefront in {totalSteps} short steps.
        </p>
      </div>

      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <Progress
          value={(step / totalSteps) * 100}
          className="h-1.5 rounded-full bg-muted [&_div]:bg-indigo-600"
        />
        <p className="text-xs text-muted-foreground">
          {stepEstimates[step]}
        </p>
      </div>

      <nav className="relative flex flex-col gap-6 pl-2">
        <div className="pointer-events-none absolute top-2 bottom-2 left-4.5 w-px bg-border/50" />

        {stepsMeta.map((s) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          const StepIcon = s.icon;

          return (
            <div
              key={s.num}
              className={cn(
                "relative flex items-start gap-4 transition-opacity duration-200",
                isActive ? "opacity-100" : "opacity-55 hover:opacity-80"
              )}
            >
              <div
                className={cn(
                  "z-10 flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                  isCompleted
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : isActive
                      ? "scale-110 border-indigo-600 bg-indigo-600/10 text-indigo-600 shadow-lg shadow-indigo-600/[0.08]"
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
                    "text-sm font-semibold leading-tight transition-colors duration-200",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.title}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground/80">
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
