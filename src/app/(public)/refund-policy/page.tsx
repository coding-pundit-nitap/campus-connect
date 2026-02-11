import { Metadata } from "next";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Learn about Campus Connect's refund and order cancellation policy.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund & Cancellation Policy"
      description="Learn about Campus Connect's refund and order cancellation policy."
      lastUpdated="February 12, 2026"
    >
      <InfoSection title="1. Overview">
        <InfoCard variant="default">
          <p className="mb-3">
            Campus Connect operates as a platform facilitator between campus
            vendors and students. Our refund and cancellation policies are
            designed to be fair to both buyers and vendors while considering the
            unique nature of our batch delivery system.
          </p>
          <p>
            <strong>General Approach:</strong> Refund and cancellation requests
            are evaluated on a <strong>case-by-case basis</strong>, taking into
            account order status, vendor preparation time, and the reason for
            the request.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="2. Cancellation Policy">
        <InfoCard variant="success">
          <h3 className="text-xl font-semibold mb-3">
            2.1 Before Batch Closes
          </h3>
          <p className="font-semibold mb-2">✅ Cancellation Usually Allowed</p>
          <p className="text-sm">
            If you cancel before the batch closes and the order hasn&apos;t been
            batched yet, cancellation is typically granted without penalty.
          </p>
        </InfoCard>

        <InfoCard variant="warning">
          <h3 className="text-xl font-semibold mb-3">
            2.2 After Batch Closes (Before Preparation)
          </h3>
          <p className="font-semibold mb-2">⚠️ Requires Vendor Approval</p>
          <p className="text-sm">
            Once the batch closes, cancellation depends on vendor approval. If
            the vendor hasn&apos;t started preparing your order, cancellation
            may be possible.
          </p>
        </InfoCard>

        <InfoCard variant="danger">
          <h3 className="text-xl font-semibold mb-3">
            2.3 After Preparation/Out for Delivery
          </h3>
          <p className="font-semibold mb-2">❌ Cancellation Not Allowed</p>
          <p className="text-sm">
            Once the vendor has prepared your order or is out for delivery,
            cancellation is not permitted. You are responsible for accepting and
            paying for the order.
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">
            2.4 How to Cancel an Order
          </h3>
          <ul className="list-decimal pl-6 mb-4 space-y-2">
            <li>Go to &quot;My Orders&quot; in your account dashboard.</li>
            <li>Find the order you want to cancel.</li>
            <li>Click &quot;Request Cancellation&quot; (if available).</li>
            <li>Provide a reason for cancellation and submit your request.</li>
            <li>
              Wait for vendor/admin approval (you&apos;ll be notified via
              email).
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="3. Refund Policy">
        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">
            3.1 Eligible Refund Scenarios
          </h3>
          <p className="mb-3">
            You may be eligible for a refund in the following cases:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Order Not Delivered:</strong> If the vendor fails to
              deliver your order within the batch window and you haven&apos;t
              received it.
            </li>
            <li>
              <strong>Wrong Item Delivered:</strong> If you received a
              completely different product than what you ordered.
            </li>
            <li>
              <strong>Spoiled/Damaged Products:</strong> If food items are
              spoiled, expired, or significantly damaged upon delivery.
            </li>
            <li>
              <strong>Incomplete Order:</strong> If items are missing from your
              order.
            </li>
            <li>
              <strong>Vendor Cancellation:</strong> If the vendor cancels your
              order after payment (if applicable).
            </li>
            <li>
              <strong>Duplicate Payment:</strong> If you were charged multiple
              times for the same order.
            </li>
          </ul>
        </InfoCard>

        <InfoCard variant="danger">
          <h3 className="text-xl font-semibold mb-3">
            3.2 Non-Refundable Scenarios
          </h3>
          <p className="mb-3">
            Refunds will <strong>NOT be provided</strong> in these cases:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Change of Mind:</strong> If you simply changed your mind
              after the order was prepared/delivered.
            </li>
            <li>
              <strong>Taste Preferences:</strong> If you didn&apos;t like the
              taste or quality (unless the product is spoiled or inedible).
            </li>
            <li>
              <strong>Missed Delivery:</strong> If you weren&apos;t available to
              collect your order during the batch window and didn&apos;t inform
              us in advance.
            </li>
            <li>
              <strong>Incorrect Address:</strong> If you provided wrong delivery
              information and the vendor couldn&apos;t deliver.
            </li>
            <li>
              <strong>OTP Already Verified:</strong> Once you&apos;ve verified
              the delivery OTP, the order is considered complete and refunds are
              generally not available.
            </li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">3.3 Partial Refunds</h3>
          <p>
            If only part of your order is problematic (e.g., one item spoiled,
            others fine), we may issue a <strong>partial refund</strong> for the
            affected items only.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="4. How to Request a Refund">
        <InfoCard variant="info">
          <p className="font-semibold mb-3">📱 Report Issues Immediately</p>
          <p className="text-sm">
            For the best chance of a successful refund, report issues{" "}
            <strong>within 24 hours</strong> of delivery.
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">Steps to Request:</h3>
          <ul className="list-decimal pl-6 mb-4 space-y-2">
            <li>Go to &quot;My Orders&quot; and find the problematic order.</li>
            <li>
              Click &quot;Report Issue&quot; or &quot;Request Refund&quot;.
            </li>
            <li>
              Select the reason for your refund request:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Order not delivered</li>
                <li>Wrong item received</li>
                <li>Item damaged/spoiled</li>
                <li>Incomplete order</li>
                <li>Other (please specify)</li>
              </ul>
            </li>
            <li>
              <strong>Upload Evidence (if applicable):</strong> Photos of
              spoiled/wrong products help process your request faster.
            </li>
            <li>Submit your request.</li>
            <li>
              Our support team will review your request and respond within{" "}
              <strong>2-3 business days</strong>.
            </li>
          </ul>
          <p className="mt-4">
            <strong>Email Support:</strong> You can also email{" "}
            <a
              href="mailto:codingclub@nitap.ac.in"
              className="text-primary hover:underline"
            >
              codingclub@nitap.ac.in
            </a>{" "}
            with your order ID and issue details.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="5. Refund Processing Timeline">
        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">
            5.1 Currently (Cash on Delivery)
          </h3>
          <p className="mb-3">
            Since Campus Connect currently uses{" "}
            <strong>Cash on Delivery</strong>, refunds (if approved) may be
            processed as:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Account Credit:</strong> Refund amount added to your
              Campus Connect wallet for future orders.
            </li>
            <li>
              <strong>Manual Refund:</strong> Coordinated directly with the
              vendor for cash return.
            </li>
          </ul>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="text-xl font-semibold mb-3">
            5.2 Future (UPI/Online Payments)
          </h3>
          <p>
            When UPI/online payments are introduced, refunds will be processed
            back to the original payment method within{" "}
            <strong>5-7 business days</strong> after approval.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="6. Vendor-Specific Policies">
        <InfoCard variant="default">
          <p>
            Individual vendors on Campus Connect may have their own additional
            policies regarding cancellations and refunds. These will be
            displayed on the vendor&apos;s shop page. In case of conflict,
            vendor-specific policies take precedence for that vendor&apos;s
            orders.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="7. Dispute Resolution Process">
        <InfoCard variant="default">
          <p className="mb-3">
            If your refund/cancellation request is denied and you believe it was
            unfair:
          </p>
          <ul className="list-decimal pl-6 mb-4 space-y-2">
            <li>
              <strong>Step 1: Contact Support</strong> - Email{" "}
              <a
                href="mailto:codingclub@nitap.ac.in"
                className="text-primary hover:underline"
              >
                codingclub@nitap.ac.in
              </a>{" "}
              with your order ID and explanation.
            </li>
            <li>
              <strong>Step 2: Mediation</strong> - Our team will mediate between
              you and the vendor to find a fair resolution.
            </li>
            <li>
              <strong>Step 3: Final Decision</strong> - If unresolved, the
              Campus Connect admin team will make a final binding decision based
              on evidence and policies.
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="8. Prevention Tips (Avoid Issues)">
        <InfoCard variant="info">
          <p className="font-semibold mb-3">
            🛡️ How to Avoid Refund/Cancellation Issues:
          </p>
          <ul className="list-disc pl-6 text-sm space-y-2">
            <li>
              <strong>Order Early:</strong> Place orders well before batch
              closure to allow time for changes.
            </li>
            <li>
              <strong>Double-Check Items:</strong> Review your cart carefully
              before confirming.
            </li>
            <li>
              <strong>Be Available:</strong> Ensure you&apos;re reachable during
              the delivery window.
            </li>
            <li>
              <strong>Verify Delivery:</strong> Check your order before entering
              the OTP.
            </li>
            <li>
              <strong>Report Immediately:</strong> If there&apos;s an issue,
              report it right away (don&apos;t wait days).
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="9. Policy Updates">
        <InfoCard variant="default">
          <p>
            Campus Connect may update this Refund &amp; Cancellation Policy from
            time to time. Changes will be indicated by the &quot;Last
            Updated&quot; date at the top of this page. Continued use of the
            Platform after changes constitutes acceptance of the updated policy.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="10. Contact Us">
        <InfoCard variant="default">
          <p className="mb-3">
            For refund/cancellation requests or questions about this policy:
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
              <strong>Subject Line:</strong> &quot;Refund Request - Order
              #[YOUR_ORDER_ID]&quot;
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoCard variant="warning" className="mt-8">
        <p className="text-sm text-center">
          <strong>Important Note:</strong> By placing an order on Campus
          Connect, you acknowledge that you have read and understood this Refund
          &amp; Cancellation Policy. This policy is subject to our{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms &amp; Conditions
          </a>
          .
        </p>
      </InfoCard>
    </LegalPageLayout>
  );
}
