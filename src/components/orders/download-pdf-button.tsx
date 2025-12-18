"use client";

import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDownloadOrderPDF } from "@/hooks/queries/useOrders";

type Props = {
  order_id: string;
  display_id: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
};

export function DownloadPDFButton({
  order_id,
  display_id,
  variant = "outline",
  size = "sm",
}: Props) {
  const { mutate: downloadPDF, isPending } = useDownloadOrderPDF();

  const handleDownload = () => {
    downloadPDF({ order_id, display_id });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {size !== "icon" && "Download PDF"}
    </Button>
  );
}
