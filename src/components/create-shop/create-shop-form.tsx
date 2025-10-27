"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { Textarea } from "../ui/textarea";

export function CreateShopForm() {
  const [step, setStep] = useState(1);
  const { form, handlers, state } = useLinkShop();
  const { isSubmitting } = state;

  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto">
      <Progress value={(step / 4) * 100} className="mb-8" />
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
                        <Textarea
                          aria-label="Shop Description"
                          placeholder="The best shop on campus"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of your shop.
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
          {step === 4 && (
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
            {step < 4 && (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                className="ml-auto"
              >
                Next
              </Button>
            )}
            {step === 4 && (
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => router.push("/owner-shops")}
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
  );
}
