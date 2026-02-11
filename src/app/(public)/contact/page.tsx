import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Campus Connect support team for help with orders, vendor inquiries, or general questions.",
};

export default function ContactPage() {
  return (
    <LegalPageLayout
      title="Contact Us"
      description="Have questions or need assistance? We're here to help!"
      lastUpdated=""
    >
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <InfoCard variant="primary">
          <h2 className="text-xl font-semibold mb-4">📬 Primary Contact</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <Link
                href={{ pathname: "mailto:codingclub@nitap.ac.in" }}
                className="text-lg font-medium text-primary hover:underline"
              >
                codingclub@nitap.ac.in
              </Link>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="font-medium">Coding Club @ NIT Arunachal Pradesh</p>
              <p className="text-sm">(Coding Pundit)</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard variant="default">
          <h2 className="text-xl font-semibold mb-4">🔗 Quick Links</h2>
          <ul className="space-y-3">
            <li>
              <Link
                href={{ pathname: "/faq" }}
                className="text-primary hover:underline flex items-center gap-2"
              >
                <span>❓</span>
                <span>Frequently Asked Questions</span>
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: "/terms" }}
                className="text-primary hover:underline flex items-center gap-2"
              >
                <span>📜</span>
                <span>Terms &amp; Conditions</span>
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: "/privacy" }}
                className="text-primary hover:underline flex items-center gap-2"
              >
                <span>🔒</span>
                <span>Privacy Policy</span>
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: "/refund-policy" }}
                className="text-primary hover:underline flex items-center gap-2"
              >
                <span>💰</span>
                <span>Refund &amp; Cancellation Policy</span>
              </Link>
            </li>
          </ul>
        </InfoCard>
      </div>

      <InfoSection title="What Can We Help You With?">
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: "🛒",
              title: "Order-Related Issues",
              items: [
                "Order not delivered",
                "Wrong item received",
                "Missing items",
                "Cancellation requests",
                "Refund status inquiries",
              ],
              subject: "Order Issue - #[ORDER_ID]",
            },
            {
              icon: "👤",
              title: "Account Problems",
              items: [
                "Login issues",
                "Account verification",
                "Profile update problems",
                "Account deletion requests",
              ],
              subject: "Account Help - [ISSUE]",
            },
            {
              icon: "🏪",
              title: "Vendor Inquiries",
              items: [
                "Register as a vendor",
                "Shop management help",
                "Batch delivery questions",
                "Payment/earnings queries",
                "Vendor dashboard issues",
              ],
              subject: "Vendor Support - [SHOP_NAME]",
            },
            {
              icon: "💡",
              title: "General Questions",
              items: [
                "How Campus Connect works",
                "Platform features",
                "Partnership opportunities",
                "Feedback and suggestions",
                "Technical issues/bugs",
              ],
              subject: "General Inquiry",
            },
          ].map((category, idx) => (
            <InfoCard key={idx} variant="default">
              <h3 className="font-semibold text-lg mb-2">
                {category.icon} {category.title}
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {category.items.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                <strong>Subject:</strong> &quot;{category.subject}&quot;
              </p>
            </InfoCard>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="📧 How to Contact Us Effectively">
        <InfoCard variant="info">
          <p className="font-semibold mb-2">
            For Faster Responses, Please Include:
          </p>
          <ul className="text-sm space-y-1">
            <li>
              ✅ <strong>Order ID</strong> (if order-related)
            </li>
            <li>
              ✅ <strong>Account email</strong> or phone number
            </li>
            <li>
              ✅ <strong>Detailed description</strong> of the issue
            </li>
            <li>
              ✅ <strong>Screenshots</strong> (if applicable)
            </li>
            <li>
              ✅ <strong>Time/date</strong> when the issue occurred
            </li>
          </ul>
        </InfoCard>

        <h3 className="text-xl font-semibold mb-3 mt-6">Email Template:</h3>
        <InfoCard variant="default" className="font-mono text-sm">
          <p>
            <strong>To:</strong> codingclub@nitap.ac.in
          </p>
          <p>
            <strong>Subject:</strong> [Type of Issue] - [Brief Description]
          </p>
          <p className="mt-3">
            <strong>Body:</strong>
          </p>
          <div className="mt-2 space-y-2">
            <p>Hello Campus Connect Team,</p>
            <p>[Describe your issue in detail]</p>
            <p>Order ID (if applicable): [#12345]</p>
            <p>My account email: [your-email@example.com]</p>
            <p>
              Additional details: [Any relevant information, screenshots, etc.]
            </p>
            <p className="mt-3">Thank you,</p>
            <p>[Your Name]</p>
          </div>
        </InfoCard>
      </InfoSection>

      <InfoSection title="🕒 Support Hours & Response Times">
        <div className="grid md:grid-cols-2 gap-4">
          <InfoCard variant="default">
            <h3 className="font-semibold mb-2">📧 Email Support</h3>
            <ul className="text-sm space-y-2">
              <li>
                <strong>Hours:</strong> 24/7 (Email anytime)
              </li>
              <li>
                <strong>Response Time:</strong> Within 24-48 hours
              </li>
              <li>
                <strong>Urgent Issues:</strong> Within 12 hours
              </li>
            </ul>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold mb-2">🏫 Campus Hours</h3>
            <ul className="text-sm space-y-2">
              <li>
                <strong>Active Support:</strong> Monday - Friday
              </li>
              <li>
                <strong>Time:</strong> 9:00 AM - 6:00 PM IST
              </li>
              <li>
                <strong>Weekend:</strong> Limited support
              </li>
            </ul>
          </InfoCard>
        </div>
      </InfoSection>

      <InfoSection title="🔐 Report Security Issues">
        <p>
          If you discover a security vulnerability or privacy concern on Campus
          Connect, please report it immediately:
        </p>
        <InfoCard variant="danger">
          <p className="font-semibold mb-2">🚨 Security Contact</p>
          <p className="text-sm">
            Email:{" "}
            <Link
              href={{
                pathname:
                  "mailto:codingclub@nitap.ac.in?subject=SECURITY%20ALERT",
              }}
              className="underline"
            >
              codingclub@nitap.ac.in
            </Link>
          </p>
          <p className="text-sm">
            Subject: <strong>&quot;SECURITY ALERT - [Description]&quot;</strong>
          </p>
          <p className="text-xs mt-2">
            Please include details of the vulnerability but do not disclose it
            publicly until we&apos;ve had a chance to address it.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="💼 Business Inquiries">
        <p>
          Interested in partnering with Campus Connect or have a business
          proposal?
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <strong>Vendor Partnerships:</strong> Want to list your shop on
            Campus Connect
          </li>
          <li>
            <strong>Sponsorships:</strong> Marketing or sponsorship
            opportunities
          </li>
          <li>
            <strong>Collaborations:</strong> Campus events, student
            organizations, or tech partnerships
          </li>
        </ul>
        <p className="mt-4">
          Email us at{" "}
          <Link
            href={{
              pathname:
                "mailto:codingclub@nitap.ac.in?subject=Business%20Inquiry",
            }}
            className="text-primary hover:underline"
          >
            codingclub@nitap.ac.in
          </Link>{" "}
          with subject line:{" "}
          <strong>&quot;Business Inquiry - [Topic]&quot;</strong>
        </p>
      </InfoSection>

      <InfoSection title="📍 Location">
        <InfoCard variant="default">
          <p className="font-semibold">NIT Arunachal Pradesh</p>
          <p className="text-sm text-muted-foreground">
            Yupia, Papum Pare District
            <br />
            Arunachal Pradesh, India - 791112
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            <em>
              Note: Campus Connect is an online platform. For in-person
              assistance, please contact us via email first to schedule a
              meeting.
            </em>
          </p>
        </InfoCard>
      </InfoSection>

      <InfoCard variant="primary" className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          We&apos;re Here to Help! 💙
        </h3>
        <p className="text-sm mb-4">
          Whether you&apos;re a student, vendor, or just curious about Campus
          Connect, we&apos;re always happy to hear from you. Don&apos;t hesitate
          to reach out!
        </p>
        <Link
          href={{ pathname: "mailto:codingclub@nitap.ac.in" }}
          className="inline-block mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Send Us an Email
        </Link>
      </InfoCard>
    </LegalPageLayout>
  );
}
