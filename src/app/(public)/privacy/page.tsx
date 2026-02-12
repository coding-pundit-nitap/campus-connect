import {
  Baby,
  CheckCircle2,
  Cookie,
  Database,
  ExternalLink,
  Eye,
  FileText,
  History,
  Lock,
  Mail,
  Server,
  Share2,
  Shield,
  User,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy - Campus Connect | Data Protection & Security",
  description:
    "Learn how Campus Connect collects, uses, and protects your personal information. Our privacy policy covers data collection, security measures, user rights, and GDPR compliance at NIT AP.",
  keywords: [
    "campus connect privacy",
    "data protection",
    "privacy policy",
    "personal information security",
    "user data",
    "GDPR compliance",
    "data collection",
    "student privacy",
    "NIT AP privacy",
    "secure platform",
  ],
  authors: [{ name: "Coding Club @ NIT Arunachal Pradesh" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Privacy Policy - Campus Connect",
    description:
      "Transparent privacy practices for Campus Connect. Learn how we protect your personal data, what information we collect, and your privacy rights.",
    type: "website",
    locale: "en_IN",
    siteName: "Campus Connect",
  },
  twitter: {
    card: "summary",
    title: "Campus Connect Privacy Policy",
    description:
      "Learn about data protection and privacy practices at Campus Connect - NIT AP.",
  },
  alternates: {
    canonical: "/privacy",
  },
};

const TOC_LINKS = [
  { id: "intro", title: "Introduction" },
  { id: "collection", title: "Information We Collect" },
  { id: "usage", title: "How We Use Data" },
  { id: "sharing", title: "Sharing & Disclosure" },
  { id: "security", title: "Data Security" },
  { id: "rights", title: "Your Rights" },
  { id: "retention", title: "Data Retention" },
  { id: "cookies", title: "Cookies" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPolicyPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy - Campus Connect",
    description:
      "Comprehensive privacy policy detailing data collection, usage, and protection practices",
    url: "https://campusconnect.nitap.ac.in/privacy",
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
      name: "Privacy Policy",
      about: "Data protection and privacy practices",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LegalPageLayout
        title="Privacy Policy"
        description="We believe in transparency. Here is how we collect, use, and protect your data."
        lastUpdated="February 12, 2026"
        toc={TOC_LINKS}
      >
        <InfoSection title="1. Introduction" id="intro">
          <InfoCard icon={<Shield className="text-primary" />}>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Campus Connect, operated by{" "}
              <strong>Coding Club @ NIT Arunachal Pradesh</strong> (Coding
              Pundit). We are committed to protecting your personal information
              and your right to privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              use our platform.
            </p>
          </InfoCard>
        </InfoSection>

        <InfoSection title="2. Information We Collect" id="collection">
          <div className="grid gap-4">
            <InfoCard
              title="2.1 Personal Information"
              collapsible
              defaultOpen
              icon={<User className="text-blue-500" />}
            >
              <p className="mb-3 text-sm text-muted-foreground">
                We collect the following to create your account and fulfill
                orders:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong>Account Info:</strong> Name, NIT AP email address,
                  phone number, and password.
                </li>
                <li>
                  <strong>Delivery Info:</strong> Hostel block (e.g., Digaru,
                  Lohit), room number.
                </li>
                <li>
                  <strong>Order History:</strong> Products, transaction amounts,
                  and vendor reviews.
                </li>
                <li>
                  <strong>Payment Info:</strong> Transaction status (Note: We do
                  not store full card details; currently COD only).
                </li>
              </ul>
            </InfoCard>

            <InfoCard
              title="2.2 Automatically Collected Info"
              collapsible
              icon={<Server className="text-purple-500" />}
            >
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Device information (browser type, OS).</li>
                <li>IP address (for security and location verification).</li>
                <li>Usage patterns (which shops you visit, timestamps).</li>
              </ul>
            </InfoCard>

            <InfoCard
              title="2.3 Third-Party Authentication"
              collapsible
              icon={<Lock className="text-orange-500" />}
            >
              <p className="text-sm text-muted-foreground">
                If you sign in using services like <strong>Google OAuth</strong>{" "}
                (Institute Email), we collect your name, email, and profile
                picture as authorized by you.
              </p>
            </InfoCard>
          </div>
        </InfoSection>

        <InfoSection title="3. How We Use Your Information" id="usage">
          <InfoCard icon={<FileText className="text-green-600" />}>
            <ul className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">●</span> Order Processing &
                Batching
              </li>
              <li className="flex gap-2">
                <span className="text-primary">●</span> Delivery Notifications
              </li>
              <li className="flex gap-2">
                <span className="text-primary">●</span> Fraud Prevention
              </li>
              <li className="flex gap-2">
                <span className="text-primary">●</span> Platform Improvement
              </li>
              <li className="flex gap-2">
                <span className="text-primary">●</span> Legal Compliance
              </li>
              <li className="flex gap-2">
                <span className="text-primary">●</span> Account Management
              </li>
            </ul>
          </InfoCard>
        </InfoSection>

        <InfoSection title="4. Sharing & Disclosure" id="sharing">
          <div className="space-y-4">
            <InfoCard
              title="With Campus Vendors"
              icon={<Share2 className="text-blue-500" />}
            >
              <p className="text-sm text-muted-foreground">
                We share strictly necessary details (Name, Hostel Block, Room
                No, Order Items) with the specific vendor you ordered from so
                they can prepare and deliver your food.
              </p>
            </InfoCard>

            <InfoCard
              title="We Do NOT Sell Your Data"
              variant="success"
              icon={<CheckCircle2 className="text-green-600" />}
            >
              <p className="font-medium text-green-800 dark:text-green-300">
                Campus Connect does not sell, rent, or trade your personal
                information to third-party advertisers or data brokers.
              </p>
            </InfoCard>

            <div className="grid sm:grid-cols-2 gap-4">
              <InfoCard title="Service Providers" collapsible>
                <p className="text-xs text-muted-foreground">
                  We may share data with hosting providers (e.g., Vercel, AWS)
                  or analytics tools strictly for infrastructure maintenance.
                </p>
              </InfoCard>
              <InfoCard title="Legal Requirements" collapsible>
                <p className="text-xs text-muted-foreground">
                  We may disclose info if required by NIT Administration or Law
                  Enforcement in cases of illegal activity or safety threats.
                </p>
              </InfoCard>
            </div>
          </div>
        </InfoSection>

        <InfoSection title="5. Data Security" id="security">
          <InfoCard variant="default" icon={<Lock className="text-red-500" />}>
            <p className="mb-4 text-sm text-muted-foreground">
              We employ industry-standard security measures:
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted p-3 rounded text-center">
                HTTPS Encryption
              </div>
              <div className="bg-muted p-3 rounded text-center">
                Password Hashing (Bcrypt)
              </div>
              <div className="bg-muted p-3 rounded text-center">
                Rate Limiting
              </div>
              <div className="bg-muted p-3 rounded text-center">
                Secure Auth Tokens
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground italic">
              Note: While we strive for maximum security, no internet
              transmission is 100% secure.
            </p>
          </InfoCard>
        </InfoSection>

        <InfoSection title="6. Your Rights" id="rights">
          <InfoCard icon={<Eye className="text-primary" />}>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Access:</strong> Request a copy of your data.
                </li>
                <li>
                  <strong>Correction:</strong> Update your profile in Settings.
                </li>
                <li>
                  <strong>Deletion:</strong> Request account deletion (subject
                  to legal retention).
                </li>
                <li>
                  <strong>Portability:</strong> Get your order history in a
                  readable format.
                </li>
              </ul>
              <p className="pt-2">
                To exercise these rights, email us at{" "}
                <a
                  href="mailto:codingclub@nitap.ac.in"
                  className="text-primary hover:underline"
                >
                  codingclub@nitap.ac.in
                </a>
                .
              </p>
            </div>
          </InfoCard>
        </InfoSection>

        <InfoSection title="Other Policies" id="retention">
          <div className="grid gap-4">
            <InfoCard
              title="7. Data Retention"
              collapsible
              icon={<Database className="text-gray-500" />}
              id="retention"
            >
              <p className="text-sm text-muted-foreground">
                We retain personal info only as long as necessary. Order history
                is kept for accounting/legal purposes.
              </p>
            </InfoCard>

            <InfoCard
              title="8. Cookies"
              collapsible
              icon={<Cookie className="text-amber-600" />}
              id="cookies"
            >
              <p className="text-sm text-muted-foreground">
                We use cookies for session management (keeping you logged in).
                Disabling cookies may break platform functionality.
              </p>
            </InfoCard>

            <InfoCard
              title="9. Third-Party Links"
              collapsible
              icon={<ExternalLink className="text-blue-500" />}
            >
              <p className="text-sm text-muted-foreground">
                We are not responsible for the privacy practices of external
                sites linked from our platform.
              </p>
            </InfoCard>

            <InfoCard
              title="10. Children's Privacy"
              collapsible
              icon={<Baby className="text-pink-500" />}
            >
              <p className="text-sm text-muted-foreground">
                Campus Connect is for NIT AP students (18+). We do not knowingly
                collect data from minors.
              </p>
            </InfoCard>

            <InfoCard
              title="11. Updates"
              collapsible
              icon={<History className="text-primary" />}
            >
              <p className="text-sm text-muted-foreground">
                Policy updates will be reflected by the "Last Updated" date.
                Continued use implies acceptance.
              </p>
            </InfoCard>
          </div>
        </InfoSection>

        <InfoSection title="12. Contact Us" id="contact">
          <InfoCard variant="primary" icon={<Mail />}>
            <p className="mb-4 text-sm text-muted-foreground">
              Questions about your data?
            </p>
            <div className="space-y-1">
              <p className="font-semibold">
                Coding Club @ NIT Arunachal Pradesh
              </p>
              <Link
                href="mailto:codingclub@nitap.ac.in"
                className="text-primary hover:underline block"
              >
                codingclub@nitap.ac.in
              </Link>
            </div>
          </InfoCard>
        </InfoSection>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg text-center text-xs text-muted-foreground">
          By using Campus Connect, you acknowledge that you have read and
          understood this Privacy Policy.
        </div>
      </LegalPageLayout>
    </>
  );
}
