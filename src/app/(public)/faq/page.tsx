import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description:
    "Find answers to common questions about Campus Connect, batch delivery, orders, payments, and more.",
};

export default function FAQPage() {
  return (
    <LegalPageLayout
      title="Frequently Asked Questions (FAQ)"
      description="Find quick answers to the most common questions about Campus Connect"
      lastUpdated=""
    >
      <InfoSection title="🏠 General Questions">
        <div className="space-y-6">
          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              What is Campus Connect?
            </h3>
            <p className="text-sm text-muted-foreground">
              Campus Connect is a hyper-local e-commerce platform that bridges
              the &quot;Altitude Gap&quot; between campus vendors (Lower Market)
              and student hostels (Hostel Blocks) at NIT Arunachal Pradesh. We
              use a smart batch delivery system to make vendor deliveries
              efficient and profitable.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              Who can use Campus Connect?
            </h3>
            <p className="text-sm text-muted-foreground">
              Campus Connect is designed for students, faculty, and authorized
              members of the NIT Arunachal Pradesh community. You must have a
              valid campus email or affiliation to register.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              Is there a delivery fee?
            </h3>
            <p className="text-sm text-muted-foreground">
              Yes. The total price includes: <strong>Item Total</strong>{" "}
              (product costs) + <strong>Delivery/Climb Fe</strong> (goes to the
              vendor) + <strong>Platform Fee</strong> (for system maintenance).
              All fees are displayed transparently before checkout.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              How is Campus Connect different from other delivery platforms?
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Unlike platforms like Swiggy or Zomato:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>
                <strong>No on-demand runners:</strong> Vendors deliver their own
                orders
              </li>
              <li>
                <strong>Batch delivery system:</strong> Orders are grouped into
                time slots
              </li>
              <li>
                <strong>Campus-exclusive:</strong> Built specifically for NIT
                AP&apos;s unique geography
              </li>
              <li>
                <strong>Community-driven:</strong> Built by students for
                students
              </li>
            </ul>
          </InfoCard>
        </div>
      </InfoSection>

      <InfoSection title="📦 Orders & Delivery">
        <InfoCard variant="default">
          <h3 className="font-semibold text-lg mb-2">
            What is &quot;batch delivery&quot;?
          </h3>
          <p className="text-sm text-muted-foreground">
            Batch delivery groups multiple orders into scheduled time slots
            (e.g., 5:00 PM batch). This allows vendors to deliver many orders in
            one trip, making the 100m climb profitable and efficient. Instead of
            &quot;30 mins ETA&quot;, you see &quot;Next Batch: 5:00 PM&quot;.
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="font-semibold text-lg mb-2">
            How long does delivery take?
          </h3>
          <p className="text-sm text-muted-foreground">
            Delivery times depend on the vendor&apos;s batch schedule.
            You&apos;ll see available batch times when placing your order.
            Typical delivery windows are Lunch (12-1 PM) and Dinner (6-8 PM),
            but vendors set their own schedules.
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="font-semibold text-lg mb-2">
            What is Minimum Order Value (MOV)?
          </h3>
          <p className="text-sm text-muted-foreground">
            MOV is the minimum amount you must spend to place an order with a
            vendor. Vendors set their own MOV (e.g., ₹50) because it&apos;s not
            economical to climb 100m for a ₹10 order. The MOV is displayed on
            each shop page.
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="font-semibold text-lg mb-2">
            Where do I collect my order?
          </h3>
          <p className="text-sm text-muted-foreground">
            Vendors deliver to designated drop points near your hostel block.
            You&apos;ll receive a notification when your order is out for
            delivery. Meet the vendor at the drop point during the batch window.
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="font-semibold text-lg mb-2">
            What is OTP verification?
          </h3>
          <p className="text-sm text-muted-foreground">
            When you receive your order, the vendor will ask for a
            one-time-password (OTP) sent to your phone/email. Enter the OTP to
            confirm you&apos;ve received the order. This protects both you and
            the vendor.{" "}
            <strong>Never share your OTP until you have your order!</strong>
          </p>
        </InfoCard>

        <InfoCard variant="default">
          <h3 className="font-semibold text-lg mb-2">Can I track my order?</h3>
          <p className="text-sm text-muted-foreground">
            Yes! Check &quot;My Orders&quot; to see your order status:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2">
            <li>
              <strong>NEW:</strong> Order placed, waiting for batch
            </li>
            <li>
              <strong>BATCHED:</strong> Grouped into delivery batch
            </li>
            <li>
              <strong>OUT_FOR_DELIVERY:</strong> Vendor is climbing!
            </li>
            <li>
              <strong>COMPLETED:</strong> Delivered and verified
            </li>
          </ul>
        </InfoCard>
      </InfoSection>

      <InfoSection title="💰 Payments">
        <div className="space-y-6">
          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              What payment methods are accepted?
            </h3>
            <p className="text-sm text-muted-foreground">
              Currently, we only support <strong>Cash on Delivery (COD)</strong>
              . Pay the vendor when you receive your order. UPI and digital
              payment options may be added in the future.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              When do I pay for my order?
            </h3>
            <p className="text-sm text-muted-foreground">
              Payment happens <strong>on delivery</strong>. Have exact cash
              ready when you collect your order. Enter the OTP only after
              you&apos;ve paid.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              What if I don&apos;t have exact change?
            </h3>
            <p className="text-sm text-muted-foreground">
              Most vendors carry change, but it&apos;s best to have exact or
              near-exact amount ready. If the vendor can&apos;t provide change,
              they may ask you to pay the rounded amount or arrange for change
              later.
            </p>
          </InfoCard>
        </div>
      </InfoSection>

      <InfoSection title="🔄 Cancellations & Refunds">
        <div className="space-y-6">
          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              Can I cancel my order?
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              It depends on the order status:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>
                <strong className="text-green-600 dark:text-green-400">
                  Before batch closes:
                </strong>{" "}
                ✅ Usually allowed
              </li>
              <li>
                <strong className="text-yellow-600 dark:text-yellow-400">
                  After batch closes:
                </strong>{" "}
                ⚠️ Requires vendor approval
              </li>
              <li>
                <strong className="text-red-600 dark:text-red-400">
                  After preparation/delivery:
                </strong>{" "}
                ❌ Not allowed
              </li>
            </ul>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              How do I request a refund?
            </h3>
            <p className="text-sm text-muted-foreground">
              Go to &quot;My Orders&quot; → find the order → click &quot;Report
              Issue&quot; or &quot;Request Refund&quot;. Provide details and
              upload evidence (photos if applicable). Our support team will
              review within 2-3 business days. See our{" "}
              <Link
                href={{ pathname: "/refund-policy" }}
                className="text-primary hover:underline"
              >
                Refund Policy
              </Link>{" "}
              for full details.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              What if my order never arrived?
            </h3>
            <p className="text-sm text-muted-foreground">
              Check your &quot;My Orders&quot; page first. If it shows
              &quot;Completed&quot; but you didn&apos;t receive it, report it
              immediately via the &quot;Report Issue&quot; button. If you
              didn&apos;t verify the OTP, contact support at{" "}
              <a
                href="mailto:codingclub@nitap.ac.in"
                className="text-primary hover:underline"
              >
                codingclub@nitap.ac.in
              </a>
              .
            </p>
          </InfoCard>
        </div>
      </InfoSection>

      <InfoSection title="👤 Account & Technical">
        <div className="space-y-6">
          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              The website is slow or not loading. What should I do?
            </h3>
            <p className="text-sm text-muted-foreground">Try these steps:</p>
            <ul className="text-sm text-muted-foreground list-decimal pl-5 mt-2 space-y-1">
              <li>Refresh the page (Ctrl+R or Cmd+R)</li>
              <li>Clear your browser cache and cookies</li>
              <li>Try a different browser (Chrome, Firefox, Safari)</li>
              <li>Check your internet connection</li>
              <li>
                If the problem persists, it may be server maintenance. Check
                back in 10-15 minutes or contact support.
              </li>
            </ul>
          </InfoCard>
        </div>
      </InfoSection>

      <InfoSection title="🏪 For Vendors">
        <div className="space-y-6">
          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              How do I register my shop on Campus Connect?
            </h3>
            <p className="text-sm text-muted-foreground">
              Email{" "}
              <a
                href="mailto:codingclub@nitap.ac.in"
                className="text-primary hover:underline"
              >
                codingclub@nitap.ac.in
              </a>{" "}
              with subject &quot;Vendor Registration - [Shop Name]&quot;.
              Include your shop name, location, type of products, and contact
              details. Our team will guide you through the onboarding process.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              How do batches work for vendors?
            </h3>
            <p className="text-sm text-muted-foreground">
              You define your batch schedule (e.g., Lunch: 1 PM, Dinner: 7 PM).
              Orders are grouped into these slots. You prepare all orders in a
              batch together and deliver them in one trip to the hostel blocks.
              Your vendor dashboard shows batches grouped by hostel block.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">How do I get paid?</h3>
            <p className="text-sm text-muted-foreground">
              Currently, with Cash on Delivery, you collect payment directly
              from customers upon delivery. You keep the item total + delivery
              fee. The platform fee is deducted from your earnings and settled
              periodically. Full payment details are in your vendor dashboard.
            </p>
          </InfoCard>
        </div>
      </InfoSection>

      {/* Still Have Questions? */}
      <InfoSection title="Still Have Questions? 🤔">
        <InfoCard variant="primary" className="text-center">
          <h3 className="text-xl font-semibold mb-3">
            Can&apos;t find the answer you&apos;re looking for?
          </h3>
          <p className="text-sm mb-4">Our support team is here to help!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={{ pathname: "/contact" }}
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href={{ pathname: "mailto:codingclub@nitap.ac.in" }}
              className="inline-block px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
            >
              Email Us
            </Link>
          </div>
        </InfoCard>
      </InfoSection>
    </LegalPageLayout>
  );
}
