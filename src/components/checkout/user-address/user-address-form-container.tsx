"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateAddress } from "@/hooks/tanstack/useAddress";
import {
  AddressFormData,
  addressSchema,
} from "@/validations/user-address-schema";

import { UserAddressForm } from "./user-address-form";

interface UserAddressFormContainerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserAddressFormContainer({
  onSuccess,
  onCancel,
}: UserAddressFormContainerProps) {
  const { mutateAsync: createMutation, isPending } = useCreateAddress();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      building: "",
      room_number: "",
      notes: "",
      is_default: false,
    },
  });

  const onSubmit = async (data: AddressFormData) => {
    try {
      await createMutation(data);
      form.reset();
      onSuccess?.();
    } catch {
      toast.error("Error creating address");
    }
  };

  return (
    <UserAddressForm
      form={form}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSubmitting={isPending}
    />
  );
}
