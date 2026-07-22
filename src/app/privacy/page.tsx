import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <div className="prose prose-invert max-w-none space-y-4 text-on-surface-variant">
          <p>Last updated: January 2024</p>
          <h2 className="font-display font-bold text-xl text-on-surface">Information We Collect</h2>
          <p>
            We collect information you provide directly, such as your name, email address, and
            watchlist preferences. We also collect usage data to improve our service.
          </p>
          <h2 className="font-display font-bold text-xl text-on-surface">How We Use Your Information</h2>
          <p>
            Your information is used to provide and improve the BullBrief service, personalize your
            market briefing, and communicate with you about your account.
          </p>
          <h2 className="font-display font-bold text-xl text-on-surface">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction.
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
