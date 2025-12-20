"use client";

import { ArrowLeft, Package, Save, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BulkProductDialog } from "@/components/owned-shop/bulk-product-dialog";
import { SharedForm } from "@/components/shared/shared-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategorySearch, useCreateProductForm } from "@/hooks";
import { productUIServices } from "@/lib/utils";
import { ButtonConfig } from "@/types";

export default function CreateProductPage() {
  const router = useRouter();
  const { form, state, handlers } = useCreateProductForm();
  const { suggestions, isLoadingSuggestions, onSearchQuery } =
    useCategorySearch();

  const submitButton: ButtonConfig = {
    text:
      state.isLoading || state.isSubmitting ? "Creating..." : "Create Product",
    type: "submit",
    variant: "default",
    loading: state.isLoading || state.isSubmitting,
    disabled: state.isLoading || state.isSubmitting,
  };

  const baseFields = productUIServices.createProductFormFields();
  const fields = baseFields.map((field) => {
    if (field.name === "category") {
      return {
        ...field,
        suggestions,
        isLoadingSuggestions,
        onSearchQuery,
      };
    }
    return field;
  });

  const handleFormSuccess = () => {
    router.push("/owner-shops/products");
  };

  return (
    <div className="flex items-center justify-center">
      <div className="container max-w-4xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/owner-shops/products">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Add New Product
                </h1>
                <p className="text-muted-foreground">
                  Create a new product for your shop
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <Package className="h-4 w-4" />
              Single Product
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Product Details
                </CardTitle>
                <CardDescription>
                  Fill in the information below to create your product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SharedForm
                  form={form}
                  submitButton={{
                    ...submitButton,
                    text: (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {state.isLoading || state.isSubmitting
                          ? "Creating..."
                          : "Create Product"}
                      </span>
                    ) as unknown as string,
                  }}
                  onSubmit={(e) => {
                    handlers.onSubmit(e)?.then(() => handleFormSuccess());
                  }}
                  fields={fields}
                  error={state.error}
                  className="space-y-6"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Bulk Import
                </CardTitle>
                <CardDescription>
                  Import multiple products at once using a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      Import Products from CSV
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      Upload a CSV file with your product data. You can download
                      a template to get started.
                    </p>
                    <BulkProductDialog onSuccess={() => handleFormSuccess()} />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      CSV Format Requirements
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Required columns:</strong> name, price
                      </li>
                      <li>
                        • <strong>Optional columns:</strong> description,
                        stock_quantity, discount, category
                      </li>
                      <li>• Maximum 50 products per import</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
