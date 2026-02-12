import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCcw,
  Scale,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy - Campus Connect | Order Returns",
  description:
    "Fair refund and cancellation policies for Campus Connect at NIT AP. Learn about order cancellation deadlines, refund eligibility, processing timelines, and dispute resolution.",
  keywords: [
    "campus connect refund",
    "cancellation policy",
    "order cancellation",
    "refund policy",
    "return policy",
    "money back",
    "order issues",
    "dispute resolution",
    "NIT AP refunds",
    "batch cancellation",
  ],
  authors: [{ name: "Coding Club @ NIT Arunachal Pradesh" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Refund & Cancellation Policy - Campus Connect",
    description:
      "Clear policies for order cancellations and refunds. Learn when you can cancel, how to request refunds, and dispute resolution procedures.",
    type: "website",
    locale: "en_IN",
    siteName: "Campus Connect",
  },
  twitter: {
    card: "summary",
    title: "Campus Connect Refund Policy",
    description:
      "Fair refund and cancellation policies for students and vendors at NIT AP.",
  },
  alternates: {
    canonical: "/refund-policy",
  },
};

const TOC_LINKS = [
  { id: "overview", title: "Overview" },
  { id: "cancellation", title: "Cancellation Policy" },
  { id: "refund", title: "Refund Policy" },
  { id: "request", title: "How to Request" },
  { id: "timeline", title: "Processing Timeline" },
  { id: "dispute", title: "Disputes" },
];

