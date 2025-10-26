"use client";

import { NotificationCategory, NotificationType } from "@prisma/client";
import { Bell } from "lucide-react";

import { SharedForm } from "@/components/shared/shared-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBroadcastForm } from "@/hooks/ui/useBroadcastForm";
import { ButtonConfig, FormFieldConfig } from "@/types";
import { BroadcastFormData } from "@/validations";

export function BroadcastForm() {
  const { form, onSubmit, isLoading, error } = useBroadcastForm();

  const fields: FormFieldConfig<BroadcastFormData>[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      placeholder: "Enter notification title",
      maxLength: 200,
      showCharCount: true,
      required: true,
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      placeholder: "Enter notification message",
      maxLength: 1000,
      showCharCount: true,
      required: true,
      customProps: {
        rows: 6,
      },
    },
  ];

  const submitButton: ButtonConfig = {
    text: isLoading ? "Sending..." : "Send Broadcast",
    type: "submit",
    variant: "default",
    disabled: isLoading,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Broadcast Notification
        </CardTitle>
        <CardDescription>
          This notification will be sent to all users in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SharedForm
          form={form}
          fields={fields}
          submitButton={submitButton}
          onSubmit={onSubmit}
          isLoading={isLoading}
          error={error}
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select notification type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NotificationType.INFO}>
                        Info
                      </SelectItem>
                      <SelectItem value={NotificationType.SUCCESS}>
                        Success
                      </SelectItem>
                      <SelectItem value={NotificationType.WARNING}>
                        Warning
                      </SelectItem>
                      <SelectItem value={NotificationType.ERROR}>
                        Error
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select notification category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NotificationCategory.GENERAL}>
                        General
                      </SelectItem>
                      <SelectItem value={NotificationCategory.ORDER}>
                        Order
                      </SelectItem>
                      <SelectItem value={NotificationCategory.SYSTEM}>
                        System
                      </SelectItem>
                      <SelectItem value={NotificationCategory.ANNOUNCEMENT}>
                        Announcement
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="action_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="/path/to/action (e.g., /shops)"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Users will be redirected to this URL when they click the
                  notification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            Reset Form
          </Button>
        </SharedForm>
      </CardContent>
    </Card>
  );
}
