"use client";

import { ArrowRight, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import { ImageUtils } from "@/lib/utils";
import { Role } from "@/types/prisma.types";

import { Button } from "../ui/button";
import ShopOwnerBadge from "./shop-owner-badge";
import SidebarAction from "./sidebar-action";
import SignOutButton from "./signout-button";
import UserAvatar from "./user-avatar";
import UserDetail from "./user-detail";

export function SidebarFooter() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  const setMountedTrue = useEffectEvent(() => {
    setMounted(true);
  });

  useEffect(() => {
    setMountedTrue();
  }, []);

  if (!mounted) {
    return null;
  }

  if (!session?.user) {
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
            image={ImageUtils.getImageUrl(user.image)}
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
        {user.role === Role.ADMIN && (
          <>
            <Separator />
            <Button variant="outline" className="w-full p-0" asChild>
              <Link href="/admin" className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  <span>Go to Admin Page</span>
                </div>
              </Link>
            </Button>
          </>
        )}
      </div>
      <SidebarAction />
    </div>
  );
}
