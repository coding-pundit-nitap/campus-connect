import { FileText, Shield } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-sm mb-3">Campus Connect</h3>
            <p className="text-sm text-muted-foreground">
              Bridging the altitude gap between campus vendors and student
              hostels at NIT Arunachal Pradesh.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={{ pathname: "/privacy" }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/terms" }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href={{ pathname: "/refund-policy" }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Contact</h3>
            <p className="text-sm text-muted-foreground">
              Coding Club @ NIT Arunachal Pradesh
            </p>
            <a
              href="mailto:codingclub@nitap.ac.in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              codingclub@nitap.ac.in
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} Campus Connect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
