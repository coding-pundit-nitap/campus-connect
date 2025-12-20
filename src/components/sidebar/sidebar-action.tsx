"use client";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";

export default function SidebarAction() {
  const router = useRouter();
  const { data: session } = useSession();
  const handleAuthAction = async () => {
    if (session?.user?.id) {
      await authClient.signOut({ query: { redirect: "/" } });
    } else {
      router.push("/");
    }
  };
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full items-center"
        onClick={() => router.push("/profile")}
      >
        <User className="mr-2 h-4 w-4" />
        Profile Settings
      </Button>

      <Button
        onClick={handleAuthAction}
        variant="destructive"
        size="sm"
        className="w-full items-center"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
