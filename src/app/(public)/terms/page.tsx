import {
  AlertTriangle,
  Copyright,
  CreditCard,
  FileText,
  Gavel,
  LayoutGrid,
  Mail,
  MessageSquare,
  Scale,
  ShieldAlert,
  Store,
  Truck,
  UserCheck,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions - Campus Connect | NIT Arunachal Pradesh",
  description:
    "Read the complete Terms and Conditions for using Campus Connect, the batch delivery platform for NIT AP. Learn about user responsibilities, order policies, vendor relationships, and legal agreements.",
  keywords: [
    "campus connect terms",
    "terms and conditions",
    "user agreement",
    "NIT AP policies",
    "batch delivery terms",
    "campus food delivery rules",
    "student platform guidelines",
    "vendor terms",
    "order policies",
    "legal agreement NIT AP",
  ],
  authors: [{ name: "Coding Club @ NIT Arunachal Pradesh" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Terms & Conditions - Campus Connect",
    description:
      "Complete terms of service for Campus Connect platform. Learn about user eligibility, order policies, delivery fulfillment, and legal agreements for NIT AP students and vendors.",
    type: "website",
    locale: "en_IN",
    siteName: "Campus Connect",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Campus Connect Terms & Conditions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms & Conditions - Campus Connect",
    description:
      "Read the Terms and Conditions for using Campus Connect, the smart batch delivery platform for NIT Arunachal Pradesh.",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/terms",
  },
};

const TOC_LINKS = [
  { id: "acceptance", title: "1. Acceptance" },
  { id: "eligibility", title: "2. Eligibility" },
  { id: "overview", title: "3. Platform Overview" },
  { id: "responsibilities", title: "4. User Responsibilities" },
  { id: "orders", title: "5. Orders & Payments" },
  { id: "delivery", title: "6. Delivery" },
  { id: "vendors", title: "7. Vendor Relations" },
  { id: "content", title: "8. User Content" },
  { id: "liability", title: "9. Liability" },
  { id: "termination", title: "10. Termination" },
  { id: "contact", title: "11. Contact" },
];

export default function TermsPage() {
  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms & Conditions - Campus Connect",
    description:
      "Complete terms of service and user agreement for Campus Connect platform at NIT Arunachal Pradesh",
    url: "https://campusconnect.nitap.ac.in/terms",
    inLanguage: "en-IN",
    isPartOf: {
      "@type": "WebSite",
      name: "Campus Connect",
      url: "https://campusconnect.nitap.ac.in",
    },
    about: {
      "@type": "Thing",
      name: "Terms of Service",
      description:
        "Legal terms and conditions for using Campus Connect food delivery platform",
    },
    datePublished: "2026-02-12",
    dateModified: "2026-02-12",
    publisher: {
      "@type": "Organization",
      name: "Coding Club @ NIT Arunachal Pradesh",
      email: "codingclub@nitap.ac.in",
    },
    mainEntity: {
      "@type": "DigitalDocument",
      name: "Campus Connect Terms & Conditions",
      description:
        "Legal agreement covering user eligibility, platform usage, order policies, delivery terms, and vendor relationships",
      datePublished: "2026-02-12",
      inLanguage: "en-IN",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LegalPageLayout
        title="Terms & Conditions"
        description="Please read these terms carefully before using Campus Connect."
        lastUpdated="February 12, 2026"
        toc={TOC_LINKS}
      >
        <InfoSection title="1. Acceptance of Terms" id="acceptance">
          <InfoCard
            variant="default"
            icon={<FileText className="text-primary" />}
          >
            <p className="mb-3 text-muted-foreground">
              By accessing and using Campus Connect ("the Platform"), you agree
              to be bound by these Terms. If you do not agree, please do not use
              the Platform.
            </p>
            <p className="text-sm text-muted-foreground">
              Campus Connect is operated by{" "}
              <strong>Coding Club @ NIT Arunachal Pradesh</strong> (Coding
              Pundit) and is intended exclusively for the NIT AP community.
            </p>
          </InfoCard>
        </InfoSection>

        <InfoSection title="2. User Eligibility" id="eligibility">
          <InfoCard
            collapsible
            defaultOpen
            icon={<UserCheck className="text-blue-500" />}
            title="Who can use this?"
          >
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>
                Current student / faculty / staff of NIT Arunachal Pradesh.
              </li>
              <li>At least 18 years old.</li>
              <li>
                Able to provide accurate registration data (Institute Email).
              </li>
              <li>Responsible for maintaining account confidentiality.</li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="3. Platform Overview" id="overview">
          <InfoCard
            collapsible
            icon={<LayoutGrid className="text-purple-500" />}
            title="How it works"
          >
            <p className="mb-2 text-sm text-muted-foreground">
              Campus Connect is a hyper-local e-commerce platform connecting
              Lower Market vendors with Hostel Blocks via:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>Batch Delivery:</strong> Orders grouped into time slots.
              </li>
              <li>
                <strong>Vendor Self-Delivery:</strong> Vendors deliver their own
                orders; no third-party runners.
              </li>
              <li>
                <strong>Campus-Only:</strong> Services restricted to NIT AP
                campus geography.
              </li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="4. User Responsibilities" id="responsibilities">
          <div className="grid gap-4">
            <InfoCard
              title="Account Security"
              collapsible
              icon={<ShieldAlert className="text-orange-500" />}
            >
              <p className="text-sm text-muted-foreground">
                You are responsible for all activity under your account. Notify
                us immediately of unauthorized access. Do not share credentials.
              </p>
            </InfoCard>

            <InfoCard
              title="Prohibited Activities"
              variant="danger"
              collapsible
              icon={<AlertTriangle className="text-red-500" />}
            >
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Using the platform for illegal purposes.</li>
                <li>Placing fake/fraudulent orders.</li>
                <li>Harassing vendors or other students.</li>
                <li>Attempting to hack/scrape the platform.</li>
                <li>Abusing the review system.</li>
              </ul>
            </InfoCard>
          </div>
        </InfoSection>

        <InfoSection title="5. Orders & Payments" id="orders">
          <InfoCard
            collapsible
            title="Order Placement & Pricing"
            icon={<CreditCard className="text-green-500" />}
          >
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>
                Orders must meet the vendor's{" "}
                <strong>Minimum Order Value (MOV)</strong>.
              </li>
              <li>
                <strong>Total Price</strong> = Item Cost + Delivery/Climb Fee +
                Platform Fee.
              </li>
              <li>Prices are locked at the time of order placement.</li>
              <li>
                <strong>Payment:</strong> Currently Cash on Delivery (COD) only.
              </li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="6. Delivery Fulfillment" id="delivery">
          <InfoCard
            collapsible
            title="Batch System & OTP"
            icon={<Truck className="text-blue-600" />}
          >
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Batches:</strong> Delivery follows vendor-defined
                schedules (e.g., 5 PM Batch). Times are estimates.
              </li>
              <li>
                <strong>Location:</strong> You must be present at the hostel
                block drop point.
              </li>
              <li>
                <strong>OTP Verification:</strong> You must provide the OTP to
                the vendor <em>only after</em> receiving items.
              </li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="7. Vendor Relationship" id="vendors">
          <InfoCard
            collapsible
            title="Platform Role"
            icon={<Store className="text-amber-500" />}
          >
            <p className="text-sm text-muted-foreground mb-2">
              Campus Connect is a <strong>facilitator</strong>. We do not own or
              cook the food.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Vendors are independent third parties.</li>
              <li>
                Vendors are solely responsible for food quality and safety.
              </li>
              <li>We are not liable for vendor delays or product defects.</li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="8. Reviews & Content" id="content">
          <InfoCard
            collapsible
            title="Guidelines"
            icon={<MessageSquare className="text-pink-500" />}
          >
            <p className="text-sm text-muted-foreground mb-2">
              Reviews must be honest and based on real purchases.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>We remove content that is:</strong> Abusive,
              discriminatory, false, spam, or contains personal attacks.
            </p>
          </InfoCard>
        </InfoSection>

        <InfoSection title="9. Limitation of Liability" id="liability">
          <InfoCard
            variant="default"
            icon={<Scale className="text-gray-500" />}
          >
            <p className="mb-2 text-sm text-muted-foreground font-semibold">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Service provided "AS IS" without warranties.</li>
              <li>
                We are not liable for indirect damages or food safety issues.
              </li>
              <li>
                Total liability limited to the specific transaction amount.
              </li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="10. Legal Miscellaneous" id="termination">
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard
              title="Intellectual Property"
              collapsible
              icon={<Copyright className="w-4 h-4" />}
            >
              <p className="text-xs text-muted-foreground">
                All platform content is owned by Coding Club. Product images
                owned by vendors. Do not copy without permission.
              </p>
            </InfoCard>
            <InfoCard
              title="Termination"
              collapsible
              icon={<AlertTriangle className="w-4 h-4" />}
            >
              <p className="text-xs text-muted-foreground">
                We may suspend accounts for violating terms, fraud, or leaving
                the institute.
              </p>
            </InfoCard>
            <InfoCard
              title="Governing Law"
              collapsible
              icon={<Gavel className="w-4 h-4" />}
            >
              <p className="text-xs text-muted-foreground">
                Governed by laws of India. Jurisdiction: Courts in Arunachal
                Pradesh.
              </p>
            </InfoCard>
            <InfoCard
              title="Updates"
              collapsible
              icon={<FileText className="w-4 h-4" />}
            >
              <p className="text-xs text-muted-foreground">
                Terms may change. Continued use implies acceptance of new terms.
              </p>
            </InfoCard>
          </div>
        </InfoSection>

        <InfoSection title="11. Contact Us" id="contact">
          <InfoCard variant="primary" icon={<Mail />}>
            <p className="mb-2 text-sm text-muted-foreground">
              Questions about these Terms?
            </p>
            <div className="space-y-1">
              <Link
                href="mailto:codingclub@nitap.ac.in"
                className="text-primary font-medium hover:underline block"
              >
                codingclub@nitap.ac.in
              </Link>
              <p className="text-sm text-muted-foreground">
                Coding Club @ NIT Arunachal Pradesh
              </p>
            </div>
          </InfoCard>
        </InfoSection>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center text-xs text-muted-foreground border">
          By using Campus Connect, you acknowledge that you have read,
          understood, and agree to be bound by these Terms and Conditions.
        </div>
      </LegalPageLayout>
    </>
  );
}
