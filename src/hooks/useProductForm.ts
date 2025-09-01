import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@prisma/client";
import { useForm } from "react-hook-form";

import { FormState } from "@/types";
import { ProductFormData, productSchema } from "@/validations";

import { useShopProductsUpdate } from "./tanstack";

type Props = {
  product: Product;
};

export default function useProductForm({ product }: Props) {
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