export default function RefundPolicyPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Refund & Cancellation Policy",
    description:
      "Comprehensive refund and cancellation policy covering order cancellations, refund eligibility, and dispute resolution",
    url: "https://campusconnect.nitap.ac.in/refund-policy",
    inLanguage: "en-IN",
    datePublished: "2026-02-12",
    dateModified: "2026-02-12",
    publisher: {
      "@type": "Organization",
      name: "Coding Club @ NIT Arunachal Pradesh",
      email: "codingclub@nitap.ac.in",
    },
    mainEntity: {
      "@type": "DigitalDocument",
      name: "Refund & Cancellation Policy",
      about: "Order cancellation rules and refund procedures",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LegalPageLayout
        title="Refund & Cancellation Policy"
        description="Fair policies designed for both students and campus vendors."
        lastUpdated="February 12, 2026"
        toc={TOC_LINKS}
      >
        <InfoSection title="1. Overview" id="overview">
          <InfoCard variant="default" icon={<Scale className="text-primary" />}>
            <p className="mb-3 text-muted-foreground leading-relaxed">
              Campus Connect operates as a platform facilitator. Our policies
              are designed to be fair to both buyers (Students) and vendors
              (Lower Market Shops), considering the unique nature of our batch
              delivery system.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg border text-sm text-muted-foreground">
              <strong>General Approach:</strong> Requests are evaluated on a{" "}
              <strong>case-by-case basis</strong>, taking into account order
              status, preparation time, and proof of issue.
            </div>
          </InfoCard>
        </InfoSection>

        <InfoSection title="2. Cancellation Policy" id="cancellation">
          <div className="grid gap-4">
            <InfoCard
              title="2.1 Before Batch Closes"
              variant="success"
              icon={<CheckCircle2 className="text-green-600" />}
            >
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                ✅ Cancellation Usually Allowed
              </p>
              <p className="text-sm text-muted-foreground">
                If you cancel before the batch closes and the order hasn't been
                batched yet, cancellation is typically granted instantly without
                penalty.
              </p>
            </InfoCard>

            <InfoCard
              title="2.2 After Batch Closes"
              variant="warning"
              icon={<AlertTriangle className="text-amber-600" />}
            >
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                ⚠️ Requires Vendor Approval
              </p>
              <p className="text-sm text-muted-foreground">
                The vendor may have already started preparing your food.
                Cancellation depends entirely on their approval.
              </p>
            </InfoCard>

            <InfoCard
              title="2.3 Out for Delivery"
              variant="danger"
              icon={<XCircle className="text-red-600" />}
            >
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                ❌ Cancellation Not Allowed
              </p>
              <p className="text-sm text-muted-foreground">
                The vendor has already climbed the hill. You are responsible for
                accepting and paying for the order.
              </p>
            </InfoCard>
          </div>
        </InfoSection>

        <InfoSection title="3. Refund Policy" id="refund">
          <div className="grid md:grid-cols-2 gap-6">
            <InfoCard
              title="Eligible for Refund"
              icon={<CheckCircle2 className="text-green-500" />}
            >
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-green-500">●</span> Order not delivered
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">●</span> Wrong item received
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">●</span> Spoiled/Damaged food
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">●</span> Missing items
                  (Partial refund)
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">●</span> Duplicate payment
                  charged
                </li>
              </ul>
            </InfoCard>

            <InfoCard
              title="Not Eligible"
              variant="default"
              icon={<XCircle className="text-red-500" />}
            >
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-red-500">●</span> Change of mind after
                  prep
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">●</span> Personal taste
                  preference
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">●</span> You were unavailable
                  to collect
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">●</span> Incorrect hostel
                  address provided
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">●</span> OTP already verified
                </li>
              </ul>
            </InfoCard>
          </div>
        </InfoSection>

        <InfoSection title="4. How to Request a Refund" id="request">
          <InfoCard variant="info" icon={<Clock className="text-blue-600" />}>
            <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Time Limit: 24 Hours
            </p>
            <p className="text-sm text-muted-foreground">
              For food quality issues, you must report the issue within 24 hours
              of delivery for a valid claim.
            </p>
          </InfoCard>

          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-lg">Steps to Follow:</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { step: "1", text: "Go to 'My Orders' & find the order." },
                { step: "2", text: "Click 'Report Issue' button." },
                { step: "3", text: "Select reason & upload photos." },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-4 border rounded-lg bg-card"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-2">
                    {item.step}
                  </div>
                  <p className="text-sm">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Our support team will review your request and respond within{" "}
              <strong>2-3 business days</strong>.
            </p>
          </div>
        </InfoSection>

        <InfoSection title="5. Refund Processing Timeline" id="timeline">
          <InfoCard
            title="Current Method: Cash on Delivery"
            icon={<RefreshCcw className="text-gray-500" />}
          >
            <p className="text-sm text-muted-foreground mb-2">
              Since we use COD, "refunds" are processed as:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>
                <strong>Wallet Credit:</strong> Added to your Campus Connect
                account for next time.
              </li>
              <li>
                <strong>Manual Transfer:</strong> In rare cases, via UPI from
                the admin.
              </li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="6. Dispute Resolution" id="dispute">
          <InfoCard icon={<ShieldCheck className="text-primary" />}>
            <p className="text-sm text-muted-foreground mb-4">
              If your request is denied and you feel it was unfair, you can
              escalate the issue.
            </p>
            <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2">
              <li>
                <strong>Contact Support:</strong> Email{" "}
                <a
                  href="mailto:codingclub@nitap.ac.in"
                  className="text-primary hover:underline"
                >
                  codingclub@nitap.ac.in
                </a>{" "}
                with Order ID.
              </li>
              <li>
                <strong>Mediation:</strong> Our team will talk to the vendor on
                your behalf.
              </li>
              <li>
                <strong>Final Decision:</strong> Campus Connect admin decision
                is final based on evidence.
              </li>
            </ol>
          </InfoCard>
        </InfoSection>

        <InfoSection title="7. Prevention Tips" id="tips">
          <InfoCard
            variant="default"
            title="Avoid Issues"
            icon={<AlertOctagon className="text-purple-500" />}
          >
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span>
                  <strong>Be Available:</strong> Don't make the vendor wait at
                  the drop point.
                </span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span>
                  <strong>Check Address:</strong> Ensure Hostel Block & Room No
                  are correct.
                </span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span>
                  <strong>Verify Items:</strong> Check food before sharing OTP.
                </span>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span>
                  <strong>Order Early:</strong> Give vendors time to prep.
                </span>
              </div>
            </div>
          </InfoCard>
        </InfoSection>

        <InfoSection title="8. Contact Us" id="contact">
          <div className="bg-muted/30 border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-background rounded-full border shadow-sm">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">
                  Have questions about a refund?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Email us with Subject: "Refund Request - Order #[ID]"
                </p>
              </div>
            </div>
            <Link
              href="mailto:codingclub@nitap.ac.in"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Email Support
            </Link>
          </div>
        </InfoSection>

        <div className="mt-8 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          By placing an order on Campus Connect, you acknowledge that you have
          read and understood this Refund & Cancellation Policy. This policy is
          subject to our{" "}
          <Link href="/terms" className="underline hover:text-primary">
            Terms & Conditions
          </Link>
          .
        </div>
      </LegalPageLayout>
    </>
  );
}
