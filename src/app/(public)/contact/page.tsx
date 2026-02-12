import {
  Briefcase,
  Clock,
  Copy,
  FileText,
  HelpCircle,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  RefreshCcw,
  ScrollText,
  ShieldAlert,
  ShoppingBag,
  Store,
  UserCog,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "Contact Us - Campus Connect | Support & Help Center",
  description:
    "Get in touch with Campus Connect support team at NIT Arunachal Pradesh. Email us at codingclub@nitap.ac.in for order issues, vendor inquiries, account help, and general questions.",
  keywords: [
    "campus connect contact",
    "support email",
    "customer service",
    "coding club NIT AP",
    "order help",
    "vendor support",
    "account assistance",
    "campus connect help",
    "NIT AP contact",
    "student support",
  ],
  authors: [{ name: "Coding Club @ NIT Arunachal Pradesh" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Contact Campus Connect Support",
    description:
      "Need help with orders, account, or vendor inquiries? Contact Campus Connect support at codingclub@nitap.ac.in. We're here to help NIT AP students and vendors.",
    type: "website",
    locale: "en_IN",
    siteName: "Campus Connect",
  },
  twitter: {
    card: "summary",
    title: "Contact Campus Connect",
    description:
      "Get support for Campus Connect - NIT AP's batch delivery platform. Email: codingclub@nitap.ac.in",
  },
  alternates: {
    canonical: "/contact",
  },
};

const TOC_LINKS = [
  { id: "primary", title: "Primary Contact" },
  { id: "quick-links", title: "Quick Links" },
  { id: "support-areas", title: "Support Areas" },
  { id: "template", title: "Email Template" },
  { id: "hours", title: "Support Hours" },
  { id: "security", title: "Security & Business" },
  { id: "location", title: "Location" },
];

export default function ContactPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Campus Connect",
    url: "https://campusconnect.nitap.ac.in/contact",
    mainEntity: {
      "@type": "Organization",
      name: "Campus Connect - Coding Club @ NIT Arunachal Pradesh",
      email: "codingclub@nitap.ac.in",
      address: {
        "@type": "PostalAddress",
        streetAddress: "NIT Arunachal Pradesh",
        addressLocality: "Yupia",
        addressRegion: "Arunachal Pradesh",
        postalCode: "791112",
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "codingclub@nitap.ac.in",
        contactType: "Customer Support",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LegalPageLayout
        title="Contact Us"
        description="Have questions or need assistance? We're here to help!"
        toc={TOC_LINKS}
      >
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div id="primary">
            <InfoCard
              title="Primary Contact"
              variant="primary"
              icon={<Mail className="text-primary" />}
            >
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Support Email
                  </p>
                  <Link
                    href="mailto:codingclub@nitap.ac.in"
                    className="text-xl font-semibold text-primary hover:underline flex items-center gap-2"
                  >
                    codingclub@nitap.ac.in
                  </Link>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Organization
                  </p>
                  <p className="font-medium text-foreground">
                    Coding Club @ NIT Arunachal Pradesh
                  </p>
                  <p className="text-sm text-muted-foreground">
                    (Coding Pundit)
                  </p>
                </div>
              </div>
            </InfoCard>
          </div>

          <div id="quick-links">
            <InfoCard title="Quick Links" icon={<FileText />}>
              <ul className="space-y-3">
                {[
                  {
                    href: "/faq",
                    icon: HelpCircle,
                    label: "Frequently Asked Questions",
                  },
                  {
                    href: "/terms",
                    icon: ScrollText,
                    label: "Terms & Conditions",
                  },
                  { href: "/privacy", icon: Lock, label: "Privacy Policy" },
                  {
                    href: "/refund-policy",
                    icon: RefreshCcw,
                    label: "Refund & Cancellation Policy",
                  },
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={{ pathname: link.href }}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-primary"
                    >
                      <link.icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </div>
        </div>

        {/* Support Areas Grid */}
        <InfoSection title="What Can We Help You With?" id="support-areas">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: <ShoppingBag className="text-blue-500" />,
                title: "Order Issues",
                items: [
                  "Order not delivered",
                  "Wrong item received",
                  "Missing items",
                  "Refund status",
                ],
                subject: "Order Issue - #[ORDER_ID]",
              },
              {
                icon: <UserCog className="text-purple-500" />,
                title: "Account Problems",
                items: [
                  "Login issues",
                  "Account verification",
                  "Profile updates",
                  "Deletion requests",
                ],
                subject: "Account Help - [ISSUE]",
              },
              {
                icon: <Store className="text-amber-500" />,
                title: "Vendor Inquiries",
                items: [
                  "Register as a vendor",
                  "Shop management",
                  "Payment queries",
                  "Dashboard help",
                ],
                subject: "Vendor Support - [SHOP_NAME]",
              },
              {
                icon: <MessageSquare className="text-green-500" />,
                title: "General Questions",
                items: [
                  "Platform features",
                  "Feedback",
                  "Bug reports",
                  "Partnerships",
                ],
                subject: "General Inquiry",
              },
            ].map((category, idx) => (
              <div
                key={idx}
                className="border rounded-xl p-5 bg-card hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-muted rounded-full">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{category.title}</h3>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground mb-4 pl-1">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="text-xs bg-muted/50 p-2 rounded border border-dashed text-muted-foreground">
                  <strong>Subject:</strong> {category.subject}
                </div>
              </div>
            ))}
          </div>
        </InfoSection>

        <InfoSection title="How to Contact Us Effectively" id="template">
          <div className="grid lg:grid-cols-2 gap-6">
            <InfoCard
              variant="info"
              title="Checklist"
              icon={<FileText className="text-blue-600" />}
            >
              <p className="mb-4 text-sm text-muted-foreground">
                For faster resolution, please include:
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  "Order ID (if applicable)",
                  "Account Email / Phone",
                  "Detailed description",
                  "Screenshots (if visual bug)",
                  "Time/Date of issue",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </InfoCard>

            <div className="rounded-xl border bg-muted/30 p-5 relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-background border px-2 py-1 rounded flex items-center gap-1 text-muted-foreground">
                  <Copy className="w-3 h-3" /> Copy Template
                </span>
              </div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Template
              </h3>
              <div className="font-mono text-xs md:text-sm bg-card p-4 rounded-lg border text-muted-foreground leading-relaxed">
                <p>
                  <strong>To:</strong> codingclub@nitap.ac.in
                </p>
                <p>
                  <strong>Subject:</strong> [Issue Type] - [Brief Description]
                </p>
                <div className="my-4 h-px bg-border" />
                <p>Hello Team,</p>
                <br />
                <p>[Describe your issue here...]</p>
                <br />
                <p>Order ID: #12345</p>
                <p>My Email: example@nitap.ac.in</p>
                <br />
                <p>Thanks,</p>
                <p>[Your Name]</p>
              </div>
            </div>
          </div>
        </InfoSection>

        <InfoSection title="Other Inquiries" id="security">
          <div className="grid gap-6">
            <InfoCard
              variant="danger"
              title="Report Security Issues"
              icon={<ShieldAlert className="text-red-600" />}
            >
              <p className="text-sm text-muted-foreground mb-4">
                If you discover a vulnerability, please report it immediately.
                Do not disclose publically.
              </p>
              <Link
                href="mailto:codingclub@nitap.ac.in?subject=SECURITY%20ALERT"
                className="text-sm font-bold text-red-600 underline hover:text-red-700"
              >
                codingclub@nitap.ac.in
              </Link>
            </InfoCard>

            <InfoCard
              variant="default"
              title="Business Inquiries"
              icon={<Briefcase />}
            >
              <p className="text-sm text-muted-foreground mb-4">
                For vendor partnerships, sponsorships, or collaborations.
              </p>
              <Link
                href="mailto:codingclub@nitap.ac.in?subject=Business%20Inquiry"
                className="text-sm font-medium text-primary hover:underline"
              >
                Email us with subject "Business Inquiry"
              </Link>
            </InfoCard>
          </div>
        </InfoSection>

        <InfoSection title="Location" id="location">
          <div className="flex items-start gap-4 p-6 bg-muted/30 rounded-xl border">
            <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">NIT Arunachal Pradesh</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yupia, Papum Pare District
                <br />
                Arunachal Pradesh, India - 791112
              </p>
              <p className="text-xs text-muted-foreground mt-4 italic">
                Note: Campus Connect is an online platform. Please email us to
                schedule in-person meetings.
              </p>
            </div>
          </div>
        </InfoSection>

        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
          <Link
            href="mailto:codingclub@nitap.ac.in"
            className="inline-flex items-center justify-center h-10 px-8 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Send us an Email
          </Link>
        </div>
      </LegalPageLayout>
    </>
  );
}
