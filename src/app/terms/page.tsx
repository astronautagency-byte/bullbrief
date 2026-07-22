import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant bg-surface-container-low/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo variant="horizontal" size="sm" />
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <h1 className="font-display font-bold text-3xl text-on-surface italic mb-6">
          Terms of Service
        </h1>
        <div className="prose prose-invert max-w-none space-y-4 text-on-surface-variant">
          <p>Last updated: January 2024</p>
          <h2 className="font-display font-bold text-xl text-on-surface">Acceptance of Terms</h2>
          <p>
            By accessing or using BullBrief, you agree to be bound by these Terms of Service.
          </p>
          <h2 className="font-display font-bold text-xl text-on-surface">Use of Service</h2>
          <p>
            BullBrief provides market information and news for informational purposes only. You may
            not use this service for any unlawful purpose.
          </p>
          <h2 className="font-display font-bold text-xl text-on-surface">Disclaimer</h2>
          <p>
            BullBrief does not provide investment, financial, legal, or tax advice. Market data may
            be delayed or incomplete. Always verify information independently before making financial
            decisions.
          </p>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-primary hover:text-primary-fixed transition-colors">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
