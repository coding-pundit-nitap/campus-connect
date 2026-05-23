"use client";

import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { VendorDashboardResponse } from "@/services";

import { CancelConsoleDialog } from "./fulfillment/cancel-dialog";
import { DeliveryPhase } from "./fulfillment/delivery-phase";
import { OpenPhase } from "./fulfillment/open-phase";
import { PrepPhase } from "./fulfillment/prep-phase";
import { TouchKeypad } from "./fulfillment/touch-keypad";
import { UnlockConsoleDialog } from "./fulfillment/unlock-dialog";
import { useFulfillmentLogic } from "./fulfillment/use-fulfillment-logic";

interface ActiveFulfillmentConsoleProps {
  active: {
    type: "batch" | "direct";
    id: string;
  };
  data: VendorDashboardResponse | undefined;
  onBack: () => void;
}

export function ActiveFulfillmentConsole({
  active,
  data,
  onBack,
}: ActiveFulfillmentConsoleProps) {
  const logic = useFulfillmentLogic({ active, data, onBack });

  const {
    isBatch,
    currentBatch,
    currentDirectOrder,
    lockBatch,
    checkedItems,
    items,
    totalItemsCount,
    checkedItemsCount,
    allItemsPacked,
    prepProgress,
    handleToggleItem,
    currentBlockIdx,
    setCurrentBlockIdx,
    activeOtpOrderId,
    setActiveOtpOrderId,
    otpValues,
    setOtpValues,
    ordersList,
    isOrderDone,
    groupedByBlock,
    sortedBlocks,
    currentBlock,
    currentBlockOrders,
    completedCount,
    totalCount,
    deliveryProgress,
    handleOpenOtpKeypad,
    handleVerifyOtp,
    handleStartDelivery,
    handleCompleteDelivery,
    verifyOtp,
    verifyDirectOtp,
    startDelivery,
    startDirectDelivery,
    completeBatch,
  } = logic;

  if (isBatch && !currentBatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">
          Loading...
        </p>
      </div>
    );
  }
  if (!isBatch && !currentDirectOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">
          Loading...
        </p>
      </div>
    );
  }

  const batchStatus = isBatch
    ? currentBatch!.status
    : currentDirectOrder!.status;
  const isBatchOpen = isBatch && batchStatus === "OPEN";
  const isBatchPrep = isBatch
    ? batchStatus === "LOCKED" || batchStatus === "PENDING"
    : batchStatus === "NEW";
  const isBatchDelivery = isBatch
    ? batchStatus === "IN_TRANSIT"
    : batchStatus === "OUT_FOR_DELIVERY";

  const cancelBtn = (
    <CancelConsoleDialog
      batchId={isBatch ? currentBatch!.id : currentDirectOrder!.id}
      orderCount={isBatch ? ordersList.length : 1}
      onCloseConsole={onBack}
    />
  );

  const unlockBtn = isBatch ? (
    <UnlockConsoleDialog batchId={currentBatch!.id} />
  ) : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-98 duration-200">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/60 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
            aria-label="Back to Overview"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base leading-none tracking-tight">
                {isBatch ? `Batch Delivery` : `Direct Delivery`}
              </span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] py-0 px-1.5 h-fit select-none"
              >
                #
                {isBatch
                  ? currentBatch!.id.slice(-4).toUpperCase()
                  : currentDirectOrder!.display_id}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider">
              {isBatch
                ? `${ordersList.length} orders`
                : `Room ${currentDirectOrder!.delivery_address?.room_number}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-base font-extrabold text-green-600 dark:text-green-500 leading-none">
              ₹
              {isBatch
                ? currentBatch!.total_earnings.toFixed(0)
                : currentDirectOrder!.total_earnings.toFixed(0)}
            </span>
            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5 block">
              Total
            </span>
          </div>

          <Badge
            className={cn(
              "text-white shadow-sm border-transparent py-0.5 px-2.5 rounded-lg text-xs font-semibold select-none",
              isBatchOpen
                ? "bg-emerald-500 hover:bg-emerald-500"
                : isBatchPrep
                  ? "bg-amber-500 hover:bg-amber-500"
                  : "bg-blue-500 hover:bg-blue-500"
            )}
          >
            {isBatchOpen ? "Open" : isBatchPrep ? "Packing" : "On the way"}
          </Badge>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-6 pb-28">
        {isBatch && isBatchOpen && (
          <OpenPhase
            items={items}
            ordersList={ordersList}
            onLockBatch={() => lockBatch.mutate(currentBatch!.id)}
            isLockPending={lockBatch.isPending}
            cancelBtn={cancelBtn}
          />
        )}

        {isBatchPrep && (
          <PrepPhase
            isBatch={isBatch}
            items={items}
            currentDirectOrder={currentDirectOrder}
            checkedItems={checkedItems}
            onToggleItem={handleToggleItem}
            checkedItemsCount={checkedItemsCount}
            totalItemsCount={totalItemsCount}
            prepProgress={prepProgress}
            allItemsPacked={allItemsPacked}
            onStartDelivery={handleStartDelivery}
            isDeliveryPending={
              isBatch ? startDelivery.isPending : startDirectDelivery.isPending
            }
            cancelBtn={cancelBtn}
            unlockBtn={unlockBtn}
          />
        )}

        {isBatchDelivery && (
          <DeliveryPhase
            isBatch={isBatch}
            currentDirectOrder={currentDirectOrder}
            ordersList={ordersList}
            groupedByBlock={groupedByBlock}
            sortedBlocks={sortedBlocks}
            currentBlock={currentBlock}
            currentBlockOrders={currentBlockOrders}
            currentBlockIdx={currentBlockIdx}
            setCurrentBlockIdx={setCurrentBlockIdx}
            completedCount={completedCount}
            totalCount={totalCount}
            deliveryProgress={deliveryProgress}
            isOrderDone={isOrderDone}
            onOpenOtpKeypad={handleOpenOtpKeypad}
            onCompleteDelivery={handleCompleteDelivery}
            isCompletePending={completeBatch.isPending}
            cancelBtn={cancelBtn}
            onBack={onBack}
          />
        )}
      </main>

      {activeOtpOrderId && (
        <TouchKeypad
          value={otpValues[activeOtpOrderId] || ""}
          onChange={(val) =>
            setOtpValues((prev) => ({
              ...prev,
              [activeOtpOrderId]: val,
            }))
          }
          onClose={() => setActiveOtpOrderId(null)}
          onSubmit={(otpVal) => handleVerifyOtp(activeOtpOrderId, otpVal)}
          isPending={isBatch ? verifyOtp.isPending : verifyDirectOtp.isPending}
          orderRoom={
            isBatch
              ? `Room ${
                  ordersList.find((o) => o.id === activeOtpOrderId)
                    ?.delivery_address?.room_number || ""
                }`
              : `Room ${currentDirectOrder!.delivery_address?.room_number}`
          }
        />
      )}
    </div>
  );
}
