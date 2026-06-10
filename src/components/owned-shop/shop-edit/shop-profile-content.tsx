"use client";

import {
  AlertCircle,
  CreditCard,
  Edit2,
  Mail,
  MapPin,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { sanitizeHTML } from "@/lib/sanitize";
import { ImageUtils } from "@/lib/utils/image.utils";
import { ShopUpdateFormShop } from "@/types/shop.types";

import { ShopEditForm } from "./shop-edit-form";

interface ShopProfileContentProps {
  shop: ShopUpdateFormShop;
}

export function ShopProfileContent({ shop }: ShopProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-border/30 shadow-xl overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Edit Shop Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium">
                Modify your shop settings, operating hours, delivery fees, and
                UPI settings.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border-border/60 hover:bg-muted/40 font-semibold text-xs cursor-pointer h-9 px-4 shrink-0 transition-all hover:scale-102 active:scale-98"
            >
              Back to Profile
            </Button>
          </div>
          <div className="border-t border-border/30 pt-6">
            <ShopEditForm shop={shop} onCancel={() => setIsEditing(false)} />
          </div>
        </div>
      </div>
    );
  }

  const hasImage = !!shop.image_key;
  const hasQr = !!shop.qr_image_key;

  return (
    <div className="space-y-6">
      {/* Shop Banner Header */}
      <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-orange-500 shadow-md">
        {hasImage && (
          <Image
            src={ImageUtils.getImageUrl(shop.image_key)}
            alt={shop.name}
            fill
            className="object-cover opacity-60 blur-[1px]"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/45" />

        {/* Floating Actions inside Banner */}
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/25 rounded-xl px-4 py-2 font-bold text-xs transition-all hover:scale-102 active:scale-98 shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit Shop
        </button>

        {/* Canteen Logo / Brand Name Floating Info */}
        <div className="absolute bottom-6 left-6 flex items-center gap-4 text-white">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-white/90 bg-card overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
            {hasImage ? (
              <Image
                src={ImageUtils.getImageUrl(shop.image_key)}
                alt="Shop Logo"
                fill
                className="object-cover"
              />
            ) : (
              <Store className="w-9 h-9 text-blue-600" />
            )}
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <h2 className="text-lg sm:text-2xl font-black font-heading tracking-tight leading-none drop-shadow-md">
              {shop.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-orange-400 bg-orange-950/40 px-2.5 py-0.5 rounded-full inline-block backdrop-blur-xs">
                {shop.opening} - {shop.closing}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Details Area */}
        <div className="md:col-span-8 space-y-6">
          {/* Shop Description */}
          <div className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl p-6 relative overflow-hidden space-y-3 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-blue-500/20" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              About Canteen
            </h3>
            {shop.description ? (
              <div
                className="text-sm leading-relaxed text-muted-foreground prose prose-sm dark:prose-invert max-w-none font-medium"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(shop.description),
                }}
              />
            ) : (
              <p className="text-sm italic text-muted-foreground/60 leading-relaxed font-medium">
                No description provided. Click "Edit Shop" to describe your
                canteen.
              </p>
            )}
          </div>

          {/* Logistics & Delivery Details */}
          <div className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl p-6 relative overflow-hidden space-y-4 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500/20" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Logistics & Delivery Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-muted/10 border border-border/20 p-3.5 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Pickup Location
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {shop.location}
                  </p>
                </div>
              </div>

              <div className="bg-muted/10 border border-border/20 p-3.5 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg shrink-0 mt-0.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Minimum Basket Value
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    ₹{shop.min_order_value}
                  </p>
                </div>
              </div>

              <div className="bg-muted/10 border border-border/20 p-3.5 rounded-xl flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="space-y-1 w-full">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Delivery Rates
                  </span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1">
                      Batch Slot:{" "}
                      <strong className="text-emerald-600 font-extrabold">
                        ₹{shop.default_delivery_fee}
                      </strong>
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="flex items-center gap-1">
                      Direct Immediate:{" "}
                      <strong className="text-emerald-600 font-extrabold">
                        ₹{shop.direct_delivery_fee}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="md:col-span-4 space-y-6">
          {/* Payouts / Billing details */}
          <div className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl p-6 relative overflow-hidden space-y-4 shadow-sm flex flex-col justify-between">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-500 to-orange-400/20" />
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-orange-500" />
                Payments Billing
              </h3>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  UPI ID Address
                </span>
                {shop.upi_id ? (
                  <div className="bg-muted/20 border border-border/20 p-2.5 rounded-xl font-mono text-xs font-bold uppercase text-foreground tracking-wider select-all text-center break-all">
                    {shop.upi_id}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground font-medium">
                    No UPI Address linked.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-center">
                UPI QR Code
              </span>
              {hasQr ? (
                <div className="relative border border-border/20 p-2 bg-white rounded-xl w-32 h-32 mx-auto flex items-center justify-center shadow-sm hover:scale-102 transition-transform duration-200">
                  <Image
                    src={ImageUtils.getImageUrl(shop.qr_image_key)}
                    alt="UPI QR Code"
                    fill
                    className="object-contain p-1.5"
                  />
                </div>
              ) : (
                <div className="border border-dashed border-border/40 bg-muted/15 p-4 rounded-xl text-center space-y-1 flex flex-col items-center justify-center min-h-[128px]">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground font-semibold leading-tight">
                    No QR Code Uploaded
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Account Owner Details */}
          <div className="bg-card/45 backdrop-blur-xl border border-border/30 rounded-2xl p-5 relative overflow-hidden space-y-3.5 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500/20" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Merchant Owner Account
            </h3>
            {shop.user ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted/30 border border-border/20 rounded-lg text-muted-foreground shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 leading-none">
                      Full Name
                    </p>
                    <p className="font-semibold text-foreground truncate mt-0.5">
                      {shop.user.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted/30 border border-border/20 rounded-lg text-muted-foreground shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80 leading-none">
                      Email Address
                    </p>
                    <p className="font-semibold text-foreground truncate mt-0.5">
                      {shop.user.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground font-medium">
                No owner account linked.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
