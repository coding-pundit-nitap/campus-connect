import {
  CheckCircle2,
  Clock,
  Coins,
  Leaf,
  Lightbulb,
  Mail,
  MapPin,
  Mountain,
  Package,
  Rocket,
  ShieldCheck,
  Target,
  User,
  Users,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { InfoCard, InfoSection } from "@/components/shared/info-components";
import LegalPageLayout from "@/components/shared/legal-page-layout";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "About Campus Connect - Smart Batch Delivery | NIT Arunachal Pradesh",
  description:
    "Learn about Campus Connect's mission to bridge the altitude gap at NIT AP. Discover our batch delivery solution connecting Lower Market vendors with hostel students efficiently.",
  keywords: [
    "campus connect about",
    "mission",
    "altitude gap solution",
    "batch delivery platform",
    "NIT AP innovation",
    "coding club project",
    "campus vendors",
    "student platform",
    "food delivery NIT AP",
    "community solution",
  ],
  authors: [{ name: "Coding Club @ NIT Arunachal Pradesh" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "About Campus Connect - Bridging the Altitude Gap",
    description:
      "Campus Connect solves NIT AP's unique 100m vertical delivery challenge through smart batch delivery. Learn about our mission, values, and innovative solution.",
    type: "website",
    locale: "en_IN",
    siteName: "Campus Connect",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Campus Connect",
    description:
      "Bridging the altitude gap between campus vendors and students at NIT Arunachal Pradesh.",
  },
  alternates: {
    canonical: "/about",
  },
};

const TOC_LINKS = [
  { id: "mission", title: "Our Mission" },
  { id: "problem", title: "The Problem" },
  { id: "solution", title: "The Solution" },
  { id: "how-it-works", title: "How It Works" },
  { id: "values", title: "Our Values" },
  { id: "future", title: "Future Roadmap" },
  { id: "contact", title: "Contact Us" },
];

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Campus Connect",
    url: "https://campusconnect.nitap.ac.in/about",
    description:
      "Learn about Campus Connect's mission to solve the altitude gap delivery challenge at NIT Arunachal Pradesh",
    inLanguage: "en-IN",
    mainEntity: {
      "@type": "Organization",
      name: "Campus Connect",
      description:
        "Hyper-local e-commerce platform bridging the altitude gap between campus vendors and students through smart batch delivery",
      foundingDate: "2026",
      foundingLocation: {
        "@type": "Place",
        name: "NIT Arunachal Pradesh",
      },
      memberOf: {
        "@type": "Organization",
        name: "Coding Club @ NIT Arunachal Pradesh",
      },
      email: "codingclub@nitap.ac.in",
      address: {
        "@type": "PostalAddress",
        streetAddress: "NIT Arunachal Pradesh",
        addressLocality: "Yupia",
        addressRegion: "Arunachal Pradesh",
        postalCode: "791112",
        addressCountry: "IN",
      },
      areaServed: {
        "@type": "Place",
        name: "NIT Arunachal Pradesh Campus",
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
        title="About Campus Connect"
        description="Bridging the 'Altitude Gap' between campus vendors and students through smart batch delivery."
        toc={TOC_LINKS}
      >
        <InfoSection title="Our Mission" id="mission">
          <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10">
            <Target className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-primary">
                Bridging the Gap
              </h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Campus Connect is on a mission to solve the unique logistical
                challenges at NIT Arunachal Pradesh. We aren't just an
                e-commerce platform; we are a community-driven solution designed
                to make campus life easier for students and business more
                profitable for local vendors.
              </p>
            </div>
          </div>
        </InfoSection>{" "}
        <InfoSection title="The Problem" id="problem">
          {" "}
          <InfoCard
            title="The 'Altitude Gap' Challenge"
            variant="warning"
            icon={<Mountain className="w-6 h-6 text-amber-600" />}
          >
            <div className="grid md:grid-cols-3 gap-6 text-center mt-2">
              <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="font-bold text-2xl text-amber-600 mb-1">
                  200m
                </div>
                <div className="text-sm font-medium">Lower Market</div>
                <div className="text-xs text-muted-foreground">
                  Vendor Location
                </div>
              </div>
              <div className="flex items-center justify-center flex-col">
                <div className="h-full w-0.5 bg-amber-200 dark:bg-amber-800 h-12 mb-2"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  100m Vertical Climb
                </span>
                <div className="h-full w-0.5 bg-amber-200 dark:bg-amber-800 h-12 mt-2"></div>
              </div>
              <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="font-bold text-2xl text-amber-600 mb-1">
                  300m
                </div>
                <div className="text-sm font-medium">Hostel Blocks</div>
                <div className="text-xs text-muted-foreground">
                  Student Location
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-muted-foreground">
              Before Campus Connect, vendors relied on chaotic WhatsApp orders
              and had to make multiple exhausting trips up the hill for
              individual deliveries. This was inefficient, unprofitable, and
              unsustainable.
            </p>
          </InfoCard>
        </InfoSection>{" "}
        <InfoSection title="Our Solution: Batch & Climb" id="solution">
          {" "}
          <div className="grid sm:grid-cols-2 gap-4">
            {" "}
            <InfoCard
              title="Smart Batching"
              icon={<Package className="w-5 h-5 text-blue-500" />}
            >
              {" "}
              <p className="text-muted-foreground text-sm">
                {" "}
                We group orders into scheduled time slots. Instead of 10 trips
                for 10 orders, vendors make 1 trip for 10 orders.{" "}
              </p>
            </InfoCard>
            <InfoCard
              title="Vendor Self-Delivery"
              icon={<User className="w-5 h-5 text-green-500" />}
            >
              <p className="text-muted-foreground text-sm">
                Vendors deliver their own orders, maintaining direct quality
                control and customer relationships without third-party runners.
              </p>
            </InfoCard>
            <InfoCard
              title="Predictable Schedule"
              icon={<Clock className="w-5 h-5 text-purple-500" />}
            >
              <p className="text-muted-foreground text-sm">
                Students know exactly when food arrives. "Next Batch: 7 PM"
                eliminates the anxiety of "30 mins ETA".
              </p>
            </InfoCard>
            <InfoCard
              title="Fair Pricing"
              icon={<Coins className="w-5 h-5 text-yellow-500" />}
            >
              <p className="text-muted-foreground text-sm">
                Transparent pricing model: Item Cost + Delivery Fee + Platform
                Fee. No hidden surges.
              </p>
            </InfoCard>
          </div>
        </InfoSection>
        <InfoSection title="How It Works" id="how-it-works">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: 1,
                title: "Browse & Order",
                desc: "Choose items and place orders before the batch closes.",
                icon: <Package />,
              },
              {
                num: 2,
                title: "Batch Grouping",
                desc: "System groups orders by hostel block and time slot.",
                icon: <Users />,
              },
              {
                num: 3,
                title: "Vendor Prepares",
                desc: "Vendors prepare bulk orders efficiently.",
                icon: <CheckCircle2 />,
              },
              {
                num: 4,
                title: "The Climb 🏔️",
                desc: "Vendors deliver batched orders to drop points.",
                icon: <Mountain />,
              },
              {
                num: 5,
                title: "OTP Verification",
                desc: "Secure delivery confirmation via OTP.",
                icon: <ShieldCheck />,
              },
            ].map((step, idx) => (
              <div
                key={step.num}
                className={cn(
                  "relative p-6 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/20",
                  idx === 3 || idx === 4 ? "md:col-span-1.5" : ""
                )}
              >
                <div className="absolute top-4 right-4 text-6xl font-black text-primary/5 select-none z-0">
                  {step.num}
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </InfoSection>
        <InfoSection title="Our Values" id="values">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Community First",
                icon: <Users className="text-blue-500" />,
                desc: "Prioritizing needs of students & vendors.",
              },
              {
                title: "Transparency",
                icon: <ShieldCheck className="text-green-500" />,
                desc: "Clear pricing, no hidden fees.",
              },
              {
                title: "Innovation",
                icon: <Lightbulb className="text-yellow-500" />,
                desc: "Tech solutions for campus problems.",
              },
              {
                title: "Sustainability",
                icon: <Leaf className="text-emerald-500" />,
                desc: "Reducing trips, saving energy.",
              },
              {
                title: "Trust",
                icon: <Target className="text-red-500" />,
                desc: "Reliable service you can depend on.",
              },
            ].map((value, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 border rounded-lg bg-card/50"
              >
                <div className="p-2 bg-background rounded-full shadow-sm border">
                  {value.icon}
                </div>
                <div>
                  <h4 className="font-medium">{value.title}</h4>
                  <p className="text-xs text-muted-foreground">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </InfoSection>
        <InfoSection title="Future Roadmap" id="future">
          <InfoCard>
            <ul className="space-y-4">
              {[
                {
                  title: "UPI Payments",
                  desc: "Seamless digital payments integration.",
                },
                {
                  title: "Live Tracking",
                  desc: "Real-time updates on your vendor's location.",
                },
                {
                  title: "Smart Recommendations",
                  desc: "AI-driven food suggestions based on history.",
                },
                {
                  title: "Expanded Services",
                  desc: "Laundry, stationery, and printout delivery.",
                },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="mt-1">
                    <Rocket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </InfoCard>
        </InfoSection>
        <InfoSection title="Join Our Journey" id="contact">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Be Part of the Solution</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Campus Connect is more than a platform – it&apos;s a community
              movement. Whether you want to order food, list your shop, or
              contribute code, we want you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="mailto:codingclub@nitap.ac.in"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Team
              </Link>
              <div className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-background border font-medium text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                NIT Arunachal Pradesh
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-8">
              Built with ❤️ by Coding Club (Coding Pundit)
            </p>
          </div>
        </InfoSection>
      </LegalPageLayout>
    </>
  );
}
