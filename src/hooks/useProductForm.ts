import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@prisma/client";
import { useForm } from "react-hook-form";

import { FormState } from "@/types";
import { ProductFormData, productSchema } from "@/validations";

import { useShopProductsCreate, useShopProductsUpdate } from "./tanstack";

type Props = {
  product: Product;
};

export function useUpdateProductForm({ product }: Props) {
  const {
    mutate: updateProduct,
    isPending,
    error,
  } = useShopProductsUpdate(product.id);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || "",
      discount: product.discount || 0,
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      const uploadedImageUrl = product.image_url || "";
      if (data.image_url instanceof File) {
        // TODO: Upload Image
        console.log("File selected:", data.image_url.name);
      }
      const processedData = { ...data, image_url: uploadedImageUrl };

      updateProduct(processedData);
    }),
  };

  return {
    form,
    state,
    handlers,
  };
}

export function useCreateProductForm() {
  const { mutate: createProduct } = useShopProductsCreate();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      image_url: "",
      discount: 0,
    },
  });

  const state: FormState = {
    isLoading: false,
    error: null,
    isSubmitting: form.formState.isSubmitting,
  };

  // TODO: Implement image upload logic
  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      const uploadedImageUrl =
        data.image_url instanceof File ? "" : data.image_url;

      const processedData = { ...data, image_url: uploadedImageUrl };

      createProduct(processedData);
    }),
  };

  return {
    form,
    state,
    handlers,
  };
}
