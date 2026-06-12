import { Upload } from "lucide-react";
import React from "react";

import { BulkProductDialog } from "@/components/owned-shop/bulk-product-dialog";
import { Separator } from "@/components/ui/separator";

interface BulkImportTabProps {
  onSuccess: () => void;
}

export function BulkImportTab({ onSuccess }: BulkImportTabProps) {
  return (
    <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-border/30 shadow-xl overflow-hidden relative max-w-4xl">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 to-orange-500" />
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Bulk Import Products
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              Upload a CSV file with your product data to add multiple items at
              once.
            </p>
          </div>
        </div>

        <Separator className="bg-border/40" />

        <div className="space-y-6">
          <div className="text-center py-10 px-4 border-2 border-dashed rounded-2xl border-border/60 hover:border-orange-500/50 bg-muted/15 transition-all duration-300">
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
            <h3 className="text-base font-bold mb-1.5 text-foreground">
              Import Products from CSV
            </h3>
            <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto leading-relaxed font-medium">
              Upload a CSV file containing your product information. You can use
              our official template to match columns.
            </p>
            <div className="flex justify-center">
              <BulkProductDialog onSuccess={onSuccess} />
            </div>
          </div>

          <div className="bg-blue-500/[0.02] border border-blue-500/10 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              CSV Columns & Format Guide
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-card/40 border border-border/20 p-3 rounded-xl">
                <span className="font-bold text-foreground">
                  Required Headers
                </span>
                <ul className="text-muted-foreground space-y-1 mt-1 leading-relaxed font-medium">
                  <li>
                    • <strong className="text-foreground">name</strong>: The
                    product display title (string)
                  </li>
                  <li>
                    • <strong className="text-foreground">price</strong>: Base
                    pricing in Rupees (numeric)
                  </li>
                </ul>
              </div>
              <div className="space-y-1 bg-card/40 border border-border/20 p-3 rounded-xl">
                <span className="font-bold text-foreground">
                  Optional Headers
                </span>
                <ul className="text-muted-foreground space-y-1 mt-1 leading-relaxed font-medium">
                  <li>
                    • <strong className="text-foreground">description</strong>:
                    Text details / ingredients
                  </li>
                  <li>
                    •{" "}
                    <strong className="text-foreground">stock_quantity</strong>:
                    Initial stock (integer)
                  </li>
                  <li>
                    • <strong className="text-foreground">discount</strong>:
                    Promo off percentage (0-100)
                  </li>
                  <li>
                    • <strong className="text-foreground">category</strong>:
                    Menu category tag
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
