import { ChevronRight } from "lucide-react";
import React from "react";

import { UserAddress } from "@/components/checkout";
import { Button } from "@/components/ui/button";
import { UserAddress as UserAddressType } from "@/types/prisma.types";

interface AddressStepProps {
  selectedAddress: UserAddressType | null;
  onAddressSelect: (address: UserAddressType) => void;
  shop_id: string;
  isAddressAllowed: boolean;
  onConfirm: () => void;
}

export function AddressStep({
  selectedAddress,
  onAddressSelect,
  shop_id,
  isAddressAllowed,
  onConfirm,
}: AddressStepProps) {
  return (
    <div className="p-5 border-t border-border/10 space-y-4">
      <UserAddress
        selectedAddressId={selectedAddress?.id || null}
        onAddressSelect={onAddressSelect}
        shopId={shop_id}
      />
      {selectedAddress && (
        <div className="space-y-3 w-full">
          {!isAddressAllowed && (
            <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 text-rose-500 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-sm">⚠️</span>
              <div>
                This shop does not deliver to {selectedAddress.building}.
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  Please select or add a different address inside the shop's
                  delivery zone.
                </p>
              </div>
            </div>
          )}
          <Button
            onClick={onConfirm}
            disabled={!isAddressAllowed}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white font-bold rounded-xl shadow shadow-blue-500/10 mt-2 flex items-center justify-center gap-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            Confirm Address & Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
