import { Button } from "@/components/ui/button";

import { LoginCard } from "../login";
import SharedDialog from "../shared/shared-dialog";

export default function LoginIndicator() {
  return (
    <div className="flex flex-col space-y-2 items-center justify-center min-h-screen w-full">
      <p>You are not logged in. Please Login.</p>
      <SharedDialog
        trigger={<Button className="w-full">Sign In</Button>}
        title="Sign In"
        description="Sign in to access all features"
        className="w-full"
      >
        <LoginCard />
      </SharedDialog>
    </div>
  );
}
