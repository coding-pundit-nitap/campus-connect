"use client";
import { Image as ImageIcon, Upload } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface SharedFileInputProps {
  value?: string | File;
  onChange: (file: File | null) => void;
  accept?: string;
  /** in MB */
  maxSize?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  previewClassName?: string;
  showPreview?: boolean;
  previewUrl?: string;
}

export function SharedFileInput({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5,
  placeholder = "Click to upload or drag and drop",
  disabled = false,
  className = "",
  previewClassName = "",
  showPreview = true,
  previewUrl: initialPreviewUrl,
}: SharedFileInputProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null);

      if (fileRejections.length > 0) {
        const firstRejection = fileRejections[0];
        const firstError = firstRejection.errors[0];
        if (firstError.code === "file-too-large") {
          setError(`File is too large. Max size is ${maxSize}MB.`);
        } else if (firstError.code === "file-invalid-type") {
          setError("File type not supported.");
        } else {
          setError(firstError.message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onChange(acceptedFiles[0]);
      }
    },
    [onChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
    disabled,
  });

  const getPreviewUrl = () => {
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    if (typeof value === "string") {
      return value;
    }
    return initialPreviewUrl || null;
  };

  const previewUrl = getPreviewUrl();

  useEffect(() => {
    return () => {
      if (previewUrl && typeof value === "object") {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, value]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          {
            "border-primary bg-primary/5": isDragActive,
            "border-gray-300 hover:border-gray-400": !isDragActive && !disabled,
            "border-gray-200 cursor-not-allowed opacity-50": disabled,
          }
        )}
      >
        <input {...getInputProps()} />
        {previewUrl && showPreview ? (
          <div className="relative">
            <div
              className={cn(
                "relative w-full h-32 rounded-md overflow-hidden",
                previewClassName
              )}
            >
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {accept.includes("image") ? (
                <ImageIcon className="h-12 w-12 text-gray-400" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{placeholder}</p>
            <p className="text-xs text-gray-400">Max file size: {maxSize}MB</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {value && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {typeof value === "string" ? "Current image" : value.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
