"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormState } from "@/types";
import { SerializedProduct } from "@/types/product.types";
import { ProductActionFormData, productActionSchema } from "@/validations";

import {
  useImageUpload,
  useShopProductsCreate,
  useShopProductsUpdate,
} from "./tanstack";

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

  const { mutateAsync: uploadImage, isPending: isUploadingImage } =
    useImageUpload();

  const form = useForm<ProductActionFormData>({
    resolver: zodResolver(productActionSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      imageKey: product.imageKey,
      discount: product.discount || 0,
      category: product.category?.name || "",
      image: undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending || isUploadingImage,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      try {
        let finalImageKey: string = product.imageKey;

        if (data.image instanceof File) {
          finalImageKey = await uploadImage(data.image);
        }

        const processedData = { ...data, imageKey: finalImageKey };

        updateProduct(processedData, {
          onSuccess: (result) => {
            if (result.success) {
              setIsDialogOpen(false);
              form.reset({
                ...processedData,
                imageKey: finalImageKey,
              });
            }
          },
        });
      } catch {
        // TODO: Loggind
        form.setError("image", {
          type: "manual",
          message: "Image upload failed. Please try again.",
        });
      }
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
      imageKey: undefined,
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
      try {
        await createProduct(data);
      } catch {
        // TODO: Loggind
        form.setError("imageKey", {
          type: "manual",
          message: "Image upload failed. Please try again.",
        });
      }
    }),
  };

  return {
    form,
    state,
    handlers,
  };
}
