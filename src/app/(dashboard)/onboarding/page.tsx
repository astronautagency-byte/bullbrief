"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Plus, Check, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

const INTERESTS = [
  "United States",
  "Canada",
  "Technology",
  "Automotive",
  "Financial services",
  "Energy",
  "Healthcare",
  "Consumer",
  "Cryptocurrency",
  "Global markets",
];

const SUGGESTED_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "SHOP", name: "Shopify Inc." },
  { symbol: "RY", name: "Royal Bank" },
  { symbol: "TD", name: "TD Bank" },
  { symbol: "ENB", name: "Enbridge" },
  { symbol: "CNQ", name: "Canadian Natural" },
];

const PODCAST_TOPICS = [
  "Daily market news",
  "Investing",
  "Technology",
  "Business",
  "Economics",
  "Canadian markets",
  "Entrepreneurship",
  "Cryptocurrency",
];

const BRIEFING_OPTIONS = [
  { value: "morning", label: "Morning briefing", desc: "Start your day informed" },
  { value: "market_close", label: "Market-close briefing", desc: "End-of-day wrap-up" },
  { value: "both", label: "Both", desc: "Morning and market-close" },
  { value: "none", label: "No email briefing", desc: "Just use the app" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPodcasts, setSelectedPodcasts] = useState<string[]>([]);
  const [briefingPref, setBriefingPref] = useState("morning");

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleStock = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const togglePodcast = (topic: string) => {
    setSelectedPodcasts((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const filteredStocks = SUGGESTED_STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFinish = () => {
    router.push("/brief");
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary opacity-5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BrandLogo variant="horizontal" size="md" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i + 1 <= step ? "bg-primary w-8" : "bg-surface-container-highest w-4"
                )}
              />
            ))}
          </div>
        </div>

        <div className="bg-surface-container/60 backdrop-blur-xl border border-outline-variant rounded-xl p-6 min-h-[400px]">
          {step === 1 && (
            <div className="text-center py-8">
              <h2 className="font-display font-bold text-3xl text-on-surface italic mb-4">
                Your market,
                <br />
                <span className="text-primary">summarized.</span>
              </h2>
              <p className="text-on-surface-variant max-w-sm mx-auto">
                Let&apos;s set up your personalized market briefing in just a few
                steps.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display font-bold text-xl text-on-surface mb-1">
                Choose your interests
              </h2>
              <p className="text-on-surface-variant text-sm mb-4">
                Select the topics and markets you care about
              </p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                      selectedInterests.includes(interest)
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                    )}
                  >
                    {selectedInterests.includes(interest) && (
                      <Check className="w-3.5 h-3.5 inline mr-1.5" />
                    )}
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display font-bold text-xl text-on-surface mb-1">
                Build your watchlist
              </h2>
              <p className="text-on-surface-variant text-sm mb-4">
                Add stocks you want to follow
              </p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                {filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => toggleStock(stock.symbol)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      watchlist.includes(stock.symbol)
                        ? "bg-primary/10 border-primary"
                        : "bg-surface-container border-outline-variant hover:border-primary/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-bold",
                        watchlist.includes(stock.symbol)
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-high text-on-surface-variant"
                      )}
                    >
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-sm text-on-surface block">
                        {stock.symbol}
                      </span>
                      <span className="text-xs text-on-surface-variant truncate block">
                        {stock.name}
                      </span>
                    </div>
                    {watchlist.includes(stock.symbol) && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              {watchlist.length > 0 && (
                <p className="text-xs text-on-surface-variant mt-2 font-mono">
                  {watchlist.length} stock{watchlist.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-display font-bold text-xl text-on-surface mb-1">
                Podcast interests
              </h2>
              <p className="text-on-surface-variant text-sm mb-4">
                What topics do you want in your podcast feed?
              </p>
              <div className="flex flex-wrap gap-2">
                {PODCAST_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => togglePodcast(topic)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                      selectedPodcasts.includes(topic)
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                    )}
                  >
                    {selectedPodcasts.includes(topic) && (
                      <Check className="w-3.5 h-3.5 inline mr-1.5" />
                    )}
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-display font-bold text-xl text-on-surface mb-1">
                Briefing preferences
              </h2>
              <p className="text-on-surface-variant text-sm mb-4">
                When would you like your daily briefing?
              </p>
              <div className="space-y-2">
                {BRIEFING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBriefingPref(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all",
                      briefingPref === opt.value
                        ? "bg-primary/10 border-primary"
                        : "bg-surface-container border-outline-variant hover:border-primary/30"
                    )}
                  >
                    <Clock className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-on-surface block">
                        {opt.label}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {opt.desc}
                      </span>
                    </div>
                    {briefingPref === opt.value && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)}>
              {step === 1 ? "Let&apos;s go" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish}>
              Start briefing
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-on-surface-variant/50 text-xs text-center mt-6">
          <Clock className="w-3 h-3 inline mr-1" />
          Timezone: America/New_York
        </p>
      </div>
    </div>
  );
}
