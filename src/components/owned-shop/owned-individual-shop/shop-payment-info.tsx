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
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground mb-1">UPI ID</p>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-background px-2 py-1 rounded truncate">
            {upiId}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {qrImageUrl && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <QrCode className="h-4 w-4" />
              View QR
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Payment QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              <div className="relative w-64 h-64 bg-white rounded-lg p-2">
                <Image
                  src={qrImageUrl}
                  alt="Payment QR Code"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Scan to pay via UPI: <strong>{upiId}</strong>
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
