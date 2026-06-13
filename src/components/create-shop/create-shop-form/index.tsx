"use client";

import {
  Clock,
  Coins,
  CreditCard,
  Image as ImageIcon,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useLinkShop } from "@/hooks";

import { DetailsStep } from "./details-step";
import { FeesScheduleStep } from "./fees-schedule-step";
import { HoursLocationStep } from "./hours-location-step";
import { ImageStep } from "./image-step";
import { PaymentsStep } from "./payments-step";
import { StepSidebar } from "./step-sidebar";

const STEPS_META = [
  { num: 1, title: "Shop Details", desc: "Name and description", icon: Store },
  {
    num: 2,
    title: "Hours & Location",
    desc: "Where and when you operate",
    icon: Clock,
  },
  {
    num: 3,
    title: "Fees & Batches",
    desc: "Pricing and delivery schedule",
    icon: Coins,
  },
  { num: 4, title: "Shop Image", desc: "Visual branding", icon: ImageIcon },
  {
    num: 5,
    title: "Payments",
    desc: "UPI and QR code setup",
    icon: CreditCard,
  },
];

const STEP_ESTIMATES = {
  1: "Step 1 of 5 • About 3 minutes left",
  2: "Step 2 of 5 • About 2 minutes left",
  3: "Step 3 of 5 • About 1 minute left",
  4: "Step 4 of 5 • Almost finished!",
  5: "Step 5 of 5 • Ready to launch!",
};

const SCHEMA_VERSION = 1;
const DRAFT_TTL = 72 * 60 * 60 * 1000;

const serializableDraftSchema = z.object({
  name: z.string(),
  description: z.string(),
  location: z.string(),
  opening: z.string(),
  closing: z.string(),
  min_order_value: z.number().min(0),
  default_delivery_fee: z.number().min(0),
  direct_delivery_fee: z.number().min(0),
  upi_id: z.string(),
  batch_slots: z.array(
    z.object({
      cutoff_time_minutes: z.number().int().min(0).max(1439),
      label: z.string().nullable().optional(),
    })
  ),
});

const draftEnvelopeSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  savedAt: z
    .number()
    .refine((ts) => Date.now() - ts <= DRAFT_TTL, "Draft expired"),
  step: z.number().int().min(1).max(5),
  data: serializableDraftSchema,
});

type SerializableDraft = z.infer<typeof serializableDraftSchema>;
type DraftEnvelope = z.infer<typeof draftEnvelopeSchema>;

function validateDraft(envelope: unknown): envelope is DraftEnvelope {
  return draftEnvelopeSchema.safeParse(envelope).success;
}

