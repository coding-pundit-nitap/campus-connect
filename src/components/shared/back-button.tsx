"use client";

import { ArrowLeft } from "lucide-react";
import { Route } from "next";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface BackButtonProps {
  href?: Route;
  label?: string;
  className?: string;
}

export function BackButton({
  href,
  label = "Back",
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "gap-2 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
