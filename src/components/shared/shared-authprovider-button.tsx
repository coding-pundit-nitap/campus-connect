import Image from "next/image";
import { Button } from "../ui/button";
import { AuthProviderConfig } from "@/types/ui";

interface AuthProviderButtonProps {
  config: AuthProviderConfig;
  disabled?: boolean;
}

export function SharedAuthProviderButton({
  config,
  disabled = false,
}: AuthProviderButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={config.onClick}
      type="button"
      disabled={disabled}
    >
      <Image
        src={config.iconSrc}
        alt={`${config.provider} Icon`}
        width={16}
        height={16}
      />
      {config.label}
    </Button>
  );
}
