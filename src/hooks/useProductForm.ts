"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormState } from "@/types";
import { SerializedProduct } from "@/types/product.types";
import { ProductFormData, productSchema } from "@/validations";

import {
  useImageDelete,
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
  const { mutate: deleteImage } = useImageDelete();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      imageKey: product.imageKey,
      discount: product.discount || 0,
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
        const oldImageKey = product.imageKey;

        if (data.imageKey instanceof File) {
          finalImageKey = await uploadImage(data.imageKey);
        } else {
          // If it's not a new file, it must be the existing string key.
          finalImageKey = data.imageKey;
        }

        const processedData = { ...data, imageKey: finalImageKey };

        updateProduct(processedData, {
          onSuccess: (result) => {
            if (result.success) {
              if (oldImageKey && oldImageKey !== finalImageKey) {
                deleteImage(oldImageKey);
              }
              setIsDialogOpen(false);
              form.reset(processedData);
            }
          },
        });
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        form.setError("imageKey", {
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
  const { mutate: createProduct, isPending, error } = useShopProductsCreate();
  const { mutateAsync: uploadImage, isPending: isUploadingImage } =
    useImageUpload();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      imageKey: undefined,
      discount: 0,
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
        if (!(data.imageKey instanceof File)) {
          form.setError("imageKey", {
            message: "An image is required to create a product.",
          });
          return; // Stop the submission
        }
        const finalImageKey = await uploadImage(data.imageKey);
        const processedData = { ...data, imageKey: finalImageKey };

        createProduct(processedData, {
          onSuccess: (result) => {
            if (result.success) {
              form.reset();
            }
          },
        });
      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
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
