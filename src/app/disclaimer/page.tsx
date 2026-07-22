import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function DisclaimerPage() {
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
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-warning" />
          <h1 className="font-display font-bold text-3xl text-on-surface italic">
            Financial Disclaimer
          </h1>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 md:p-8 space-y-6">
          <p className="text-on-surface text-lg leading-relaxed">
            <strong className="text-on-surface">BullBrief provides market information and news
            for informational purposes only.</strong> It does not provide investment, financial,
            legal or tax advice.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            Market data may be delayed or incomplete. The information displayed on BullBrief,
            including stock prices, indices, charts, and news articles, is obtained from third-party
            data providers and may not reflect real-time market conditions.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface">Always verify information independently before
            making financial decisions.</strong> Past performance is not indicative of future
            results. Investing in securities involves risk, including the potential loss of
            principal.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            BullBrief, its operators, and affiliates are not registered investment advisors,
            broker-dealers, or financial planners. Nothing on this platform should be construed
            as an offer to sell, a solicitation of an offer to buy, or a recommendation for any
            security.
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
