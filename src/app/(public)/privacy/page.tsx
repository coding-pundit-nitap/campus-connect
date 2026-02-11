import { Metadata } from "next";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Campus Connect collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="Learn how Campus Connect collects, uses, and protects your personal information."
      lastUpdated="February 12, 2026"
    >
      <InfoSection title="1. Introduction">
        <InfoCard variant="default">
          <p>
            Welcome to Campus Connect, operated by Coding Club @ NIT Arunachal
            Pradesh (Coding Pundit). We are committed to protecting your
            personal information and your right to privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our platform.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="2. Information We Collect">
        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">
            2.1 Personal Information
          </h3>
          <p className="mb-3">
            We collect the following types of personal information:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Account Information:</strong> Name, email address, phone
              number, and password
            </li>
            <li>
              <strong>Delivery Information:</strong> Hostel block, room number,
              and other delivery addresses
            </li>
            <li>
              <strong>Order History:</strong> Products ordered, order amounts,
              delivery status, and reviews
            </li>
            <li>
              <strong>Payment Information:</strong> Currently limited to Cash on
              Delivery transactions (UPI may be added in the future)
            </li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">
            2.2 Automatically Collected Information
          </h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Device information (browser type, operating system)</li>
            <li>IP address and location data</li>
            <li>Usage patterns and interaction with the platform</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">
            2.3 Third-Party Authentication
          </h3>
          <p>
            If you sign in using third-party services (e.g., Google OAuth), we
            collect information authorized by you from those services, such as
            your email address and profile information.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="3. How We Use Your Information">
        <InfoCard variant="default">
          <p className="mb-3">
            We use your information for the following purposes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Order Processing:</strong> To process and fulfill your
              orders, including batch delivery coordination
            </li>
            <li>
              <strong>Communication:</strong> To send order updates, delivery
              notifications, and customer support responses
            </li>
            <li>
              <strong>Account Management:</strong> To manage your account and
              provide personalized experiences
            </li>
            <li>
              <strong>Platform Improvement:</strong> To analyze usage patterns
              and improve our services
            </li>
            <li>
              <strong>Security:</strong> To detect and prevent fraud, abuse, and
              security incidents
            </li>
            <li>
              <strong>Legal Compliance:</strong> To comply with applicable laws
              and regulations
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="4. Information Sharing and Disclosure">
        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">4.1 With Vendors</h3>
          <p>
            We share your order information (name, delivery address, order
            details) with campus vendors only for the purpose of order
            fulfillment and delivery.
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">4.2 Service Providers</h3>
          <p>
            We may share information with third-party service providers who
            assist us in operating the platform (hosting, analytics, customer
            support).
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">4.3 Legal Requirements</h3>
          <p>
            We may disclose your information if required by law or in response
            to valid requests by public authorities (e.g., college
            administration, law enforcement).
          </p>
        </InfoCard>

        <InfoCard variant="success">
          <h3 className="text-xl font-semibold mb-3">
            4.4 We Do NOT Sell Your Data
          </h3>
          <p>
            Campus Connect does not sell, rent, or trade your personal
            information to third parties for marketing purposes.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="5. Data Security">
        <InfoCard variant="default">
          <p className="mb-3">
            We implement appropriate technical and organizational security
            measures to protect your personal information, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Encrypted data transmission (HTTPS)</li>
            <li>Secure password hashing</li>
            <li>Access controls and authentication</li>
            <li>Regular security audits</li>
          </ul>
          <p>
            However, no method of transmission over the internet is 100% secure.
            While we strive to protect your information, we cannot guarantee
            absolute security.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="6. Your Rights">
        <InfoCard variant="default">
          <p className="mb-3">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Access:</strong> Request access to your personal
              information
            </li>
            <li>
              <strong>Correction:</strong> Update or correct inaccurate
              information
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your account and
              data (subject to legal retention requirements)
            </li>
            <li>
              <strong>Data Portability:</strong> Request a copy of your data in
              a structured format
            </li>
            <li>
              <strong>Opt-Out:</strong> Unsubscribe from marketing
              communications
            </li>
          </ul>
          <p>
            To exercise these rights, contact us at{" "}
            <a
              href="mailto:codingclub@nitap.ac.in"
              className="text-primary hover:underline"
            >
              codingclub@nitap.ac.in
            </a>
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="7. Data Retention">
        <InfoCard variant="default">
          <p>
            We retain your personal information only for as long as necessary to
            fulfill the purposes outlined in this Privacy Policy, unless a
            longer retention period is required by law. Order history and
            transaction records may be retained for accounting and legal
            purposes.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="8. Cookies and Tracking">
        <InfoCard variant="default">
          <p>
            We use cookies and similar tracking technologies to enhance your
            experience on our platform. You can control cookie preferences
            through your browser settings, but disabling cookies may limit
            certain features of the platform.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="9. Third-Party Links">
        <InfoCard variant="default">
          <p>
            Our platform may contain links to third-party websites or services.
            We are not responsible for the privacy practices of these external
            sites. We encourage you to review their privacy policies.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="10. Children's Privacy">
        <InfoCard variant="default">
          <p>
            Campus Connect is intended for use by students of NIT Arunachal
            Pradesh (typically 18 years or older). We do not knowingly collect
            personal information from children under 18 without parental
            consent.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="11. Changes to This Policy">
        <InfoCard variant="default">
          <p>
            We may update this Privacy Policy from time to time. The updated
            version will be indicated by the &quot;Last Updated&quot; date at
            the top of this page. We encourage you to review this policy
            periodically to stay informed about how we protect your information.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="12. Contact Us">
        <InfoCard variant="default">
          <p className="mb-3">
            If you have questions or concerns about this Privacy Policy or our
            data practices, please contact us:
          </p>
          <ul className="list-none pl-0 mb-4 space-y-1">
            <li>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:codingclub@nitap.ac.in"
                className="text-primary hover:underline"
              >
                codingclub@nitap.ac.in
              </a>
            </li>
            <li>
              <strong>Organization:</strong> Coding Club @ NIT Arunachal Pradesh
              (Coding Pundit)
            </li>
            <li>
              <strong>Platform:</strong> Campus Connect
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoCard variant="info" className="mt-8">
        <p className="text-sm text-center">
          By using Campus Connect, you acknowledge that you have read,
          understood, and agree to this Privacy Policy.
        </p>
      </InfoCard>
    </LegalPageLayout>
  );
}
