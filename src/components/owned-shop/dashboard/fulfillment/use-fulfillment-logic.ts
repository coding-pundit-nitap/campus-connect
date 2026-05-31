import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useStartIndividualDelivery, useVerifyIndividualOtp } from "@/hooks";
import {
  useCompleteBatch,
  useLockBatch,
  useStartDelivery,
  useVerifyOtp,
} from "@/hooks/queries/useBatch";
import { VendorDashboardResponse } from "@/services";
import { BatchInfo } from "@/services/batch";

interface UseFulfillmentLogicProps {
  active: {
    type: "batch" | "direct";
    id: string;
  };
  data: VendorDashboardResponse | undefined;
  onBack: () => void;
}

export function useFulfillmentLogic({
  active,
  data,
  onBack,
}: UseFulfillmentLogicProps) {
  const isBatch = active.type === "batch";

  const currentBatch = useMemo(() => {
    if (!isBatch || !data) return null;
    const { open_batch, active_batches = [] } = data;
    return [...(open_batch ? [open_batch] : []), ...active_batches].find(
      (b) => b.id === active.id
    );
  }, [isBatch, data, active.id]);

  const currentDirectOrder = useMemo(() => {
    if (isBatch || !data) return null;
    const { direct_orders = [] } = data;
    return direct_orders.find((o) => o.id === active.id);
  }, [isBatch, data, active.id]);

  const lockBatch = useLockBatch();
  const startDelivery = useStartDelivery();
  const completeBatch = useCompleteBatch();
  const verifyOtp = useVerifyOtp();

  const startDirectDelivery = useStartIndividualDelivery();
  const verifyDirectOtp = useVerifyIndividualOtp();

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const items = isBatch ? currentBatch?.item_summary || [] : [];

  const totalItemsCount = items.length;
  const checkedItemsCount = Object.values(checkedItems).filter(Boolean).length;
  const allItemsPacked =
    totalItemsCount === 0 || checkedItemsCount === totalItemsCount;
  const prepProgress =
    totalItemsCount > 0 ? (checkedItemsCount / totalItemsCount) * 100 : 0;

  const handleToggleItem = (productId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [activeOtpOrderId, setActiveOtpOrderId] = useState<string | null>(null);
  const [otpValues, setOtpValues] = useState<Record<string, string>>({});
  const [locallyVerified, setLocallyVerified] = useState<Set<string>>(
    new Set()
  );

  const ordersList = useMemo(
    () => currentBatch?.orders || [],
    [currentBatch?.orders]
  );
  const isOrderDone = useMemo(
    () => (orderId: string, status: string) =>
      status === "COMPLETED" || locallyVerified.has(orderId),
    [locallyVerified]
  );

  const groupedByBlock = useMemo(() => {
    type BatchOrders = NonNullable<BatchInfo["orders"]>;
    return (ordersList || []).reduce(
      (acc, order) => {
        const building = order.delivery_address?.building || "Other Hostel";
        const block = order.delivery_address?.hostel_block;
        const key = block ? `${building} - Block ${block}` : building;
        if (!acc[key]) acc[key] = [];
        acc[key].push(order);
        return acc;
      },
      {} as Record<string, BatchOrders>
    );
  }, [ordersList]);

  const sortedBlocks = useMemo(
    () => Object.keys(groupedByBlock).sort(),
    [groupedByBlock]
  );
  const currentBlock = sortedBlocks[currentBlockIdx];
  const currentBlockOrders = groupedByBlock[currentBlock] || [];

  const completedCount = useMemo(() => {
    return ordersList.filter((o) => isOrderDone(o.id, o.status)).length;
  }, [ordersList, isOrderDone]);

  const totalCount = ordersList.length;
  const deliveryProgress =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleOpenOtpKeypad = (orderId: string) => {
    setActiveOtpOrderId(orderId);
    setOtpValues((prev) => ({ ...prev, [orderId]: "" }));
  };

  const handleVerifyOtp = (orderId: string, directOtp?: string) => {
    const otp = directOtp || otpValues[orderId] || "";
    if (otp.length !== 4) return;

    if (isBatch) {
      verifyOtp.mutate(
        { orderId, otp },
        {
          onSuccess: () => {
            setLocallyVerified((prev) => {
              const next = new Set(prev).add(orderId);
              const allCurrentBlockDone = currentBlockOrders.every(
                (o) =>
                  o.id === orderId || o.status === "COMPLETED" || next.has(o.id)
              );

              if (
                allCurrentBlockDone &&
                currentBlockIdx < sortedBlocks.length - 1
              ) {
                setTimeout(() => {
                  setCurrentBlockIdx((idx) => idx + 1);
                }, 800);
              }
              return next;
            });
            setActiveOtpOrderId(null);
            toast.success("OTP successfully verified.");
          },
        }
      );
    } else {
      verifyDirectOtp.mutate(
        { orderId, otp },
        {
          onSuccess: () => {
            setLocallyVerified((prev) => new Set(prev).add(orderId));
            setActiveOtpOrderId(null);
            toast.success("OTP successfully verified.");
          },
        }
      );
    }
  };

  const handleStartDelivery = () => {
    if (isBatch) {
      startDelivery.mutate(currentBatch!.id);
    } else {
      startDirectDelivery.mutate(currentDirectOrder!.id);
    }
  };

  const handleCompleteDelivery = () => {
    if (!window.confirm("Mark this batch as complete? This cannot be undone."))
      return;
    completeBatch.mutate(currentBatch!.id, {
      onSuccess: () => {
        toast.success("Batch completed! Earnings credited.");
        onBack();
      },
    });
  };

  return {
    isBatch,
    currentBatch,
    currentDirectOrder,
    lockBatch,
    startDelivery,
    completeBatch,
    verifyOtp,
    startDirectDelivery,
    verifyDirectOtp,
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
  };
}
