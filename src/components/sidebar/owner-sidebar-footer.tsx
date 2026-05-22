"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { useOwnerContext } from "@/components/owned-shop/owner-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNextSlot, useToggleAcceptingOrders } from "@/hooks";
import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

import { CutoffCountdown } from "./cutoff-countdown";

export function OwnerSidebarFooter() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { shop, isLoading: isShopLoading } = useOwnerContext();

  const shopId = shop?.id || "";
  const nextSlot = useNextSlot(shopId);
  const { mutate: toggleOrders, isPending: isToggling } =
    useToggleAcceptingOrders();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState(false);

  if (isShopLoading || !shop) {
    return (
      <div className="p-4 space-y-3 border-t border-sidebar-border mt-auto">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const handleToggleClick = (checked: boolean) => {
    setPendingValue(checked);
    setConfirmOpen(true);
  };

  const handleConfirmToggle = () => {
    setConfirmOpen(false);
    toggleOrders(pendingValue, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.shops.byUser(),
        });
      },
    });
  };

  const isAcceptingOrders = shop.accepting_orders;
  const userImageUrl = session?.user?.image || undefined;
  const userName = session?.user?.name || "Merchant";
  const userEmail = session?.user?.email || "";

  return (
    <div className="flex flex-col gap-4 p-4 border-t border-sidebar-border mt-auto bg-sidebar-accent/5">
      {/* Operating State Panel */}
      <div className="rounded-lg border border-sidebar-border bg-sidebar-background p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Status
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">
              {isAcceptingOrders ? "Active" : "Paused"}
            </span>
            <Switch
              checked={isAcceptingOrders}
              onCheckedChange={handleToggleClick}
              disabled={isToggling}
              className="scale-75"
            />
          </div>
        </div>

        {!isAcceptingOrders ? (
          <div className="flex items-start gap-2 bg-amber-500/10 p-2 rounded border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="leading-normal">
              Incoming orders paused. Customers cannot place orders right now.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {nextSlot.isLoading ? (
              <div className="h-6 w-full bg-muted animate-pulse rounded" />
            ) : nextSlot.data?.enabled && nextSlot.data.cutoff_time ? (
              <div className="space-y-1.5">
                <div className="text-[10px] text-muted-foreground">
                  Next Cutoff Timer:
                </div>
                <CutoffCountdown targetTime={nextSlot.data.cutoff_time} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <span className="truncate">Direct Delivery Mode</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Info Block */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border shadow-xs">
          <AvatarImage src={userImageUrl} alt={userName} />
          <AvatarFallback className="bg-muted text-xs">
            <User className="h-4 w-4 text-muted-foreground/60" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate text-xs font-semibold text-sidebar-foreground">
            {userName}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">
            {userEmail}
          </span>
        </div>
      </div>

      {/* Back to Customer View Link */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs font-medium"
        asChild
      >
        <Link href="/">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Customer View
        </Link>
      </Button>

      {/* AlertDialog Confirmation Popover */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingValue
                ? "Resume incoming orders?"
                : "Pause incoming orders?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValue
                ? "Your shop will immediately become visible to customers, and you will begin receiving new orders."
                : "Your shop will be temporarily placed in holiday mode. Customers will not be able to place new orders until you resume."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              className={
                pendingValue
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {pendingValue ? "Resume Orders" : "Pause Orders"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
