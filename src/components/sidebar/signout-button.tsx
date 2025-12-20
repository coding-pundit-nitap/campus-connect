import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { LoginCard } from "../login";
import SharedDialog from "../shared/shared-dialog";

export default function SignOutButton() {
  return (
    <div className="mt-auto space-y-4 p-4">
      <Separator />
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Sign in to access all features
        </p>
        <SharedDialog
          trigger={
            <Button>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          }
          title="Sign In"
          description="Sign in to access all features"
        >
          <LoginCard />
        </SharedDialog>
      </div>
    </div>
  );
}
