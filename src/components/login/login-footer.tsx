import { Button } from "@/components/ui/button";

interface LoginFooterProps {
  onNavigateToRegister: () => void;
}

export function LoginFooter({ onNavigateToRegister }: LoginFooterProps) {
  return (
    <Button
      variant="link"
      className="text-sm text-blue-600 hover:underline"
      onClick={onNavigateToRegister}
      type="button"
    >
      Don&apos;t have an account?
    </Button>
  );
}
