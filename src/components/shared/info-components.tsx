"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
} from "lucide-react";
import { ReactNode, useState } from "react";

import { cn } from "@/lib/cn";

export interface InfoCardProps {
  children: ReactNode;
  title?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  icon?: ReactNode;
  id?: string;
}

const variantStyles = {
  default: "bg-card text-card-foreground border-border shadow-sm",
  primary:
    "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
  success:
    "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
  warning:
    "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
  danger: "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  info: "bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800",
};

const variantIcons = {
  default: <FileText className="w-5 h-5" />,
  primary: <Info className="w-5 h-5 text-blue-500" />,
  success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  danger: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-sky-500" />,
};

export function InfoCard({
  children,
  title,
  variant = "default",
  className,
  collapsible = false,
  defaultOpen = false,
  icon,
  id,
}: InfoCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen || !collapsible);

  const toggle = () => {
    if (collapsible) setIsOpen(!isOpen);
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        variantStyles[variant],
        collapsible && "cursor-pointer hover:shadow-md",
        className
      )}
      id={id}
    >
      {(title || collapsible) && (
        <div
          onClick={toggle}
          className={cn(
            "flex items-center gap-3 p-5",
            collapsible && !isOpen
              ? "border-b-0"
              : title
                ? "border-b border-black/5 dark:border-white/5"
                : ""
          )}
        >
          {icon || (variant !== "default" && variantIcons[variant])}

          <h3 className="flex-1 font-semibold text-lg">{title}</h3>

          {collapsible && (
            <button className="text-muted-foreground p-1 hover:bg-black/5 rounded-full transition-colors">
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn("p-5", title && "pt-4")}>{children}</div>
      </div>
    </div>
  );
}

export interface InfoSectionProps {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
}

export function InfoSection({
  title,
  children,
  id,
  className,
}: InfoSectionProps) {
  const sectionId = id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <section id={sectionId} className={cn("mb-12 scroll-mt-24", className)}>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <div className="h-px bg-border flex-1 ml-4 opacity-50" />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
