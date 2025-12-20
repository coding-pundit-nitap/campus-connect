"use client";

import { Check, CreditCard, MapPin } from "lucide-react";

import { cn } from "@/lib/cn";

export type CheckoutStep = "address" | "payment" | "complete";

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  className?: string;
}

const steps = [
  {
    id: "address" as const,
    label: "Address & Time",
    icon: MapPin,
    description: "Delivery details",
  },
  {
    id: "payment" as const,
    label: "Payment",
    icon: CreditCard,
    description: "Choose payment method",
  },
  {
    id: "complete" as const,
    label: "Complete",
    icon: Check,
    description: "Order confirmed",
  },
];

function getStepIndex(step: CheckoutStep): number {
  return steps.findIndex((s) => s.id === step);
}

export function CheckoutStepper({
  currentStep,
  className,
}: CheckoutStepperProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className={cn("w-full", className)}>
      <div className="hidden md:flex items-center justify-center">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isActive &&
                      "border-primary bg-primary/10 text-primary scale-110",
                    !isCompleted &&
                      !isActive &&
                      "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive && "text-primary",
                      isCompleted && "text-primary",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "w-16 lg:w-24 h-0.5 mx-2 mt-[-1.5rem] transition-colors duration-300",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex-1 h-1.5 mx-0.5 rounded-full transition-colors duration-300",
                  index === 0 && "ml-0",
                  index === steps.length - 1 && "mr-0",
                  isCompleted && "bg-primary",
                  isActive && "bg-primary/50",
                  !isCompleted && !isActive && "bg-muted-foreground/30"
                )}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const step = steps[currentIndex];
            const StepIcon = step.icon;
            return (
              <>
                <StepIcon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">
                  Step {currentIndex + 1} of {steps.length}: {step.label}
                </span>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
