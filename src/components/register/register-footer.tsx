import { Button } from "../ui/button";

interface RegisterFooterProps {
  onNavigateToLogin: () => void;
}

export function RegisterFooter({ onNavigateToLogin }: RegisterFooterProps) {
  return (
    <Button
      variant="link"
      className="text-sm text-blue-600 hover:underline"
      onClick={onNavigateToLogin}
      type="button"
    >
      Already have an account?
    </Button>
  );
}
