"use client";

import {
  CalendarClock,
  CheckCircle2,
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

import { BatchScheduleStep } from "./batch-schedule-step";
import { DetailsStep } from "./details-step";
import { HoursLocationStep } from "./hours-location-step";
import { ImageStep } from "./image-step";
import { PaymentsStep } from "./payments-step";
import { PricingStep } from "./pricing-step";
import { ReviewStep } from "./review-step";
import { ShopPreviewCard } from "./shop-preview-card";
import { StepSidebar } from "./step-sidebar";

const TOTAL_STEPS = 7;

const STEPS_META = [
  { num: 1, title: "Shop details", desc: "Name and description", icon: Store },
  {
    num: 2,
    title: "Hours & location",
    desc: "Where and when you operate",
    icon: Clock,
  },
  { num: 3, title: "Pricing", desc: "Minimum order and fees", icon: Coins },
  {
    num: 4,
    title: "Delivery batches",
    desc: "Cutoff times for grouped orders",
    icon: CalendarClock,
  },
  { num: 5, title: "Shop image", desc: "Visual branding", icon: ImageIcon },
  {
    num: 6,
    title: "Payments",
    desc: "UPI and QR code setup",
    icon: CreditCard,
  },
  {
    num: 7,
    title: "Review",
    desc: "Confirm and launch",
    icon: CheckCircle2,
  },
];

const STEP_ESTIMATES: Record<number, string> = {
  1: `Step 1 of ${TOTAL_STEPS} · About 3 minutes left`,
  2: `Step 2 of ${TOTAL_STEPS} · About 2 minutes left`,
  3: `Step 3 of ${TOTAL_STEPS} · About 2 minutes left`,
  4: `Step 4 of ${TOTAL_STEPS} · About 1 minute left`,
  5: `Step 5 of ${TOTAL_STEPS} · Almost there`,
  6: `Step 6 of ${TOTAL_STEPS} · Almost there`,
  7: `Step ${TOTAL_STEPS} of ${TOTAL_STEPS} · Ready to launch`,
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
  step: z.number().int().min(1).max(TOTAL_STEPS),
  data: serializableDraftSchema,
});

type SerializableDraft = z.infer<typeof serializableDraftSchema>;
type DraftEnvelope = z.infer<typeof draftEnvelopeSchema>;

function validateDraft(envelope: unknown): envelope is DraftEnvelope {
  return draftEnvelopeSchema.safeParse(envelope).success;
}

const stepFieldNames = {
  1: ["name", "description"] as const,
  2: ["location", "opening", "closing"] as const,
  3: ["min_order_value", "default_delivery_fee", "direct_delivery_fee"] as const,
  4: ["batch_slots"] as const,
  5: ["image"] as const,
  6: ["qr_image", "upi_id"] as const,
};

