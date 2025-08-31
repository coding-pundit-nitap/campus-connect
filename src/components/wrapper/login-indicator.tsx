import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

export default function LoginIndicator() {
  return (
    <div className="flex flex-col space-y-2 items-center justify-center min-h-screen w-full">
      <p>You are not logged in. Please Login.</p>
      <Button asChild>
        <Link href="/login">Login</Link>
      </Button>
    </div>
  );
}
