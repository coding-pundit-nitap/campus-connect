import { Image as ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SharedFileInputProps {
  value?: string | File;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  previewClassName?: string;
  showPreview?: boolean;
  multiple?: boolean;
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
  multiple = false,
}: SharedFileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPreviewUrl = () => {
    if (!value) return null;
    if (typeof value === "string") return value;
    return URL.createObjectURL(value);
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    if (accept && !file.type.match(accept.replace("*", ".*"))) {
      setError(`File type not supported. Please select a valid file.`);
      return;
    }

    onChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const previewUrl = getPreviewUrl();

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          {
            "border-primary bg-primary/5": dragActive,
            "border-gray-300 hover:border-gray-400": !dragActive && !disabled,
            "border-gray-200 cursor-not-allowed opacity-50": disabled,
          }
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

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
                unoptimized={value instanceof File}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
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
