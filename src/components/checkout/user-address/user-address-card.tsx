"use client";

import { Check, Trash2 } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAddress } from "@/types/prisma.types";

interface UserAddressCardProps {
  address: UserAddress;
  isSelected: boolean;
  onSelect?: (address: UserAddress) => void;
  onSetDefault: (addressId: string) => void;
  onDelete: (address: UserAddress) => void;
  isSetDefaultPending: boolean;
  isDeletePending: boolean;
}

export function UserAddressCard({
  address,
  isSelected,
  onSelect,
  onSetDefault,
  onDelete,
  isSetDefaultPending,
  isDeletePending,
}: UserAddressCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] border bg-card/40 backdrop-blur-md ${
        isSelected
          ? "ring-2 ring-indigo-500/50 bg-indigo-500/[0.03] border-indigo-500 shadow-lg shadow-indigo-500/[0.05]"
          : "border-border/40 hover:border-border/80 shadow-sm hover:shadow-md"
      }`}
      onClick={() => onSelect?.(address)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5 flex-1">
          {onSelect && (
            <div className="shrink-0 mt-1">
              {isSelected ? (
                <div className="h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center shadow shadow-indigo-500/30 transition-transform duration-300 scale-100">
                  <Check className="h-3 w-3 text-white stroke-[3.5]" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 hover:border-muted-foreground transition-colors duration-300" />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                {address.label}
              </span>
              {address.is_default && (
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  Default
                </Badge>
              )}
              {address.hostel_block && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold px-1.5 py-0 bg-indigo-500/5 text-indigo-500 border-indigo-500/20"
                >
                  {address.hostel_block}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {`${address.building}, Room ${address.room_number}`}
            </p>

            {address.notes && (
              <p className="text-xs text-muted-foreground/70 mt-1.5 italic flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
                Note: {address.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-4 z-10">
          {!address.is_default && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/5 px-2.5 py-1 h-8 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(address.id);
              }}
              disabled={isSetDefaultPending}
            >
              Set Default
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors duration-300"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(address);
            }}
            disabled={isDeletePending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