export function CreateShopForm() {
  const [step, setStep] = useState(1);
  const { form, handlers, state } = useLinkShop();
  const { isSubmitting, isLoading } = state;

  const [pendingDraft, setPendingDraft] = useState<DraftEnvelope | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cc_create_shop_draft");
      if (raw) {
        const envelope = JSON.parse(raw);
        if (validateDraft(envelope)) {
          setTimeout(() => {
            setPendingDraft(envelope);
            setShowPrompt(true);
          }, 0);
        } else {
          sessionStorage.removeItem("cc_create_shop_draft");
        }
      }
    } catch {
      toast.error("Failed to parse draft from sessionStorage");
    }
  }, []);

  const handleRestore = () => {
    if (pendingDraft) {
      const { step: savedStep, data } = pendingDraft;
      setStep(savedStep);
      form.reset({
        name: data.name,
        description: data.description,
        location: data.location,
        opening: data.opening,
        closing: data.closing,
        min_order_value: data.min_order_value,
        default_delivery_fee: data.default_delivery_fee,
        direct_delivery_fee: data.direct_delivery_fee,
        upi_id: data.upi_id,
        batch_slots: data.batch_slots,
      });
    }
    setShowPrompt(false);
  };

  const handleDiscard = () => {
    sessionStorage.removeItem("cc_create_shop_draft");
    setShowPrompt(false);
  };

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

  useEffect(() => {
    const subscription = form.watch((values) => {
      const timer = setTimeout(() => {
        try {
          const serializableValues: SerializableDraft = {
            name: values.name || "",
            description: values.description || "",
            location: values.location || "",
            opening: values.opening || "07:00",
            closing: values.closing || "20:00",
            min_order_value: Number(values.min_order_value) || 50,
            default_delivery_fee: Number(values.default_delivery_fee) || 0,
            direct_delivery_fee: Number(values.direct_delivery_fee) || 0,
            upi_id: values.upi_id || "",
            batch_slots: (
              (values.batch_slots || []) as {
                cutoff_time_minutes?: number;
                label?: string | null;
              }[]
            ).map((slot) => ({
              cutoff_time_minutes: Number(slot?.cutoff_time_minutes) || 0,
              label: slot?.label || null,
            })),
          };

          const envelope: DraftEnvelope = {
            version: SCHEMA_VERSION,
            savedAt: Date.now(),
            step,
            data: serializableValues,
          };

          sessionStorage.setItem(
            "cc_create_shop_draft",
            JSON.stringify(envelope)
          );
        } catch {
          toast.error("Failed to save draft");
        }
      }, 500);
      return () => clearTimeout(timer);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, step]);

  const activeMeta = STEPS_META[step - 1];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-12 py-8 px-4 sm:px-6">
      <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
        <AlertDialogContent className="max-w-md bg-card border border-border/30 rounded-2xl overflow-hidden shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold tracking-tight text-foreground">
              Resume previous setup?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed font-medium">
              We found an unfinished draft for your shop setup. Would you like
              to resume where you left off or start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4 border-t border-border/10 pt-3">
            <AlertDialogCancel
              onClick={handleDiscard}
              className="h-10 px-5 rounded-xl border-border/60 font-semibold cursor-pointer"
            >
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="h-10 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer border-none shadow shadow-blue-500/10"
            >
              Resume Setup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-8">
        <StepSidebar
          step={step}
          stepsMeta={STEPS_META}
          stepEstimates={STEP_ESTIMATES}
        />
      </div>

      <div className="md:hidden col-span-12 space-y-3 mb-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
            {activeMeta.title}
          </span>
          <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            {STEP_ESTIMATES[step as keyof typeof STEP_ESTIMATES]}
          </span>
        </div>
        <Progress
          value={(step / 5) * 100}
          className="h-1.5 bg-muted rounded-full [&_div]:bg-blue-600"
        />
      </div>

      <div className="md:col-span-8 lg:col-span-9 col-span-12">
        <div className="bg-card/45 backdrop-blur-xl rounded-2xl border border-border/30 shadow-xl shadow-blue-500/[0.01] overflow-hidden relative flex flex-col h-full min-h-[500px]">
          <Form {...form}>
            <form
              onSubmit={handlers.onSubmit}
              className="flex flex-col h-full min-h-[500px] justify-between"
            >
              <div className="p-6 sm:p-8 flex-1 space-y-6">
                {step === 1 && (
                  <DetailsStep form={form} isSubmitting={isSubmitting} />
                )}

                {step === 2 && <HoursLocationStep form={form} />}

                {step === 3 && (
                  <FeesScheduleStep
                    form={form}
                    isSubmitting={isSubmitting}
                    isLoading={isLoading}
                  />
                )}

                {step === 4 && <ImageStep form={form} />}

                {step === 5 && <PaymentsStep form={form} />}
              </div>

              <div className="p-6 sm:p-8 bg-muted/10 border-t border-border/20 flex items-center justify-between mt-auto">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="h-11 px-6 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs cursor-pointer"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-4">
                  <FormMessage className="text-xs" />

                  {step < 5 && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-11 px-6 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white text-xs shadow shadow-blue-500/10 cursor-pointer border-none"
                    >
                      Continue
                    </Button>
                  )}
                  {step === 5 && (
                    <div className="flex flex-col items-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="h-11 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.98] text-white shadow-md shadow-blue-500/10 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none border-none cursor-pointer text-xs"
                      >
                        {isSubmitting || isLoading
                          ? "Launching portal..."
                          : "Create Shop & Launch Dashboard"}
                      </Button>
                      <span className="text-[10px] text-muted-foreground mt-1.5 text-right font-medium">
                        Your store goes live after setup.
                      </span>
                    </div>
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
