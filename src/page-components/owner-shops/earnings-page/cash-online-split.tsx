"use client";

import { Banknote, Smartphone } from "lucide-react";

import { formatCurrency } from "@/lib/utils/currency";
import type { VendorEarningsResponse } from "@/services/vendor/vendor-api.service";

export function CashOnlineSplit({ data }: { data: VendorEarningsResponse }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border/30 bg-card/45 p-5 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-emerald-600" />
          <h3 className="font-heading text-sm font-black text-foreground">
            Cash — you&apos;re holding this
          </h3>
        </div>
        <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
          {formatCurrency(data.cash.earnings)}
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {data.cash.orderCount}{" "}
          {data.cash.orderCount === 1 ? "order" : "orders"}
        </p>
        {data.cash.platformFeeOwed > 0 && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold leading-relaxed text-amber-700 dark:text-amber-400">
            Includes {formatCurrency(data.cash.platformFeeOwed)} platform fee you
            collected and owe back.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border/30 bg-card/45 p-5 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <h3 className="font-heading text-sm font-black text-foreground">
            Online — paid to the platform
          </h3>
        </div>
        <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
          {formatCurrency(data.online.earnings)}
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {data.online.orderCount}{" "}
          {data.online.orderCount === 1 ? "order" : "orders"}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Settled to you manually. Contact admin about payments.
        </p>
      </div>
    </section>
  );
}
