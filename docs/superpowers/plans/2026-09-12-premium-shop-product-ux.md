# Premium Shop & Product UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the shop-creation wizard and the product add/edit flow one refined premium visual language, make both work well on phone, and make adding/editing products fast enough for a shopkeeper to build a full menu without friction.

**Architecture:** Introduce one shared design-token module consumed by both flows (replacing the current blue/violet split with a single indigo accent). Replace the page-per-product create flow and the generic dialog-based edit flow with one shared Sheet-based "product drawer" component used in both create and edit mode, supporting progressive field disclosure and a "save & add another" loop for rapid entry. Add a lightweight partial-update server action so the product card can quick-edit price inline without opening the drawer.

**Tech Stack:** Next.js (App Router), React Hook Form + Zod, TanStack Query, shadcn/ui (`Sheet`, `Accordion`, `Form`), Tailwind, Vitest (integration tests under `tests/integration`).

**Spec:** `docs/superpowers/specs/2026-09-12-premium-shop-product-ux-design.md`

## Global Constraints

- Single accent color across both flows: **indigo-600** (replaces `blue-600` in the shop form and `violet-600`/gradient treatments in the product flow). The amber "live" indicator dot stays amber everywhere — it is a status color, not the accent.
- Container radius standard: `rounded-2xl`. Shadows: soft single-layer only — no stacked `backdrop-blur` + gradient "glass" panels.
- The product drawer is a shadcn `Sheet`. On mobile it renders full width (`w-full`); this is a deliberate simplification of the spec's "bottom sheet" language — a full-width right-side sheet gives the same single-column, full-height editing surface without adding swipe-gesture complexity. Do not add a separate bottom-sheet implementation.
- Field requiredness must match the existing Zod schemas in `src/validations/product.ts` — **Name, Category, Brand, Price, Image are always-visible required fields; Description, Discount, Stock Quantity go under the collapsible "More details" section** (Stock Quantity defaults to 0, which already matches `useCreateProductForm`'s existing default).
- Breaking changes are approved: the `/owner-shops/products/new` route, `CreateProductPage`, and `ProductEditDialog` are removed entirely in this plan.
- Bulk import (`BulkProductDialog`) stays reachable as a sibling button next to "Add Product" in `ShopAction` rather than being nested inside the new drawer's header — `BulkProductDialog` is already a fully self-contained dialog with its own trigger, so wrapping it inside another drawer would add nesting complexity for no UX benefit. This is a deliberate simplification of the spec's exact wording, same intent (one entry point, both paths visible together).

---

### Task 1: Shared premium design tokens

**Files:**
- Create: `src/components/shared/form-styles.ts`
- Modify: `src/components/create-shop/create-shop-form/styles.ts`

**Interfaces:**
- Produces: `fieldInputClass`, `fieldLabelClass`, `fieldHintClass`, `stepHeadingClass`, `stepSubheadingClass`, `sectionLabelClass`, `cardSurfaceClass`, `primaryButtonClass` (all `string` constants) from `@/components/shared/form-styles` — every later task that styles a form field or a primary button imports from here.

- [ ] **Step 1: Create the shared token module**

```ts
// src/components/shared/form-styles.ts
export const fieldInputClass =
  "h-12 bg-transparent border-border/60 hover:border-border focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 rounded-lg transition-colors placeholder:text-muted-foreground/50 font-medium text-sm";

export const fieldLabelClass = "text-sm font-semibold text-foreground";

export const fieldHintClass = "text-xs text-muted-foreground";

export const stepHeadingClass =
  "font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground";

export const stepSubheadingClass = "text-sm text-muted-foreground mt-1.5";

/** Uppercase micro-label style, used for compact form sections (e.g. the product drawer). */
export const sectionLabelClass =
  "text-xs font-bold uppercase tracking-wider text-muted-foreground";

/** Standard premium card surface: soft single-layer shadow, no stacked glass/gradients. */
export const cardSurfaceClass =
  "rounded-2xl border border-border/50 bg-card shadow-sm";

export const primaryButtonClass =
  "rounded-xl border-none bg-indigo-600 font-semibold text-white shadow shadow-indigo-500/10 hover:bg-indigo-700 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none";
```

- [ ] **Step 2: Point the shop-form's existing styles module at the shared one**

Replace the entire contents of `src/components/create-shop/create-shop-form/styles.ts` with:

```ts
export * from "@/components/shared/form-styles";
```

This keeps all 7 existing imports (`hours-location-step.tsx`, `image-step.tsx`, `batch-schedule-step.tsx`, `details-step.tsx`, `payments-step.tsx`, `review-step.tsx`, `pricing-step.tsx`) working unchanged — they already do `import { ... } from "./styles"`.

- [ ] **Step 3: Verify nothing broke**

Run: `npx tsc --noEmit`
Expected: no new errors from `create-shop-form/styles.ts` or its consumers.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/form-styles.ts src/components/create-shop/create-shop-form/styles.ts
git commit -m "feat: extract shared premium form design tokens"
```

---

### Task 2: Recolor the shop-creation form to the indigo accent

**Files:**
- Modify: `src/components/create-shop/create-shop-form/index.tsx`
- Modify: `src/components/create-shop/create-shop-form/step-sidebar.tsx`
- Modify: `src/components/create-shop/create-shop-form/details-step.tsx`
- Modify: `src/components/create-shop/create-shop-form/review-step.tsx`
- Modify: `src/components/create-shop/create-shop-form/shop-preview-card.tsx`
- Modify: any other file under `src/components/create-shop/create-shop-form/` matched below

**Interfaces:**
- Consumes: nothing new — this is a like-for-like color substitution.
- Produces: nothing new — no exported names change.

All accent usage in this directory is currently `blue-*` (confirmed: every `blue-` hit in this directory is an accent color, border, ring, or button — not a semantic "info" color that needs to stay blue). Swap it to `indigo-*` everywhere with a scoped, mechanical replacement.

- [ ] **Step 1: Run the color substitution**

```bash
cd src/components/create-shop/create-shop-form
grep -rl "blue-600\|blue-500\|blue-700" *.tsx | xargs sed -i \
  -e 's/blue-600/indigo-600/g' \
  -e 's/blue-500/indigo-500/g' \
  -e 's/blue-700/indigo-700/g'
cd -
```

- [ ] **Step 2: Confirm no stray blue accents remain**

Run: `grep -rn "blue-" src/components/create-shop/create-shop-form/*.tsx`
Expected: no output.

- [ ] **Step 3: Start the dev server and visually check the wizard**

Run: `npm run dev` (or the project's existing dev script), then open `/owner-shops` shop-creation flow (or wherever `CreateShopForm` is mounted) at both desktop and a 375px-wide viewport.
Expected: all buttons, focus rings, the progress bar, and the "Continue"/"Create shop" buttons are indigo, not blue; the mobile collapsed live-preview toggle still works.

- [ ] **Step 4: Commit**

```bash
git add src/components/create-shop/create-shop-form/*.tsx
git commit -m "feat: recolor shop-creation wizard to the shared indigo accent"
```

---

### Task 3: Backend — partial price update action

**Files:**
- Modify: `src/actions/product/product-actions.ts`
- Modify: `tests/integration/products/product-actions.test.ts`

**Interfaces:**
- Produces: `export async function updateProductPriceAction(productId: string, price: number): Promise<ActionResponse<SerializedProduct>>` from `@/actions/product/product-actions` — Task 8's mutation hook calls this by name.

This mirrors the existing `toggleProductStockAction` (same file, same ownership-check pattern) but updates `price` instead of `stock_quantity`, so the inline quick-edit doesn't have to send/validate the full product schema.

- [ ] **Step 1: Write the failing integration test**

Add to `tests/integration/products/product-actions.test.ts`, inside the top-level `describe("Product Actions", ...)` block, alongside the existing `describe("toggleProductStockAction", ...)` block:

```ts
  describe("updateProductPriceAction", () => {
    it("updates the price for the owner's product", async () => {
      const { owner, products } = await seedShopWithProducts({
        productCount: 1,
      });
      await asUser(owner);

      const res = await updateProductPriceAction(products[0].id, 249);
      expect(res.data?.price).toBe(249);

      const dbProduct = await testPrisma.product.findUnique({
        where: { id: products[0].id },
      });
      expect(Number(dbProduct?.price)).toBe(249);
    });

    it("throws BadRequestError for a negative price", async () => {
      const { owner, products } = await seedShopWithProducts({
        productCount: 1,
      });
      await asUser(owner);

      await expect(
        updateProductPriceAction(products[0].id, -10)
      ).rejects.toThrow(BadRequestError);
    });

    it("throws Forbidden if not the product's shop owner", async () => {
      const { products } = await seedShopWithProducts({ productCount: 1 });

      const otherShop = await createShop();
      const otherOwner = await createUser({ shop_id: otherShop.id });
      await asUser(otherOwner);

      await expect(
        updateProductPriceAction(products[0].id, 100)
      ).rejects.toThrow(ForbiddenError);
    });
  });
```

Also update the two import lines at the top of the test file:

```ts
import {
  bulkCreateProductsAction,
  createProductAction,
  deleteProductAction,
  toggleProductStockAction,
  updateProductAction,
  updateProductPriceAction,
} from "@/actions/product/product-actions";
import { fileUploadService } from "@/di/container";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "@/lib/custom-error";
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/products/product-actions.test.ts`
Expected: FAIL — `updateProductPriceAction` is not exported from `@/actions/product/product-actions`.

- [ ] **Step 3: Implement the action**

Add to `src/actions/product/product-actions.ts`, directly below `toggleProductStockAction`:

```ts
export async function updateProductPriceAction(
  productId: string,
  price: number
): Promise<ActionResponse<SerializedProduct>> {
  try {
    if (!productId || typeof productId !== "string") {
      throw new BadRequestError("Invalid product ID");
    }
    if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
      throw new BadRequestError("Price must be a non-negative number");
    }

    const user_id = await authUtils.getUserId();
    const shop = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!shop || !shop.id) throw new UnauthorizedError("Unauthorized");

    const product = await productRepository.findById(productId);
    if (!product || product.shop_id !== shop.id) {
      throw new ForbiddenError(
        "You do not have permission to modify this product"
      );
    }

    const updated = await productRepository.update(
      productId,
      { price },
      {
        include: {
          category: true,
          brand: true,
          shop: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }
    );

    const serialized = serializeProduct(updated);
    revalidatePath(`/shops/${updated.shop_id}`);

    return createSuccessResponse(serialized, "Price updated successfully.");
  } catch (error) {
    log.error({ err: error }, "UPDATE PRODUCT PRICE ERROR:");
    if (
      error instanceof BadRequestError ||
      error instanceof ForbiddenError ||
      error instanceof UnauthorizedError ||
      error instanceof InternalServerError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update price.");
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/products/product-actions.test.ts`
Expected: PASS, all tests in the file green.

- [ ] **Step 5: Commit**

```bash
git add src/actions/product/product-actions.ts tests/integration/products/product-actions.test.ts
git commit -m "feat: add partial product price update action for inline quick-edit"
```

---

### Task 4: Query hook for the price quick-edit

**Files:**
- Modify: `src/hooks/queries/useShopProducts.ts`

**Interfaces:**
- Consumes: `updateProductPriceAction` from Task 3 (`@/actions`).
- Produces: `export function useUpdateProductPrice()` returning a TanStack `useMutation` result with `mutate({ productId, price })` — Task 8's inline editor calls this.

- [ ] **Step 1: Add the import**

In `src/hooks/queries/useShopProducts.ts`, extend the existing action import:

```ts
import {
  bulkCreateProductsAction,
  createProductAction,
  deleteProductAction,
  toggleProductStockAction,
  updateProductAction,
  updateProductPriceAction,
} from "@/actions";
```

(`src/actions/index.ts` already does `export * from "@/actions/product/product-actions";`, so `updateProductPriceAction` is automatically available from `@/actions` — no barrel change needed.)

- [ ] **Step 2: Add the hook**

Add directly below `useToggleProductStock`:

```ts
export function useUpdateProductPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      price,
    }: {
      productId: string;
      price: number;
    }) => updateProductPriceAction(productId, price),
    onSuccess: (data) => {
      toast.success("Price updated!");
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      if (data.data?.shop_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.byShop(data.data.shop_id),
        });
      }
    },
    onError: () => {
      toast.error("Failed to update price. Please try again.");
    },
  });
}
```

- [ ] **Step 3: Verify the project still type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/queries/useShopProducts.ts
git commit -m "feat: add useUpdateProductPrice mutation hook"
```

---

### Task 5: Product drawer — live preview component

**Files:**
- Create: `src/components/shared/product-drawer/product-drawer-preview.tsx`

**Interfaces:**
- Consumes: `cardSurfaceClass` from `@/components/shared/form-styles` (Task 1).
- Produces: `export function ProductDrawerPreview(props: ProductDrawerPreviewProps)` — Task 6's form component renders this inside the Sheet; props type is exported alongside it for reuse.

This replaces `src/page-components/owner-shops/create-product-page/product-preview-card.tsx` with a version that uses the shared indigo/premium tokens instead of the violet gradient look, and is compact enough to sit inside a drawer rather than a page column.

- [ ] **Step 1: Create the component**

```tsx
// src/components/shared/product-drawer/product-drawer-preview.tsx
"use client";

import { Package } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { cardSurfaceClass } from "@/components/shared/form-styles";
import { cn } from "@/lib/cn";
import { sanitizeHTML } from "@/lib/sanitize";

export interface ProductDrawerPreviewProps {
  imagePreview: string | null;
  watchedName: string;
  watchedCategory: string;
  watchedBrand: string;
  watchedDescription: string | undefined;
  price: number;
  discountedPrice: number;
  hasDiscount: boolean;
  discount: number;
  stockQuantity: number;
}

export function ProductDrawerPreview({
  imagePreview,
  watchedName,
  watchedCategory,
  watchedBrand,
  watchedDescription,
  price,
  discountedPrice,
  hasDiscount,
  discount,
  stockQuantity,
}: ProductDrawerPreviewProps) {
  return (
    <div className={cn(cardSurfaceClass, "overflow-hidden")}>
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border/40 bg-muted/20">
        {imagePreview ? (
          <Image
            src={imagePreview}
            alt={watchedName || "Product preview"}
            fill
            className="object-contain p-4"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/40">
            <Package className="h-10 w-10" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              No image yet
            </span>
          </div>
        )}
        {hasDiscount && (
          <Badge className="absolute left-3 top-3 rounded-md border-none bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
            -{discount}%
          </Badge>
        )}
      </div>

      <div className="space-y-2.5 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {watchedCategory ? (
            <Badge
              variant="outline"
              className="rounded-full border-indigo-500/20 bg-indigo-500/5 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 dark:border-indigo-500/25 dark:bg-indigo-500/15 dark:text-indigo-400"
            >
              {watchedCategory}
            </Badge>
          ) : (
            <span className="text-[10px] italic text-muted-foreground/60">
              Uncategorized
            </span>
          )}
          {watchedBrand ? (
            <Badge
              variant="outline"
              className="rounded-full border-border/50 bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold text-foreground"
            >
              {watchedBrand}
            </Badge>
          ) : null}
        </div>

        <h3 className="truncate font-heading text-base font-bold tracking-tight text-foreground">
          {watchedName || "Product name"}
        </h3>

        {watchedDescription ? (
          <div
            className="line-clamp-2 text-xs leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitizeHTML(watchedDescription) || "",
            }}
          />
        ) : (
          <p className="line-clamp-2 text-xs italic text-muted-foreground/50">
            Description will appear here as you type.
          </p>
        )}

        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-xl font-extrabold text-foreground">
            ₹{discountedPrice.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-sm font-medium text-muted-foreground/60 line-through">
              ₹{price}
            </span>
          )}
        </div>

        <p className="text-[11px] font-medium text-muted-foreground">
          {stockQuantity === 0
            ? "Out of stock"
            : `${stockQuantity} in stock`}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks in isolation**

Run: `npx tsc --noEmit`
Expected: no errors (component is not imported anywhere yet, so this only checks its own syntax/types).

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/product-drawer/product-drawer-preview.tsx
git commit -m "feat: add premium product drawer live-preview component"
```

---

### Task 6: Product drawer — shared form component

**Files:**
- Create: `src/components/shared/product-drawer/product-drawer-form.tsx`

**Interfaces:**
- Consumes: `fieldInputClass`, `sectionLabelClass` from `@/components/shared/form-styles` (Task 1); `ProductDrawerPreview` from Task 5.
- Produces: `export interface ProductDrawerFormValues` (the loosened shape both real form types are cast to) and `export function ProductDrawerForm(props: ProductDrawerFormProps)` — Task 7 renders this for both create and edit mode.

This is the field layout used by both the "Add product" and "Edit product" drawers: Name/Category/Brand/Price/Image always visible, Description/Discount/Stock under a collapsible "More details" `Accordion` section, with the live preview above the fields.

- [ ] **Step 1: Create the component**

```tsx
// src/components/shared/product-drawer/product-drawer-form.tsx
"use client";

import { Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

import {
  fieldInputClass,
  primaryButtonClass,
  sectionLabelClass,
} from "@/components/shared/form-styles";
import { SharedCategoryInput } from "@/components/shared/category-input/shared-category-input";
import { SharedFileInput } from "@/components/shared/shared-file-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

import { ProductDrawerPreview } from "./product-drawer-preview";

/**
 * Loosened shape both ProductActionFormData (create) and
 * ProductUpdateActionFormData (edit) are structurally compatible with —
 * `image` is optional here because it's only required by the create schema,
 * not the edit one. Call sites cast their real, schema-validated form into
 * this shape with `as unknown as UseFormReturn<ProductDrawerFormValues>` so
 * this one component can drive both the create and edit drawers.
 */
export interface ProductDrawerFormValues {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  discount?: number;
  category?: string;
  brand?: string;
  image?: File;
  image_key?: string;
}

interface CategorySuggestion {
  id: string;
  title: string;
  subtitle: string;
}

export interface ProductDrawerFormProps {
  mode: "create" | "edit";
  form: UseFormReturn<ProductDrawerFormValues>;
  isDisabled: boolean;
  categorySuggestions: CategorySuggestion[];
  isLoadingCategorySuggestions: boolean;
  onSearchCategoryQuery: (query: string) => void;
  brandSuggestions: CategorySuggestion[];
  isLoadingBrandSuggestions: boolean;
  onSearchBrandQuery: (query: string) => void;
  existingImageUrl?: string;
  onSubmit: (e?: React.BaseSyntheticEvent) => void | Promise<void>;
  onSaveAndAddAnother?: () => void;
}

export function ProductDrawerForm({
  mode,
  form,
  isDisabled,
  categorySuggestions,
  isLoadingCategorySuggestions,
  onSearchCategoryQuery,
  brandSuggestions,
  isLoadingBrandSuggestions,
  onSearchBrandQuery,
  existingImageUrl,
  onSubmit,
  onSaveAndAddAnother,
}: ProductDrawerFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    existingImageUrl ?? null
  );

  const [watchedImage, watchedPrice, watchedDiscount, watchedStock, watchedName, watchedCategory, watchedBrand, watchedDescription] =
    useWatch({
      control: form.control,
      name: [
        "image",
        "price",
        "discount",
        "stock_quantity",
        "name",
        "category",
        "brand",
        "description",
      ],
    });

  useEffect(() => {
    if (watchedImage instanceof File) {
      const url = URL.createObjectURL(watchedImage);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(existingImageUrl ?? null);
  }, [watchedImage, existingImageUrl]);

  const price = Number(watchedPrice) || 0;
  const discount = Number(watchedDiscount) || 0;
  const discountedPrice = discount > 0 ? price - (price * discount) / 100 : price;

  return (
    <div className="space-y-6">
      <ProductDrawerPreview
        imagePreview={imagePreview}
        watchedName={watchedName || ""}
        watchedCategory={watchedCategory || ""}
        watchedBrand={watchedBrand || ""}
        watchedDescription={watchedDescription}
        price={price}
        discountedPrice={discountedPrice}
        hasDiscount={discount > 0}
        discount={discount}
        stockQuantity={Number(watchedStock) || 0}
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={sectionLabelClass}>
                  Product Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="E.g., Double Cheese Pizza"
                    className={fieldInputClass}
                    disabled={isDisabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={sectionLabelClass}>
                    Category
                  </FormLabel>
                  <FormControl>
                    <SharedCategoryInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Beverages, Mains..."
                      disabled={isDisabled}
                      suggestions={categorySuggestions}
                      isLoadingSuggestions={isLoadingCategorySuggestions}
                      onSearchQuery={onSearchCategoryQuery}
                      className={fieldInputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={sectionLabelClass}>Brand</FormLabel>
                  <FormControl>
                    <SharedCategoryInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Classmate, Snickers..."
                      disabled={isDisabled}
                      suggestions={brandSuggestions}
                      isLoadingSuggestions={isLoadingBrandSuggestions}
                      onSearchQuery={onSearchBrandQuery}
                      className={fieldInputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={sectionLabelClass}>
                  Price (₹)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    className={fieldInputClass}
                    disabled={isDisabled}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.currentTarget.valueAsNumber;
                      field.onChange(Number.isNaN(val) ? "" : val);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={sectionLabelClass}>
                  Product Image
                </FormLabel>
                <FormControl>
                  <SharedFileInput
                    value={field.value}
                    onChange={(file) => field.onChange(file ?? undefined)}
                    accept="image/*"
                    maxSize={5}
                    disabled={isDisabled}
                    previewUrl={existingImageUrl}
                    placeholder="Drag and drop, or click to upload"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Accordion type="single" collapsible>
            <AccordionItem value="more-details" className="border-none">
              <AccordionTrigger className="rounded-lg border border-border/50 px-4 py-2.5 text-sm font-semibold hover:no-underline">
                More details (description, discount, stock)
              </AccordionTrigger>
              <AccordionContent className="space-y-5 px-1 pt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={sectionLabelClass}>
                        Description
                      </FormLabel>
                      <FormControl>
                        <div className="overflow-hidden rounded-lg border border-border/50 transition-colors focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/10">
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="Ingredients, taste, size..."
                            disabled={isDisabled}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={sectionLabelClass}>
                          Discount (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0"
                            className={fieldInputClass}
                            disabled={isDisabled}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.currentTarget.valueAsNumber;
                              field.onChange(Number.isNaN(val) ? "" : val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={sectionLabelClass}>
                          Stock Quantity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            className={fieldInputClass}
                            disabled={isDisabled}
                            {...field}
                            onChange={(e) => {
                              const val = e.currentTarget.valueAsNumber;
                              field.onChange(Number.isNaN(val) ? 0 : val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            {mode === "create" && onSaveAndAddAnother && (
              <Button
                type="button"
                variant="outline"
                disabled={isDisabled}
                className="h-12 flex-1 rounded-xl font-semibold"
                onClick={onSaveAndAddAnother}
              >
                Save & add another
              </Button>
            )}
            <Button
              type="submit"
              disabled={isDisabled}
              className={`h-12 flex-1 gap-2 ${primaryButtonClass}`}
            >
              <Save className="h-4 w-4" />
              {isDisabled
                ? "Saving..."
                : mode === "create"
                  ? "Save product"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks in isolation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/product-drawer/product-drawer-form.tsx
git commit -m "feat: add shared product drawer form (create + edit modes)"
```

---

### Task 7: Add-product drawer — hook and wiring into the shop header

**Files:**
- Modify: `src/hooks/ui/useProductForm.ts`
- Modify: `src/components/owned-shop/shop-header/shop-action.tsx`
- Delete: `src/app/owner-shops/products/new/page.tsx`
- Delete: `src/page-components/owner-shops/create-product-page/` (entire directory: `index.tsx`, `single-product-form.tsx`, `product-preview-card.tsx`, `bulk-import-tab.tsx`)

**Interfaces:**
- Consumes: `ProductDrawerForm`, `ProductDrawerFormValues` (Task 6); `useCategorySearch`, `useBrandSearch` (existing, `@/hooks`).
- Produces: `useCreateProductForm()` now also returns `isOpen: boolean`, `setIsOpen: (open: boolean) => void`, and `handlers.onSaveAndAddAnother: () => void` in addition to its existing `form`, `state`, `handlers.onSubmit`.

- [ ] **Step 1: Extend `useCreateProductForm`**

In `src/hooks/ui/useProductForm.ts`, replace the existing `useCreateProductForm` function with:

```ts
export function useCreateProductForm() {
  const [isOpen, setIsOpen] = useState(false);
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
      brand: "",
      image: undefined,
    },
  });

  const state: FormState = {
    isLoading: isPending,
    error: error?.message || null,
    isSubmitting: form.formState.isSubmitting,
  };

  const resetForCreate = () =>
    form.reset({
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      image_key: undefined,
      discount: 0,
      category: "",
      brand: "",
      image: undefined,
    });

  const handlers = {
    onSubmit: form.handleSubmit(async (data) => {
      await createProduct(data);
      setIsOpen(false);
      resetForCreate();
    }),
    onSaveAndAddAnother: form.handleSubmit(async (data) => {
      await createProduct(data);
      resetForCreate();
    }),
  };

  return {
    form,
    state,
    handlers,
    isOpen,
    setIsOpen,
  };
}
```

(Note: `brand: ""` is added to `defaultValues` — the original code omitted it even though `productActionSchema` requires it; this was a latent gap the drawer's always-visible Brand field now exercises.)

- [ ] **Step 2: Rewrite `ShopAction` to trigger the drawer**

Replace `src/components/owned-shop/shop-header/shop-action.tsx` entirely with:

```tsx
"use client";

import { Plus } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

import { BulkProductDialog } from "@/components/owned-shop/bulk-product-dialog";
import {
  ProductDrawerForm,
  ProductDrawerFormValues,
} from "@/components/shared/product-drawer/product-drawer-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useBrandSearch, useCategorySearch, useCreateProductForm } from "@/hooks";

export function ShopAction() {
  const { form, state, handlers, isOpen, setIsOpen } = useCreateProductForm();
  const {
    suggestions: categorySuggestions,
    isLoadingSuggestions: isLoadingCategorySuggestions,
    onSearchQuery: onSearchCategoryQuery,
  } = useCategorySearch();
  const {
    suggestions: brandSuggestions,
    isLoadingSuggestions: isLoadingBrandSuggestions,
    onSearchQuery: onSearchBrandQuery,
  } = useBrandSearch();

  const isDisabled = state.isLoading || state.isSubmitting;

  return (
    <div className="flex items-center gap-2">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <Button
          className="gap-2 shadow-sm transition-all hover:shadow-md"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">Add Product</span>
        </Button>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Add a product</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProductDrawerForm
              mode="create"
              form={form as unknown as UseFormReturn<ProductDrawerFormValues>}
              isDisabled={isDisabled}
              categorySuggestions={categorySuggestions}
              isLoadingCategorySuggestions={isLoadingCategorySuggestions}
              onSearchCategoryQuery={onSearchCategoryQuery}
              brandSuggestions={brandSuggestions}
              isLoadingBrandSuggestions={isLoadingBrandSuggestions}
              onSearchBrandQuery={onSearchBrandQuery}
              onSubmit={handlers.onSubmit}
              onSaveAndAddAnother={handlers.onSaveAndAddAnother}
            />
          </div>
        </SheetContent>
      </Sheet>
      <BulkProductDialog onSuccess={() => setIsOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 3: Remove the now-obsolete full-page create flow**

```bash
git rm -r src/app/owner-shops/products/new src/page-components/owner-shops/create-product-page
```

- [ ] **Step 4: Type-check and manually verify**

Run: `npx tsc --noEmit`
Expected: no errors (confirms nothing else imports the deleted `create-product-page` module — if something does, fix that import before proceeding).

Then run the dev server, open the owner shop page, click "Add Product": confirm the drawer opens, "Save & add another" keeps it open and resets the form (test by adding two products back-to-back), and normal "Save product" closes the drawer and the new product appears in the list. Repeat at 375px width.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: replace full-page product creation with a fast-add drawer"
```

---

### Task 8: Edit-product drawer and inline price quick-edit

**Files:**
- Modify: `src/hooks/ui/useProductForm.ts`
- Modify: `src/components/shared/product-card/owner-product-actions.tsx`
- Delete: `src/components/owned-shop/product-card/product-edit-dialog.tsx`
- Modify: `src/lib/utils/product.utils.ts`
- Create: `src/components/shared/product-drawer/inline-price-edit.tsx`

**Interfaces:**
- Consumes: `ProductDrawerForm`, `ProductDrawerFormValues` (Task 6); `useUpdateProductPrice` (Task 4).
- Produces: `InlinePriceEdit` component used only inside `owner-product-actions.tsx`.

- [ ] **Step 1: Rename the update hook's dialog state to match Sheet's prop names**

`useUpdateProductForm` in `src/hooks/ui/useProductForm.ts` already returns `isDialogOpen`/`setIsDialogOpen`, which work identically as `Sheet`'s `open`/`onOpenChange` — no change needed to the hook itself for this task. Also add `brand` to its `defaultValues` (same latent gap as Task 7):

Find this block in `useUpdateProductForm`:

```ts
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
```

Replace with:

```ts
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_key: product.image_key,
      discount: product.discount || 0,
      category: product.category?.name || "",
      brand: product.brand?.name || "",
      image: undefined,
    },
```

- [ ] **Step 2: Create the inline price editor**

```tsx
// src/components/shared/product-drawer/inline-price-edit.tsx
"use client";

import { Pencil } from "lucide-react";
import React, { useState } from "react";

import { Input } from "@/components/ui/input";
import { useUpdateProductPrice } from "@/hooks/queries/useShopProducts";

interface InlinePriceEditProps {
  productId: string;
  price: number;
}

export function InlinePriceEdit({ productId, price }: InlinePriceEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(String(price));
  const updatePrice = useUpdateProductPrice();

  const commit = () => {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed !== price) {
      updatePrice.mutate({ productId, price: parsed });
    } else {
      setValue(String(price));
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        min={0}
        autoFocus
        className="h-9 w-28 rounded-lg text-sm font-bold"
        value={value}
        disabled={updatePrice.isPending}
        onChange={(e) => setValue(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(String(price));
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(String(price));
        setIsEditing(true);
      }}
      className="flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-sm font-bold text-foreground hover:border-border/60 hover:bg-muted/40"
    >
      ₹{price}
      <Pencil className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
```

- [ ] **Step 3: Rewrite `owner-product-actions.tsx` to use the drawer and inline price edit**

Replace `src/components/shared/product-card/owner-product-actions.tsx` entirely with:

```tsx
"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";

import { InlinePriceEdit } from "@/components/shared/product-drawer/inline-price-edit";
import { ProductDrawerForm, ProductDrawerFormValues } from "@/components/shared/product-drawer/product-drawer-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useBrandSearch, useCategorySearch, useUpdateProductForm } from "@/hooks";
import { useToggleProductStock } from "@/hooks/queries/useShopProducts";
import { ImageUtils } from "@/lib/utils";
import { SerializedProduct } from "@/types/product.types";

interface OwnerProductActionsProps {
  product: SerializedProduct;
  onDelete: (product_id: string, image_key: string) => Promise<void>;
}

export function OwnerProductActions({
  product,
  onDelete,
}: OwnerProductActionsProps) {
  const {
    suggestions: categorySuggestions,
    isLoadingSuggestions: isLoadingCategorySuggestions,
    onSearchQuery: onSearchCategoryQuery,
  } = useCategorySearch();
  const {
    suggestions: brandSuggestions,
    isLoadingSuggestions: isLoadingBrandSuggestions,
    onSearchQuery: onSearchBrandQuery,
  } = useBrandSearch();

  const { form, state, handlers, isDialogOpen, setIsDialogOpen } =
    useUpdateProductForm({ product });

  const toggleStock = useToggleProductStock();
  const inStock = product.stock_quantity > 0;
  const isDisabled = state.isLoading || (state.isSubmitting ?? false);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between w-full p-2 border rounded-xl bg-card">
        <InlinePriceEdit productId={product.id} price={product.price} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            In Stock
          </span>
          <Switch
            checked={inStock}
            onCheckedChange={(checked) =>
              toggleStock.mutate({ productId: product.id, inStock: checked })
            }
            disabled={toggleStock.isPending}
          />
        </div>
      </div>

      <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button
          variant="outline"
          className="w-full transition-transform duration-200 hover:scale-[1.02]"
          onClick={handlers.openDialog}
        >
          Edit
        </Button>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit product</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProductDrawerForm
              mode="edit"
              form={form as unknown as UseFormReturn<ProductDrawerFormValues>}
              isDisabled={isDisabled}
              categorySuggestions={categorySuggestions}
              isLoadingCategorySuggestions={isLoadingCategorySuggestions}
              onSearchCategoryQuery={onSearchCategoryQuery}
              brandSuggestions={brandSuggestions}
              isLoadingBrandSuggestions={isLoadingBrandSuggestions}
              onSearchBrandQuery={onSearchBrandQuery}
              existingImageUrl={
                product.image_key
                  ? ImageUtils.getImageUrl(product.image_key)
                  : undefined
              }
              onSubmit={handlers.onSubmit}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Button
        onClick={() => onDelete(product.id, product.image_key)}
        variant="destructive"
        className="w-full transition-transform duration-200 hover:scale-[1.02]"
      >
        Delete
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Delete the obsolete dialog component**

```bash
git rm src/components/owned-shop/product-card/product-edit-dialog.tsx
```

- [ ] **Step 5: Remove the now-dead generic product form-fields helper**

In `src/lib/utils/product.utils.ts`, delete the `PRODUCT_FORM_FIELDS` constant and the `createProductFormFields` method (the only caller was the file just deleted). Delete:

```ts
const PRODUCT_FORM_FIELDS: FormFieldConfig<ProductActionFormData>[] = [
  { name: "name", label: "Product Name", type: "text", required: true },
  {
    name: "description",
    label: "Description",
    type: "richtext",
    placeholder: "Describe your product...",
    required: true,
  },
  { name: "price", label: "Price", type: "number", required: true },
  {
    name: "stock_quantity",
    label: "Stock Quantity",
    type: "number",
    required: true,
  },
  {
    name: "discount",
    label: "Discount (%)",
    type: "number",
    required: false,
  },
  {
    name: "category",
    label: "Category",
    type: "category",
    required: true,
    placeholder: "Select or create category...",
  },
  {
    name: "image",
    label: "Product Image",
    type: "file",
    accept: "image/*",
    maxSize: 5,
    required: false,
  },
];
```

and, inside the `ProductUIServices` class:

```ts
  createProductFormFields(): FormFieldConfig<ProductActionFormData>[] {
    return PRODUCT_FORM_FIELDS;
  }
```

If removing these leaves `FormFieldConfig` or `ProductActionFormData` as unused imports at the top of the file, remove those import lines too.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manually verify edit + inline price edit**

Run the dev server, open the owner shop page's product list:
- Click a product's "Edit" button — confirm the drawer opens prefilled with the product's current values (including the existing image and brand), and saving updates the card.
- Click the price on a product card — confirm it turns into a number input, saving on Enter and on blur, and reverting on Escape.
- Repeat both at 375px width.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: replace product edit dialog with drawer; add inline price quick-edit"
```

---

### Task 9: Final cleanup and full verification

**Files:**
- No new files — verification and dead-code sweep only.

- [ ] **Step 1: Search for any remaining references to deleted modules**

Run: `grep -rn "create-product-page\|ProductEditDialog\|ProductPreviewCard" src --include="*.ts" --include="*.tsx"`
Expected: no output. If anything is found, update or remove that reference before continuing.

- [ ] **Step 2: Run the full type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass, including the new `updateProductPriceAction` tests from Task 3 and the existing `product-actions.test.ts` suite unaffected by the `brand` default-value fix in Tasks 7–8.

- [ ] **Step 4: Run lint**

Run: `npm run lint` (or the project's configured lint script)
Expected: no errors (warnings acceptable only if they pre-exist elsewhere in the codebase).

- [ ] **Step 5: End-to-end manual pass**

With the dev server running, at both desktop and 375px width:
- Complete the shop-creation wizard start to finish (all 7 steps), confirming indigo accent throughout and the mobile collapsed live-preview toggle.
- Add three products in a row using "Save & add another" without closing the drawer.
- Edit one of them via the drawer, confirm the change reflects immediately.
- Quick-edit a price inline and confirm it persists after a page refresh.
- Toggle a product's stock switch and confirm it persists after a page refresh.

- [ ] **Step 6: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final cleanup pass for premium shop/product UX"
```
