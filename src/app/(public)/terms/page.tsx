import { Metadata } from "next";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Read the Terms and Conditions for using Campus Connect platform.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      description="Read the Terms and Conditions for using Campus Connect platform."
      lastUpdated="February 12, 2026"
    >
      <InfoSection title="1. Acceptance of Terms">
        <InfoCard variant="default">
          <p className="mb-3">
            By accessing and using Campus Connect (&quot;the Platform&quot;),
            you agree to be bound by these Terms and Conditions. If you do not
            agree to these terms, please do not use the Platform.
          </p>
          <p>
            Campus Connect is operated by Coding Club @ NIT Arunachal Pradesh
            (Coding Pundit) and is intended for use by students, faculty, and
            authorized members of the NIT Arunachal Pradesh community.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="2. User Eligibility">
        <InfoCard variant="default">
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              You must be a current student or authorized member of NIT
              Arunachal Pradesh to use this Platform.
            </li>
            <li>
              You must be at least 18 years old or have parental/guardian
              consent to use the Platform.
            </li>
            <li>
              You must provide accurate and complete information during
              registration.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="3. Platform Overview">
        <InfoCard variant="default">
          <p className="mb-3">
            Campus Connect is a hyper-local e-commerce platform that connects
            campus vendors with students through a batch delivery system:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Batch Delivery:</strong> Orders are grouped into time
              slots for efficient vendor delivery to hostel blocks.
            </li>
            <li>
              <strong>Vendor Self-Delivery:</strong> Vendors deliver orders
              directly; we do not provide delivery personnel.
            </li>
            <li>
              <strong>Campus-Only Service:</strong> This platform operates
              exclusively within NIT Arunachal Pradesh campus.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="4. User Responsibilities">
        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">4.1 Account Security</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You are responsible for all activities under your account.</li>
            <li>
              Notify us immediately if you suspect unauthorized access to your
              account.
            </li>
            <li>Do not share your account credentials with others.</li>
          </ul>
        </InfoCard>

        <InfoCard variant="warning">
          <h3 className="text-xl font-semibold mb-3">
            4.2 Prohibited Activities
          </h3>
          <p className="mb-3">You agree NOT to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Use the Platform for any illegal or unauthorized purpose</li>
            <li>Place fraudulent or fake orders</li>
            <li>
              Impersonate another person or provide false delivery information
            </li>
            <li>Abuse, harass, or threaten vendors or other users</li>
            <li>
              Attempt to hack, disrupt, or compromise the Platform&apos;s
              security
            </li>
            <li>Scrape or copy platform content without authorization</li>
            <li>Post or transmit any harmful code (viruses, malware, etc.)</li>
            <li>Abuse the review or rating system</li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="5. Orders and Payments">
        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">5.1 Order Placement</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Orders must meet the vendor&apos;s Minimum Order Value (MOV) to be
              accepted.
            </li>
            <li>
              Orders are grouped into batch delivery slots. You cannot change
              the batch time once confirmed.
            </li>
            <li>Product availability is subject to real-time stock updates.</li>
            <li>
              We reserve the right to reject or cancel orders at our discretion.
            </li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">5.2 Pricing</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>All prices are in Indian Rupees (₹).</li>
            <li>
              The total price includes: Item Total + Delivery Fee + Platform
              Fee.
            </li>
            <li>
              Vendors may change prices at any time. Prices are locked once you
              place an order.
            </li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">5.3 Payment Methods</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Cash on Delivery (COD):</strong> Currently the only
              payment method. Pay the vendor upon delivery.
            </li>
            <li>
              <strong>UPI (Future):</strong> Digital payment options may be
              added in the future.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="6. Delivery and Fulfillment">
        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">
            6.1 Batch Delivery System
          </h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Orders are delivered according to vendor-defined batch schedules.
            </li>
            <li>
              Delivery times are estimates and may vary due to operational
              constraints.
            </li>
            <li>
              You must be available at the specified delivery location (hostel
              block) during the batch window.
            </li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">6.2 Delivery Locations</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Delivery is only available within NIT Arunachal Pradesh campus.
            </li>
            <li>
              You must provide accurate hostel block and room number
              information.
            </li>
            <li>
              Campus Connect is not responsible for failed deliveries due to
              incorrect or incomplete addresses.
            </li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">6.3 OTP Verification</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Delivery completion requires OTP verification to confirm receipt.
            </li>
            <li>Do not share your OTP until you have received your order.</li>
            <li>
              Once OTP is verified, the order is considered delivered and
              payment is considered complete.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="7. Vendor Relationship">
        <InfoCard variant="default">
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Campus Connect acts as a{" "}
              <strong>platform facilitator only</strong>. We do not own,
              operate, or control vendor businesses.
            </li>
            <li>
              Vendors are independent third parties responsible for product
              quality, food safety, and order fulfillment.
            </li>
            <li>
              Disputes regarding product quality or order issues should be
              addressed directly with the vendor (with platform assistance if
              needed).
            </li>
            <li>
              Campus Connect is not liable for vendor errors, delays, or product
              defects.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="8. Cancellations and Refunds">
        <InfoCard variant="default">
          <p className="mb-3">
            See our detailed{" "}
            <a href="/refund-policy" className="text-primary hover:underline">
              Refund &amp; Cancellation Policy
            </a>{" "}
            for complete information.
          </p>
          <p className="mb-3">
            <strong>Summary:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Cancellations and refunds are handled on a case-by-case basis.
            </li>
            <li>
              You may request cancellation before the batch closes or before the
              vendor begins preparation.
            </li>
            <li>
              Refunds (if applicable) are processed within 5-7 business days.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="9. Reviews and User Content">
        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">9.1 Review Eligibility</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              You can only review products you have successfully purchased and
              received.
            </li>
            <li>Reviews must be honest and based on your actual experience.</li>
          </ul>
        </InfoCard>

        <InfoCard variant="warning">
          <h3 className="text-xl font-semibold mb-3">9.2 Content Guidelines</h3>
          <p className="mb-3">Reviews must NOT contain:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Offensive, abusive, or discriminatory language</li>
            <li>False or misleading information</li>
            <li>Personal attacks on vendors or other users</li>
            <li>Spam, promotional content, or external links</li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">9.3 Content Moderation</h3>
          <p>
            Campus Connect reserves the right to remove or edit any
            user-generated content that violates these Terms or our community
            guidelines.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="10. Intellectual Property">
        <InfoCard variant="default">
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              All content on Campus Connect (logos, designs, text, images) is
              owned by or licensed to Coding Club @ NIT Arunachal Pradesh.
            </li>
            <li>
              You may not copy, reproduce, or use any platform content without
              written permission.
            </li>
            <li>
              Vendor product images and descriptions are owned by respective
              vendors.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="11. Limitation of Liability">
        <InfoCard variant="danger">
          <p className="mb-3">
            <strong>To the maximum extent permitted by law:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              Campus Connect is provided &quot;AS IS&quot; without warranties of
              any kind.
            </li>
            <li>
              We are not liable for any indirect, incidental, or consequential
              damages arising from your use of the Platform.
            </li>
            <li>
              We are not responsible for product quality, food safety, or vendor
              actions.
            </li>
            <li>
              Our total liability shall not exceed the amount you paid for the
              specific transaction in question.
            </li>
            <li>
              We are not liable for service disruptions due to maintenance,
              technical issues, or force majeure events.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="12. Indemnification">
        <InfoCard variant="default">
          <p className="mb-3">
            You agree to indemnify and hold harmless Campus Connect, Coding Club
            @ NIT Arunachal Pradesh, and their officers, directors, employees,
            and agents from any claims, damages, losses, or expenses arising
            from:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your violation of these Terms</li>
            <li>Your misuse of the Platform</li>
            <li>Your violation of any third-party rights</li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="13. Account Suspension and Termination">
        <InfoCard variant="default">
          <p className="mb-3">
            We reserve the right to suspend or terminate your account if:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You violate these Terms</li>
            <li>You engage in fraudulent or abusive behavior</li>
            <li>You are no longer affiliated with NIT Arunachal Pradesh</li>
            <li>We discontinue the Platform</li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="14. Changes to Terms">
        <InfoCard variant="default">
          <p>
            We may update these Terms from time to time. The updated version
            will be indicated by the &quot;Last Updated&quot; date at the top of
            this page. Continued use of the Platform after changes constitutes
            acceptance of the new Terms.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="15. Governing Law and Jurisdiction">
        <InfoCard variant="default">
          <p>
            These Terms are governed by the laws of India. Any disputes arising
            from these Terms or the use of Campus Connect shall be subject to
            the exclusive jurisdiction of courts in Arunachal Pradesh, India.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="16. Contact Information">
        <InfoCard variant="default">
          <p className="mb-3">
            If you have questions or concerns about these Terms, please contact
            us:
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
          understood, and agree to be bound by these Terms and Conditions.
        </p>
      </InfoCard>
    </LegalPageLayout>
  );
}
