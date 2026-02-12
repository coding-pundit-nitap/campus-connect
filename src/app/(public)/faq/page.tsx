import {
  Banknote,
  Clock,
  CreditCard,
  HelpCircle,
  MapPin,
  RefreshCcw,
  Search,
  Settings,
  Store,
  Truck,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "FAQ - Campus Connect | Frequently Asked Questions",
  description:
    "Find answers to common questions about Campus Connect's batch delivery system, orders, payments, cancellations, refunds, and vendor services at NIT Arunachal Pradesh.",
  keywords: [
    "campus connect faq",
    "batch delivery explained",
    "how campus connect works",
    "delivery questions",
    "payment methods",
    "order cancellation",
    "refund policy",
    "vendor registration",
    "NIT AP food delivery",
    "student questions",
  ],
  authors: [{ name: "Coding Club @ NIT Arunachal Pradesh" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Frequently Asked Questions - Campus Connect",
    description:
      "Get answers about batch delivery, minimum order value, payment methods, cancellations, and more. Learn how Campus Connect works at NIT AP.",
    type: "website",
    locale: "en_IN",
    siteName: "Campus Connect",
  },
  twitter: {
    card: "summary",
    title: "Campus Connect FAQ",
    description:
      "Common questions about NIT AP's batch delivery platform answered.",
  },
  alternates: {
    canonical: "/faq",
  },
};

const TOC_LINKS = [
  { id: "general", title: "General Questions" },
  { id: "orders", title: "Orders & Delivery" },
  { id: "payments", title: "Payments" },
  { id: "refunds", title: "Cancellations & Refunds" },
  { id: "account", title: "Account & Technical" },
  { id: "vendors", title: "For Vendors" },
];

export default function FAQPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Campus Connect?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Campus Connect is a hyper-local e-commerce platform that bridges the 'Altitude Gap' between campus vendors (Lower Market) and student hostels (Hostel Blocks) at NIT Arunachal Pradesh using a smart batch delivery system.",
        },
      },
      {
        "@type": "Question",
        name: "What is Batch Delivery?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Instead of individual deliveries, we group orders into scheduled time slots (e.g., 5:00 PM). This allows vendors to deliver many orders in one trip, making the 100m climb profitable.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods are accepted?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Currently, we only support Cash on Delivery (COD). Please pay the vendor directly when you receive your order. UPI integration is on our roadmap.",
        },
      },
      {
        "@type": "Question",
        name: "Can I cancel my order?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Before batch closes: Usually allowed instantly. After batch closes: Requires vendor approval. Out for Delivery: Not allowed.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LegalPageLayout
        title="Frequently Asked Questions"
        description="Quick answers to the most common questions about Campus Connect."
        toc={TOC_LINKS}
      >
        <InfoSection title="General Questions" id="general">
          <InfoCard
            title="What is Campus Connect?"
            collapsible
            defaultOpen
            icon={<HelpCircle className="text-primary" />}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              Campus Connect is a hyper-local e-commerce platform that bridges
              the <strong>&quot;Altitude Gap&quot;</strong> between campus
              vendors (Lower Market) and student hostels (Hostel Blocks) at NIT
              Arunachal Pradesh. We use a smart batch delivery system to make
              vendor deliveries efficient and profitable.
            </p>
          </InfoCard>

          <InfoCard
            title="Who can use Campus Connect?"
            collapsible
            icon={<Settings className="text-blue-500" />}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              Campus Connect is designed exclusively for students, faculty, and
              authorized members of the NIT Arunachal Pradesh community. You
              must have a valid campus email or affiliation to register.
            </p>
          </InfoCard>

          <InfoCard
            title="Is there a delivery fee?"
            collapsible
            icon={<Banknote className="text-green-500" />}
          >
            <p className="text-sm text-muted-foreground mb-2">
              Yes. The total price includes three components:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>
                <strong>Item Total:</strong> Cost of the products.
              </li>
              <li>
                <strong>Delivery/Climb Fee:</strong> Goes directly to the vendor
                for the effort.
              </li>
              <li>
                <strong>Platform Fee:</strong> A small fee for system
                maintenance.
              </li>
            </ul>
          </InfoCard>

          <InfoCard
            title="How is this different from Swiggy/Zomato?"
            collapsible
            icon={<Search className="text-purple-500" />}
          >
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
              <li>
                <strong>No third-party runners:</strong> Vendors deliver their
                own orders.
              </li>
              <li>
                <strong>Batch System:</strong> Orders are grouped into time
                slots (e.g., Lunch Batch) rather than on-demand.
              </li>
              <li>
                <strong>Campus Exclusive:</strong> Built specifically for NIT
                AP's unique geography.
              </li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="Orders & Delivery" id="orders">
          <InfoCard
            title="What is 'Batch Delivery'?"
            collapsible
            icon={<Truck className="text-orange-500" />}
          >
            <p className="text-sm text-muted-foreground mb-3">
              Instead of individual deliveries, we group orders into scheduled
              time slots (e.g., 5:00 PM). This allows vendors to deliver many
              orders in one trip, making the 100m climb profitable.
            </p>
            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground border">
              Instead of "30 mins ETA", you will see{" "}
              <strong>"Next Batch: 5:00 PM"</strong>.
            </div>
          </InfoCard>

          <InfoCard
            title="How long does delivery take?"
            collapsible
            icon={<Clock className="text-blue-500" />}
          >
            <p className="text-sm text-muted-foreground">
              Delivery times depend on the vendor's batch schedule. Typical
              windows are Lunch (12-1 PM) and Dinner (6-8 PM). You choose your
              preferred batch slot during checkout.
            </p>
          </InfoCard>

          <InfoCard
            title="What is Minimum Order Value (MOV)?"
            collapsible
            icon={<Banknote className="text-green-500" />}
          >
            <p className="text-sm text-muted-foreground">
              MOV is the minimum amount you must spend to place an order.
              Vendors set this (e.g., ₹50) because it is not economical to climb
              100m for a small ₹10 order.
            </p>
          </InfoCard>

          <InfoCard
            title="Where do I collect my order?"
            collapsible
            icon={<MapPin className="text-red-500" />}
          >
            <p className="text-sm text-muted-foreground">
              Vendors deliver to designated drop points near your hostel block.
              You will receive a notification when the vendor arrives.
            </p>
          </InfoCard>
        </InfoSection>

        <InfoSection title="Payments" id="payments">
          <InfoCard
            title="Payment Methods"
            collapsible
            icon={<CreditCard className="text-primary" />}
          >
            <p className="text-sm text-muted-foreground">
              Currently, we only support <strong>Cash on Delivery (COD)</strong>
              . Please pay the vendor directly when you receive your order. UPI
              integration is on our roadmap.
            </p>
          </InfoCard>

          <InfoCard
            title="When do I pay?"
            collapsible
            icon={<Clock className="text-blue-500" />}
          >
            <p className="text-sm text-muted-foreground">
              Payment happens <strong>on delivery</strong>. Please have exact
              change ready if possible. Do not share the delivery OTP until you
              have paid and received your items.
            </p>
          </InfoCard>
        </InfoSection>

        <InfoSection title="Cancellations & Refunds" id="refunds">
          <InfoCard
            title="Can I cancel my order?"
            collapsible
            variant="warning"
            icon={<RefreshCcw className="text-amber-600" />}
          >
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-muted-foreground">
                  <strong>Before batch closes:</strong> Usually allowed
                  instantly.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-600 font-bold">!</span>
                <span className="text-muted-foreground">
                  <strong>After batch closes:</strong> Requires vendor approval
                  (as prep may have started).
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-600 font-bold">✕</span>
                <span className="text-muted-foreground">
                  <strong>Out for Delivery:</strong> Not allowed.
                </span>
              </li>
            </ul>
          </InfoCard>

          <InfoCard
            title="How do I request a refund?"
            collapsible
            icon={<HelpCircle className="text-blue-500" />}
          >
            <p className="text-sm text-muted-foreground mb-2">
              Go to <strong>My Orders</strong> → Find Order → Click{" "}
              <strong>Report Issue</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Provide details and photos if applicable. Our support team reviews
              requests within 2-3 business days.
            </p>
          </InfoCard>
        </InfoSection>

        <InfoSection title="Account & Technical" id="account">
          <InfoCard
            title="Website is slow / not loading"
            collapsible
            icon={<Settings className="text-gray-500" />}
          >
            <p className="text-sm text-muted-foreground mb-2">
              Try these steps:
            </p>
            <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
              <li>Refresh the page.</li>
              <li>Clear browser cache/cookies.</li>
              <li>
                Check your internet connection (Hostel WiFi can be spotty!).
              </li>
            </ol>
          </InfoCard>
        </InfoSection>

        <InfoSection title="For Vendors" id="vendors">
          <InfoCard
            title="How do I join as a vendor?"
            collapsible
            icon={<Store className="text-primary" />}
          >
            <p className="text-sm text-muted-foreground">
              Email us at{" "}
              <a
                href="mailto:codingclub@nitap.ac.in"
                className="text-primary hover:underline"
              >
                codingclub@nitap.ac.in
              </a>{" "}
              with subject "Vendor Registration - [Shop Name]". We will guide
              you through the onboarding.
            </p>
          </InfoCard>

          <InfoCard
            title="How do I get paid?"
            collapsible
            icon={<Banknote className="text-green-500" />}
          >
            <p className="text-sm text-muted-foreground">
              With Cash on Delivery, you collect cash directly from students.
              The platform fee is calculated and billed to you periodically.
            </p>
          </InfoCard>
        </InfoSection>

        <InfoSection title="Still Have Questions? 🤔">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold mb-3">
              Can&apos;t find the answer you&apos;re looking for?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Contact Support
              </Link>
              <Link
                href="mailto:codingclub@nitap.ac.in"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Email Us
              </Link>
            </div>
          </div>
        </InfoSection>
      </LegalPageLayout>
    </>
  );
}
