"use client";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authClient, useSession } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const { data: session } = useSession();
  const handleAuthAction = async () => {
    if (session?.user?.id) {
      await authClient.signOut({ query: { redirect: "/" } });
    } else {
      router.push("/login");
    }
  };
  return (
    <div className="mt-auto space-y-4 p-4">
      <Separator />
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Sign in to access all features
        </p>
        <Button onClick={handleAuthAction} className="w-full" variant="default">
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </div>
    </div>
  );
}
