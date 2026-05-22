"use client";

import { Check, Clock, CreditCard, MapPin } from "lucide-react";

import { cn } from "@/lib/cn";

export type CheckoutStep = "address" | "timing" | "payment" | "complete";

const steps = [
  {
    id: "address" as const,
    label: "Delivery Address",
    icon: MapPin,
    description: "Where to deliver",
  },
  {
    id: "timing" as const,
    label: "Delivery Time",
    icon: Clock,
    description: "Choose batch or direct",
  },
  {
    id: "payment" as const,
    label: "Payment",
    icon: CreditCard,
    description: "Choose method",
  },
];

function getStepIndex(step: CheckoutStep): number {
  if (step === "complete") return 3;
  return steps.findIndex((s) => s.id === step);
}

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  className?: string;
}

export function CheckoutStepper({
  currentStep,
  className,
}: CheckoutStepperProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className={cn("w-full py-2", className)}>
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-500",
                    isCompleted &&
                      "violet-600 border-transparent text-white shadow-lg shadow-indigo-500/20",
                    isActive &&
                      "border-indigo-500 bg-indigo-500/10 text-indigo-500 scale-110 shadow-lg shadow-indigo-500/[0.08]",
                    !isCompleted &&
                      !isActive &&
                      "border-border/60 bg-muted/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      "text-sm font-semibold tracking-tight transition-colors",
                      isActive && "text-foreground",
                      isCompleted && "text-muted-foreground",
                      !isActive && !isCompleted && "text-muted-foreground/60"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground/80 font-medium hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "w-12 lg:w-16 h-[2px] mx-4 transition-all duration-500 rounded-full",
                    isCompleted ? "violet-500" : "bg-border/60"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3 bg-muted/30 p-1.5 rounded-lg border border-border/20">
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex-1 h-1.5 mx-1 rounded-full transition-all duration-500",
                  isCompleted && "violet-500",
                  isActive && "bg-indigo-500 shadow shadow-indigo-500/30",
                  !isCompleted && !isActive && "bg-muted-foreground/20"
                )}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2.5 px-1">
          {(() => {
            const step = steps[currentIndex < 3 ? currentIndex : 2];
            const StepIcon = step.icon;
            return (
              <>
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <StepIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  Step {Math.min(currentIndex + 1, 3)} of 3: {step.label}
                </span>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
