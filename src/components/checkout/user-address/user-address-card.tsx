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
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary border-primary" : ""
      }`}
      onClick={() => onSelect?.(address)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {onSelect && (
            <div className="shrink-0 mt-1">
              {isSelected ? (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{address.label}</span>
              {address.is_default && (
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
              {address.hostel_block && (
                <Badge variant="outline" className="text-xs">
                  {address.hostel_block}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {`${address.building}, Room ${address.room_number}`}
            </p>

            {address.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Note: {address.notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-4">
          {!address.is_default && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-2 py-1 h-auto"
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
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
