"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useSendBroadcast } from "@/hooks/queries/useBroadcast";
import { NotificationCategory, NotificationType } from "@/types/prisma.types";
import { BroadcastFormData, broadcastFormSchema } from "@/validations";

export function useBroadcastForm() {
  const form = useForm<BroadcastFormData>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      title: "",
      message: "",
      type: NotificationType.INFO,
      category: NotificationCategory.ANNOUNCEMENT,
      action_url: "",
    },
  });

  const mutation = useSendBroadcast();

  const onSubmit = form.handleSubmit(async (data) => {
    await mutation.mutateAsync(data);
    form.reset();
  });

  return {
    form,
    onSubmit,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
}
