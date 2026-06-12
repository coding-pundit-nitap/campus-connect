import {
  Check,
  CheckCircle2,
  Copy,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { ImageUtils } from "@/lib/utils";
import { PaymentMethod } from "@/types/prisma.types";

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  upiTransactionId: string;
  setUpiTransactionId: (val: string) => void;
  isPlacingOrder: boolean;
  isUpiValid: boolean;
  upi_id: string;
  qr_image_key: string;
  total: number;
  handleCopyUpi: () => void;
  masterActionButton: React.ReactNode;
}

export function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  upiTransactionId,
  setUpiTransactionId,
  isPlacingOrder,
  isUpiValid,
  upi_id,
  qr_image_key,
  total,
  handleCopyUpi,
  masterActionButton,
}: PaymentStepProps) {
  return (
    <div className="p-5 border-t border-border/10 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setPaymentMethod(PaymentMethod.CASH)}
          className={cn(
            "flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-300 bg-card/30 hover:translate-y-[-2px] relative overflow-hidden",
            paymentMethod === PaymentMethod.CASH
              ? "ring-2 ring-blue-600/50 bg-blue-600/[0.03] border-blue-600 shadow-md"
              : "border-border/40 hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white shrink-0 shadow">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm tracking-tight text-foreground">
              Cash on Delivery
            </h4>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-snug">
              Pay with cash to courier once delivery reaches your block.
            </p>
          </div>
          {paymentMethod === PaymentMethod.CASH && (
            <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center absolute top-4 right-4 animate-in zoom-in-50 duration-200">
              <Check className="h-2.5 w-2.5 text-white stroke-[3.5]" />
            </div>
          )}
        </div>

        <div
          onClick={() => setPaymentMethod(PaymentMethod.ONLINE)}
          className={cn(
            "flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-300 bg-card/30 hover:translate-y-[-2px] relative overflow-hidden",
            paymentMethod === PaymentMethod.ONLINE
              ? "ring-2 ring-blue-600/50 bg-blue-600/[0.03] border-blue-600 shadow-md"
              : "border-border/40 hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shrink-0 shadow">
            <QrCode className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm tracking-tight text-foreground">
              UPI Payment
            </h4>
            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-snug">
              Instant scan payment via Google Pay, PhonePe, Paytm.
            </p>
          </div>
          {paymentMethod === PaymentMethod.ONLINE && (
            <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center absolute top-4 right-4 animate-in zoom-in-50 duration-200">
              <Check className="h-2.5 w-2.5 text-white stroke-[3.5]" />
            </div>
          )}
        </div>
      </div>

      {paymentMethod === PaymentMethod.ONLINE && (
        <div className="p-5 border border-border/20 rounded-2xl bg-muted/20 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-tr from-blue-600/10 to-orange-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground">
              UPI QR Verification
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium">
              Scan this QR using your payment client app and submit the
              Transaction ID below.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative p-4 bg-white dark:bg-white rounded-2xl shadow-xl border border-white/50 max-w-[210px] group transition-transform duration-300 hover:scale-[1.02]">
              <Image
                src={ImageUtils.getImageUrl(qr_image_key)}
                alt="UPI QR Code"
                width={180}
                height={180}
                className="rounded-lg object-contain"
              />
              <div className="absolute inset-0 border-2 border-blue-600/10 rounded-2xl pointer-events-none group-hover:border-blue-600/30 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {upi_id && (
              <div className="bg-card/40 border border-border/30 rounded-xl p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80">
                    UPI Address ID
                  </p>
                  <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                    {upi_id}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUpi}
                  className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg cursor-pointer shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="bg-card/40 border border-border/30 rounded-xl p-3">
              <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80">
                Paying Amount
              </p>
              <p className="text-xs font-black text-orange-500 mt-0.5">
                ₹{total.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Label
              htmlFor="tx-id"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              UPI Transaction ID <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="tx-id"
                placeholder="Enter 12-digit transaction ID"
                value={upiTransactionId}
                onChange={(e) => setUpiTransactionId(e.target.value)}
                disabled={isPlacingOrder}
                className="h-11 bg-card/40 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 placeholder:text-muted-foreground/40 font-semibold uppercase tracking-wider pr-10"
              />
              {isUpiValid && (
                <div className="absolute right-3.5 top-3 text-emerald-500 animate-in fade-in zoom-in-50 duration-300">
                  <CheckCircle2 className="h-5 w-5 fill-emerald-500/10 stroke-[2.5]" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/80 font-medium">
              Transaction reference IDs are alphanumeric and typically 12+
              characters long.
            </p>
          </div>
        </div>
      )}

      <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground/80 bg-muted/5 p-3 rounded-xl border border-border/10">
        <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
        <span>Secured & encrypted with Campus Connect Protocol</span>
      </div>

      <div className="pt-2">{masterActionButton}</div>
    </div>
  );
}