export function CreateShopForm() {
  const [step, setStep] = useState(1);
  const { form, handlers, state } = useLinkShop();
  const { isSubmitting, isLoading } = state;

  const [pendingDraft, setPendingDraft] = useState<DraftEnvelope | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cc_create_shop_draft");
      if (raw) {
        const envelope = JSON.parse(raw);
        if (validateDraft(envelope)) {
          const st = setTimeout(() => {
            setPendingDraft(envelope);
            setShowPrompt(true);
          }, 0);
          return () => clearTimeout(st);
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

  const goToStep = (target: number) => setStep(target);

  const nextStep = async () => {
    const fieldNames = stepFieldNames[step as keyof typeof stepFieldNames];
    const isValid = await form.trigger(fieldNames);
    if (isValid) setStep((s) => s + 1);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const subscription = form.watch((values) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
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
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [form, step]);

  const activeMeta = STEPS_META[step - 1];
  const watched = form.watch();
  const previewValues = {
    name: watched.name || "",
    description: watched.description || "",
    location: watched.location || "",
    opening: watched.opening || "",
    closing: watched.closing || "",
    minOrderValue: Number(watched.min_order_value) || 0,
    image: watched.image,
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-12">
      <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
        <AlertDialogContent className="max-w-md overflow-hidden rounded-2xl border border-border/30 bg-card shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold tracking-tight text-foreground">
              Resume previous setup?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              We found an unfinished draft for your shop setup. Would you
              like to resume where you left off or start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 border-t border-border/10 pt-3 sm:gap-0">
            <AlertDialogCancel
              onClick={handleDiscard}
              className="h-10 cursor-pointer rounded-xl border-border/60 px-5 font-semibold"
            >
              Start fresh
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="h-10 cursor-pointer rounded-xl border-none bg-indigo-600 px-6 font-semibold text-white shadow shadow-indigo-500/10 hover:bg-indigo-700"
            >
              Resume setup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="hidden md:col-span-4 md:block lg:col-span-3">
        <StepSidebar
          step={step}
          totalSteps={TOTAL_STEPS}
          stepsMeta={STEPS_META}
          stepEstimates={STEP_ESTIMATES}
        />
      </div>

      <div className="col-span-12 mb-2 space-y-3 md:hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            {activeMeta.title}
          </span>
          <span className="font-medium text-muted-foreground">
            {STEP_ESTIMATES[step]}
          </span>
        </div>
        <Progress
          value={(step / TOTAL_STEPS) * 100}
          className="h-1.5 rounded-full bg-muted [&_div]:bg-indigo-600"
        />

        <button
          type="button"
          onClick={() => setMobilePreviewOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card px-3 py-2.5 text-left"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <span className="flex-1 truncate text-xs font-semibold text-foreground">
            {previewValues.name || "Your shop"} · live preview
          </span>
          <span className="text-xs font-medium text-indigo-600">
            {mobilePreviewOpen ? "Hide" : "View"}
          </span>
        </button>

        {mobilePreviewOpen && (
          <ShopPreviewCard values={previewValues} className="mt-1" />
        )}
      </div>

      <div className="col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-6">
        <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
          <Form {...form}>
            <form
              onSubmit={handlers.onSubmit}
              className="flex h-full min-h-[500px] flex-col justify-between"
            >
              <div className="flex-1 space-y-6 p-6 sm:p-8">
                {step === 1 && (
                  <DetailsStep form={form} isSubmitting={isSubmitting} />
                )}
                {step === 2 && <HoursLocationStep form={form} />}
                {step === 3 && <PricingStep form={form} />}
                {step === 4 && (
                  <BatchScheduleStep
                    form={form}
                    isSubmitting={isSubmitting}
                    isLoading={isLoading}
                  />
                )}
                {step === 5 && <ImageStep form={form} />}
                {step === 6 && <PaymentsStep form={form} />}
                {step === 7 && (
                  <ReviewStep form={form} goToStep={goToStep} />
                )}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border/20 p-6 sm:p-8">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="h-11 cursor-pointer rounded-xl border-border/60 px-6 text-sm font-semibold hover:bg-muted/30"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-4">
                  <FormMessage className="text-xs" />

                  {step < TOTAL_STEPS && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="h-11 cursor-pointer rounded-xl border-none bg-indigo-600 px-6 text-sm font-semibold text-white shadow shadow-indigo-500/10 hover:bg-indigo-700"
                    >
                      Continue
                    </Button>
                  )}
                  {step === TOTAL_STEPS && (
                    <div className="flex flex-col items-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="h-11 cursor-pointer rounded-xl border-none bg-indigo-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-500/10 transition-transform hover:scale-[1.01] hover:bg-indigo-700 active:scale-[0.98] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                      >
                        {isSubmitting || isLoading
                          ? "Launching your shop..."
                          : "Create shop & launch dashboard"}
                      </Button>
                      <span className="mt-1.5 text-right text-xs text-muted-foreground">
                        Your store goes live right after setup.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>

      <div className="hidden xl:col-span-3 xl:block">
        <div className="sticky top-8 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span className="text-xs font-semibold text-foreground">
              Live preview
            </span>
          </div>
          <ShopPreviewCard values={previewValues} />
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            This is exactly how your shop will look to students browsing
            campus listings.
          </p>
        </div>
      </div>
    </div>
  );
}
