"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { useVendorEarnings } from "@/hooks/queries/useVendorEarnings";
import type { EarningsPeriod } from "@/lib/utils/earnings";

import { CashOnlineSplit } from "./cash-online-split";
import { EarningsBreakdown } from "./earnings-breakdown";
import { EarningsHero } from "./earnings-hero";

export default function EarningsPage() {
  const [period, setPeriod] = useState<EarningsPeriod>("today");
  const { data, isLoading, isError, error } = useVendorEarnings(period);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-24 md:p-6">
      <div className="border-b border-border/20 pb-4">
        <h1 className="font-heading text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Earnings
        </h1>
        <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">
          What you&apos;ve earned, how much is cash in hand, and every past
          order.
        </p>
      </div>

      {isError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-bold text-destructive">
              Couldn&apos;t load your earnings
            </p>
            <p className="text-xs text-muted-foreground">
              {error?.message || "Please try refreshing the page."}
            </p>
          </div>
        </div>
      )}

      <EarningsHero
        amount={data?.vendorEarnings ?? 0}
        orderCount={data?.orderCount ?? 0}
        period={period}
        onPeriodChange={setPeriod}
        isLoading={isLoading}
        isError={isError}
      />

      {data && !isLoading && (
        <>
          <EarningsBreakdown data={data} />
          <CashOnlineSplit data={data} />
        </>
      )}
    </main>
  );
}
