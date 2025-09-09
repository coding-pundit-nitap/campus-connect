"use client";

import { useSession } from "next-auth/react";

import { Separator } from "@/components/ui/separator";

import ShopOwnerBadge from "./shop-owner-badge";
import SidebarAction from "./sidebar-action";
import SignOutButton from "./signout-button";
import UserAvatar from "./user-avatar";
import UserDetail from "./user-detail";

export function SidebarFooter() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return (
      <div className="mt-auto space-y-4 p-4">
        <Separator />
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return <SignOutButton />;
  }

  const user = session.user;

  return (
    <div className="mt-auto space-y-4 p-4">
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <UserAvatar user={user} />
          <UserDetail user={user} />
        </div>

        {user.shop_id && <ShopOwnerBadge />}
      </div>
      <SidebarAction />
    </div>
  );
}
