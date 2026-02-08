"use client";

import { DollarSign, Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  getPlatformSettingsAction,
  updatePlatformFeeAction,
} from "@/actions/admin/settings-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlatformFeeCardProps {
  initialFee: number;
}

export function PlatformFeeCard({ initialFee }: PlatformFeeCardProps) {
  const [fee, setFee] = useState(initialFee.toString());
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const feeValue = parseFloat(fee);
    if (isNaN(feeValue) || feeValue < 0) {
      toast.error("Please enter a valid non-negative number");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePlatformFeeAction(feeValue);
        if (result.success) {
          toast.success("Platform fee updated successfully");
          const refreshResult = await getPlatformSettingsAction();
          if (refreshResult.success && refreshResult.data) {
            setFee(refreshResult.data.platform_fee.toString());
          }
        } else {
          toast.error(result.details || "Failed to update platform fee");
        }
      } catch {
        toast.error("Failed to update platform fee");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          Global Platform Fee
        </CardTitle>
        <CardDescription>
          Configure the platform fee applied to all orders. This is a global
          setting that applies uniformly across all shops.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="platform-fee">Platform Fee (₹)</Label>
          <div className="flex gap-2">
            <Input
              id="platform-fee"
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="Enter platform fee"
              className="max-w-[200px]"
              disabled={isPending}
            />
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This fee will be deducted from vendor earnings on each order.
          </p>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Current platform fee:</span> ₹
            {parseFloat(fee || "0").toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
