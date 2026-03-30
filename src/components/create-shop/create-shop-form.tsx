"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

import { BatchCardsEditor } from "@/components/shared/batch-cards-editor";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useLinkShop } from "@/hooks";
import { cn } from "@/lib/cn";

import { SharedFileInput } from "../shared/shared-file-input";
import { RichTextEditor } from "../ui/rich-text-editor";

const STEPS_META = [
  { num: 1, title: "Shop Details", desc: "Name and description" },
  { num: 2, title: "Hours & Location", desc: "Where and when you operate" },
  { num: 3, title: "Fees & Batches", desc: "Pricing and delivery schedule" },
  { num: 4, title: "Shop Image", desc: "Visual branding" },
  { num: 5, title: "Payments", desc: "UPI and QR code setup" },
];

export function CreateShopForm() {
  const [step, setStep] = useState(1);
  const { form, handlers, state } = useLinkShop();
  const { isSubmitting, isLoading } = state;

  const stepFieldNames = {
    1: ["name", "description"] as const,
    2: ["location", "opening", "closing"] as const,
    3: [
      "min_order_value",
      "default_delivery_fee",
      "direct_delivery_fee",
      "batch_slots",
    ] as const,
    4: ["image"] as const,
    5: ["qr_image", "upi_id"] as const,
  };

  const nextStep = async () => {
    const fieldNames = stepFieldNames[step as keyof typeof stepFieldNames];
    const isValid = await form.trigger(fieldNames);
    if (isValid) setStep((s) => s + 1);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-12 py-8">
      {/* Left Sidebar: Progress Tracker */}
      <div className="md:col-span-4 lg:col-span-3 space-y-8">
        <div className="sticky top-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create Shop</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Set up your store in 5 quick steps.
            </p>
          </div>

          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round((step / 5) * 100)}%</span>
            </div>
            <Progress value={(step / 5) * 100} className="h-2" />
          </div>

          <nav className="space-y-4">
            {STEPS_META.map((s) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;

              return (
                <div
                  key={s.num}
                  className={cn(
                    "flex items-start gap-3 transition-opacity",
                    isActive ? "opacity-100" : "opacity-50"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : isActive ? (
                      <Circle className="h-5 w-5 fill-primary text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {s.num}. {s.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Right Content: Form Fields */}
      <div className="md:col-span-8 lg:col-span-9">
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Form {...form}>
            <form
              onSubmit={handlers.onSubmit}
              className="flex flex-col h-full min-h-125"
            >
              <div className="p-6 sm:p-8 flex-1">
                {/* STEP 1: Details */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Shop Details
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        This is how customers will see your shop.
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Shop Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="E.g., Midnight Munchies"
                                className="shadow-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Your shop's public display name.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Description
                            </FormLabel>
                            <FormControl>
                              <RichTextEditor
                                value={field.value || ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                placeholder="Write something about your shop..."
                                disabled={field.disabled || isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              {String(field.value || "").length}/{500}{" "}
                              characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Hours & Location */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Hours & Location
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Where are you located and when are you open?
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Location
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="E.g., Main Street, Block A"
                                className="shadow-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Where customers can find your physical store (if
                              applicable).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="opening"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">
                                Opening Time
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="shadow-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="closing"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">
                                Closing Time
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  className="shadow-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Fees & Batches */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Fees & Batch Cards
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Set your minimums, delivery fees, and schedule.
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="min_order_value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">
                                Minimum Order Value (₹)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step="1"
                                  className="shadow-sm"
                                  value={field.value ?? 50}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.currentTarget.valueAsNumber
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Minimum cart value required to order.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="default_delivery_fee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">
                                Default Delivery Fee (₹)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  step="1"
                                  className="shadow-sm"
                                  value={field.value ?? 0}
                                  onChange={(e) => {
                                    const value = e.currentTarget.valueAsNumber;
                                    field.onChange(isNaN(value) ? 0 : value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Standard fee for batch deliveries.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="direct_delivery_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Direct Delivery Fee (₹)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="1"
                                className="shadow-sm"
                                value={field.value ?? 0}
                                onChange={(e) => {
                                  const value = e.currentTarget.valueAsNumber;
                                  field.onChange(isNaN(value) ? 0 : value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Extra fee charged for immediate (non-batched)
                              delivery.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="batch_slots"
                        render={({ field }) => (
                          <FormItem className="pt-2">
                            <FormLabel className="font-semibold text-base">
                              Batch Schedule
                            </FormLabel>
                            <FormDescription className="mb-2">
                              Leave empty if you only do direct deliveries.
                            </FormDescription>
                            <FormControl>
                              <div className="rounded-lg border p-4 bg-muted/10 shadow-sm">
                                <BatchCardsEditor
                                  value={field.value || []}
                                  onChange={field.onChange}
                                  disabled={isSubmitting || isLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: Shop Image */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Shop Image
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Upload a banner or logo for your shop.
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SharedFileInput
                                value={field.value}
                                onChange={(file) => field.onChange(file)}
                                accept="image/*"
                                maxSize={5}
                                placeholder="Drag & drop or click to upload shop image"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5: Payments */}
                {step === 5 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Payments Setup
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        How will customers pay you online?
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="upi_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              UPI ID
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                className="shadow-sm font-mono"
                                placeholder="e.g. yourname@upi"
                              />
                            </FormControl>
                            <FormDescription>
                              The UPI address where you will receive payments.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="qr_image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              Payment QR Code
                            </FormLabel>
                            <FormControl>
                              <SharedFileInput
                                value={field.value}
                                onChange={(file) => field.onChange(file)}
                                accept="image/*"
                                maxSize={5}
                                placeholder="Upload your UPI QR code image"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="p-6 sm:p-8 bg-muted/10 border-t flex items-center justify-between mt-auto">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="shadow-sm"
                  >
                    Back
                  </Button>
                ) : (
                  <div /> // Placeholder to push Next button to the right
                )}

                <div className="flex items-center gap-4">
                  <FormMessage className="text-sm">
                    {form.formState.errors.root?.message}
                  </FormMessage>

                  {step < 5 && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="shadow-sm px-6"
                    >
                      Continue
                    </Button>
                  )}
                  {step === 5 && (
                    <Button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="shadow-sm px-8"
                    >
                      {isSubmitting || isLoading
                        ? "Creating Shop..."
                        : "Create Shop"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
