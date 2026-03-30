"use client";

import { Check, Copy, QrCode } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUtils } from "@/lib/utils/image.utils";

interface ShopPaymentInfoProps {
  upiId: string;
  qrImageKey: string;
}

export function ShopPaymentInfo({ upiId, qrImageKey }: ShopPaymentInfoProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy UPI ID to clipboard.");
    }
  };

  const qrImageUrl = qrImageKey ? ImageUtils.getImageUrl(qrImageKey) : null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-background shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col min-w-0 w-full sm:w-auto">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          UPI ID
        </p>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-medium bg-muted/40 px-2.5 py-1 rounded-md border border-border/50 truncate max-w-[200px] sm:max-w-[300px]">
            {upiId || "Not configured"}
          </code>
          {upiId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={copyToClipboard}
              aria-label="Copy UPI ID"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {qrImageUrl && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto shadow-sm"
            >
              <QrCode className="mr-2 h-4 w-4" />
              View QR
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Payment QR Code</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-xl border border-dashed my-2">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-white rounded-xl shadow-sm border overflow-hidden p-2">
                <Image
                  src={qrImageUrl}
                  alt="Payment QR Code"
                  fill
                  className="object-contain p-2"
                />
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Scan to pay via UPI: <br />
              <strong className="text-foreground font-mono mt-1 inline-block">
                {upiId}
              </strong>
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
