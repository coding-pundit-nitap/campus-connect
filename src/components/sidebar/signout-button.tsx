"use client";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import React from "react";

import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export default function SignOutButton() {
  const router = useRouter();
  const { data: session } = useSession();
  const handleAuthAction = async () => {
    if (session?.user?.id) {
      await signOut({ callbackUrl: "/" });
    } else {
      router.push("/login");
    }
  };
  return (
    <div className="mt-auto space-y-4 p-4">
      <Separator />
      <div className="space-y-2">
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
