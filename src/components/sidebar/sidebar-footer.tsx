"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Separator } from "@/components/ui/separator";

import { Button } from "../ui/button";
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
          <UserAvatar
            dimention={40}
            image={user.image}
            email={user.email}
            name={user.name}
          />
          <UserDetail user={user} />
        </div>
        {user.shop_id && <ShopOwnerBadge />}
        <Separator />
        <Button variant="outline" className="w-full p-0" asChild>
          <Link
            href="/owner-shops"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span>{user.shop_id ? "Manage Shops" : "Add Shops"}</span>
            </div>
          </Link>
        </Button>
      </div>
      <SidebarAction />
    </div>
  );
}
