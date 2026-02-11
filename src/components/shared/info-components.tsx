import { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface InfoCardProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantStyles = {
  default: "bg-white dark:bg-gray-800 border",
  primary:
    "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20",
  success:
    "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
  warning:
    "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800",
  danger:
    "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
  info: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
};

export function InfoCard({
  children,
  variant = "default",
  className,
}: InfoCardProps) {
  return (
    <div
      className={cn("rounded-lg p-5 my-4", variantStyles[variant], className)}
    >
      {children}
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
  return (
    <section id={id} className={cn("mb-10", className)}>
      <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export interface InfoSubsectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function InfoSubsection({
  title,
  children,
  className,
}: InfoSubsectionProps) {
  return (
    <div className={cn("my-6", className)}>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
