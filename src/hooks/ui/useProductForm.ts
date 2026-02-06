"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormState } from "@/types";
import { SerializedProduct } from "@/types/product.types";
import {
  ProductActionFormData,
  productActionSchema,
  ProductUpdateActionFormData,
  productUpdateActionSchema,
} from "@/validations";

import { useShopProductsCreate, useShopProductsUpdate } from "../queries";

type Props = {
  product: SerializedProduct;
};

export function useUpdateProductForm({ product }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    mutate: updateProduct,
    isPending,
    error,
  } = useShopProductsUpdate(product.id);

  const form = useForm<ProductUpdateActionFormData>({
    resolver: zodResolver(productUpdateActionSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_key: product.image_key,
      discount: product.discount || 0,
      category: product.category?.name || "",
      image: undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      updateProduct(data, {
        onSuccess: (result) => {
          if (result.success) {
            setIsDialogOpen(false);
            form.reset({
              ...data,
              image_key: result.data?.image_key || data.image_key,
              image: undefined,
            });
          }
        },
      });
    }),
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
  };

  return {
    form,
    state,
    handlers,
    isDialogOpen,
    setIsDialogOpen,
  };
}

export function useCreateProductForm() {
  const {
    mutateAsync: createProduct,
    isPending,
    error,
  } = useShopProductsCreate();

  const form = useForm<ProductActionFormData>({
    resolver: zodResolver(productActionSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      image_key: undefined,
      discount: 0,
      category: "",
      image: undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      await createProduct(data);
    }),
  };

  return {
    form,
    state,
    handlers,
  };
}
