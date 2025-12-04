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
} from "../queries";

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
      image_key: product.image_key,
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
        let finalimage_key: string = product.image_key;

        if (data.image instanceof File) {
          finalimage_key = await uploadImage(data.image);
        }

        const processedData = { ...data, image_key: finalimage_key };

        updateProduct(processedData, {
          onSuccess: (result) => {
            if (result.success) {
              setIsDialogOpen(false);
              form.reset({
                ...processedData,
                image_key: finalimage_key,
              });
            }
          },
        });
      } catch {
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
      try {
        await createProduct(data);
      } catch {
        form.setError("image_key", {
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
