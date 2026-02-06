"use client";

import { useState } from "react";

import { BatchCardsEditor } from "@/components/shared/batch-cards-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useLinkShop } from "@/hooks";

import { SharedFileInput } from "../shared/shared-file-input";
import { RichTextEditor } from "../ui/rich-text-editor";

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
      "default_platform_fee",
      "batch_cards",
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
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-12">
      <div className="md:col-span-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create your shop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(step / 5) * 100} />
            <div className="text-sm text-muted-foreground">
              Step {step} of 5
            </div>
            <div className="space-y-1 text-sm">
              <div
                className={step === 1 ? "font-medium" : "text-muted-foreground"}
              >
                1) Details
              </div>
              <div
                className={step === 2 ? "font-medium" : "text-muted-foreground"}
              >
                2) Hours
              </div>
              <div
                className={step === 3 ? "font-medium" : "text-muted-foreground"}
              >
                3) Fees & batch cards
              </div>
              <div
                className={step === 4 ? "font-medium" : "text-muted-foreground"}
              >
                4) Shop image
              </div>
              <div
                className={step === 5 ? "font-medium" : "text-muted-foreground"}
              >
                5) Payments
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-8">
        <Form {...form}>
          <form onSubmit={handlers.onSubmit} className="space-y-8">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Shop Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Shop" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your shop's public display name.
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder={"Write something about your shop"}
                            disabled={field.disabled || isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          {String(field.value || "").length}/{500} characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Shop Hours & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Main Street, 123" {...field} />
                        </FormControl>
                        <FormDescription>
                          Where is your shop located?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="opening"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
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
                        <FormLabel>Closing Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fees & batch cards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="min_order_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Order Value (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={field.value ?? 50}
                            onChange={(e) =>
                              field.onChange(e.currentTarget.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum cart value required before an order can be
                          placed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="batch_cards"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch cards</FormLabel>
                        <FormControl>
                          <BatchCardsEditor
                            value={field.value || []}
                            onChange={field.onChange}
                            disabled={isSubmitting || isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="default_delivery_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Climb/Delivery Fee (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(e.currentTarget.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="default_platform_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Platform Fee (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(e.currentTarget.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Shop Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image</FormLabel>
                        <FormControl>
                          <SharedFileInput
                            value={field.value}
                            onChange={(file) => field.onChange(file)}
                            accept="image/*"
                            maxSize={5}
                            placeholder="Enter Your Image"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload an image for your shop.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment QR Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="qr_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>QR Image</FormLabel>
                        <FormControl>
                          <SharedFileInput
                            value={field.value}
                            onChange={(file) => field.onChange(file)}
                            accept="image/*"
                            maxSize={5}
                            placeholder="Enter Your QR Image"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload an qr image for payment for your shop.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="upi_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter Your UPI ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter the UPI ID"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              {step > 1 && (
                <Button type="button" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
              {step < 5 && (
                <Button type="button" onClick={nextStep} className="ml-auto">
                  Next
                </Button>
              )}
              {step === 5 && (
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="ml-auto"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              )}
              <FormMessage>{form.formState.errors.root?.message}</FormMessage>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
