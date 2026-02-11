import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Campus Connect - connecting campus vendors with students through smart batch delivery.",
};

export default function AboutPage() {
  return (
    <LegalPageLayout
      title="About Campus Connect"
      description="Bridging the 'Altitude Gap' between campus vendors and students"
      lastUpdated=""
    >
      <InfoSection title="Our Mission">
        <p className="text-lg leading-relaxed">
          Campus Connect is on a mission to bridge the &quot;Altitude Gap&quot;
          between campus vendors and student hostels at NIT Arunachal Pradesh.
          We&apos;re not just an e-commerce platform - we&apos;re solving a real
          logistical challenge faced by our campus community every single day.
        </p>
      </InfoSection>

      <InfoSection title="The Problem We Solve">
        <InfoCard variant="info">
          <h3 className="text-xl font-semibold mb-3">
            🏔️ The &quot;Altitude Gap&quot;
          </h3>
          <ul className="space-y-2">
            <li>
              <strong>Vendors:</strong> Located at Lower Market (Altitude: 200m)
            </li>
            <li>
              <strong>Students:</strong> Living in Hostel Blocks (Altitude:
              300m)
            </li>
            <li>
              <strong>The Challenge:</strong> A 100-meter vertical climb
              (approximately 30 stories!)
            </li>
          </ul>
        </InfoCard>

        <p>
          Before Campus Connect, vendors relied on chaotic WhatsApp orders and
          had to make multiple exhausting trips up the hill for individual
          deliveries. This was inefficient, unprofitable, and unsustainable.
        </p>
      </InfoSection>

      <InfoSection title='Our Solution: "Batch & Climb"'>
        <div className="grid md:grid-cols-2 gap-4">
          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">📦 Smart Batching</h3>
            <p className="text-sm text-muted-foreground">
              We group orders into scheduled time slots, making each vendor
              climb profitable and efficient.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              🚶 Vendor Self-Delivery
            </h3>
            <p className="text-sm text-muted-foreground">
              Vendors deliver their own orders, maintaining quality and customer
              relationships.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">
              ⏰ Predictable Schedule
            </h3>
            <p className="text-sm text-muted-foreground">
              Students know exactly when their orders will arrive - no more
              guessing or waiting.
            </p>
          </InfoCard>

          <InfoCard variant="default">
            <h3 className="font-semibold text-lg mb-2">💰 Fair Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Transparent pricing: Item cost + Delivery fee + Platform fee.
            </p>
          </InfoCard>
        </div>
      </InfoSection>

      <InfoSection title="Who We Are">
        <p>
          Campus Connect is built and maintained by{" "}
          <strong>Coding Club @ NIT Arunachal Pradesh</strong> (also known as{" "}
          <strong>Coding Pundit</strong>). We&apos;re a student-run organization
          passionate about using technology to solve real-world campus problems.
        </p>

        <InfoCard variant="info">
          <p className="text-sm">
            <strong>🎓 By Students, For Students</strong>
            <br />
            We understand campus life because we live it. Every feature on
            Campus Connect is designed with the student experience in mind.
          </p>
        </InfoCard>
      </InfoSection>

      <InfoSection title="How It Works">
        <div className="space-y-4">
          {[
            {
              num: 1,
              title: "Browse & Order",
              desc: "Students browse products from campus vendors and place orders before the batch closes.",
            },
            {
              num: 2,
              title: "Batch Grouping",
              desc: "Campus Connect groups orders into batches by hostel block and time slot.",
            },
            {
              num: 3,
              title: "Vendor Prepares",
              desc: "Vendors receive the batch, prepare all orders efficiently, and plan their delivery route.",
            },
            {
              num: 4,
              title: "The Climb 🏔️",
              desc: "Vendors make the 100m climb to deliver batched orders to the hostel drop point.",
            },
            {
              num: 5,
              title: "OTP Verification",
              desc: "Students collect their orders and verify delivery with an OTP. Payment happens on delivery (COD).",
            },
          ].map((step) => (
            <div key={step.num} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                {step.num}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="Why Campus Connect?">
        <div className="space-y-3">
          {[
            {
              emoji: "✅",
              title: "Efficient for Vendors",
              desc: "Multiple orders per climb means better profit margins.",
            },
            {
              emoji: "✅",
              title: "Convenient for Students",
              desc: "Order from your room, get delivery on schedule.",
            },
            {
              emoji: "✅",
              title: "Hyper-Local",
              desc: "Built specifically for NIT Arunachal Pradesh's unique geography.",
            },
            {
              emoji: "✅",
              title: "Transparent Pricing",
              desc: "You know exactly what you're paying for (product + delivery + platform fee).",
            },
            {
              emoji: "✅",
              title: "Community-Driven",
              desc: "Built by students who understand campus life.",
            },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-xl">{item.emoji}</span>
              <div>
                <strong>{item.title}:</strong> {item.desc}
              </div>
            </div>
          ))}
        </div>
      </InfoSection>

      <InfoSection title="Our Values">
        <ul className="space-y-3">
          <li>
            <strong>🤝 Community First:</strong> We prioritize the needs of both
            students and vendors.
          </li>
          <li>
            <strong>🔍 Transparency:</strong> Clear pricing, honest
            communication, no hidden fees.
          </li>
          <li>
            <strong>⚡ Innovation:</strong> Using technology to solve unique
            campus challenges.
          </li>
          <li>
            <strong>🌱 Sustainability:</strong> Reducing unnecessary trips and
            optimizing logistics.
          </li>
          <li>
            <strong>🛡️ Trust:</strong> Building a reliable platform students and
            vendors can depend on.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="The Future of Campus Connect">
        <p>
          We&apos;re just getting started! Here&apos;s what&apos;s on our
          roadmap:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <strong>UPI Payments:</strong> Digital payment options for faster
            checkout
          </li>
          <li>
            <strong>Live Tracking:</strong> Track your vendor&apos;s climb in
            real-time
          </li>
          <li>
            <strong>Smart Recommendations:</strong> Personalized product
            suggestions
          </li>
          <li>
            <strong>Loyalty Programs:</strong> Rewards for frequent buyers and
            top vendors
          </li>
          <li>
            <strong>Expanded Services:</strong> Beyond food – laundry,
            stationery, and more
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Join Our Journey">
        <p>
          Campus Connect is more than a platform – it&apos;s a community.
          Whether you&apos;re a student looking for convenient ordering or a
          vendor wanting to grow your business, we&apos;re here to help.
        </p>

        <InfoCard variant="primary">
          <h3 className="font-semibold text-lg mb-3">📬 Get in Touch</h3>
          <p className="mb-4">
            Have questions, feedback, or want to partner with us?
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Email:</strong>{" "}
              <Link
                href={{ pathname: "mailto:codingclub@nitap.ac.in" }}
                className="text-primary hover:underline"
              >
                codingclub@nitap.ac.in
              </Link>
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

      <div className="text-center py-8 border-t mt-8">
        <p className="text-lg font-semibold text-primary mb-2">
          🏔️ Bridging the Gap, One Batch at a Time
        </p>
        <p className="text-sm text-muted-foreground">
          Campus Connect – Making campus commerce efficient, one climb at a
          time.
        </p>
      </div>
    </LegalPageLayout>
  );
}
