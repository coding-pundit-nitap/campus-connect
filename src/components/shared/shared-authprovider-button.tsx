import Image from "next/image";

import { Button } from "@/components/ui/button";
import { AuthProviderConfig } from "@/types";

interface SharedAuthProviderButtonProps {
  config: AuthProviderConfig;
  disabled?: boolean;
  isLoading?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  showIcon?: boolean;
  iconPosition?: "left" | "right";
  className?: string;
}

export function SharedAuthProviderButton({
  config,
  disabled = false,
  isLoading = false,
  size = "default",
  variant = "outline",
  showIcon = true,
  iconPosition = "left",
  className = "",
}: SharedAuthProviderButtonProps) {
  const iconElement = showIcon && (
    <Image
      src={config.iconSrc}
      alt={`${config.provider} Icon`}
      width={16}
      height={16}
      className="shrink-0"
    />
  );

  return (
    <Button
      variant={variant}
      size={size}
      className={`w-full justify-center gap-2 ${className}`}
      onClick={config.onClick}
      disabled={disabled || isLoading}
      type="button"
    >
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          {iconPosition === "left" && iconElement}
          <span>{config.label}</span>
          {iconPosition === "right" && iconElement}
        </>
      )}
    </Button>
  );
}
