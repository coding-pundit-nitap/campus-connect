"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { fileUploadAPIService } from "@/services/api";

export const useImageUpload = () => {
  return useMutation({
    mutationFn: (file: File) => fileUploadAPIService.uploadImage(file),
    onSuccess: () => {
      toast.success("Image uploaded successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload image.");
    },
  });
};

export const useImageDelete = () => {
  return useMutation({
    mutationFn: (image_key: string) =>
      fileUploadAPIService.deleteImage(image_key),
    onError: () => {
      toast.error("Could not delete the old image from storage.");
    },
  });
};
