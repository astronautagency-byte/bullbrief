"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketIndexResponse {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export function TickerStrip() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTickers = async () => {
      try {
        const res = await fetch(
          `/api/markets?region=us&_t=${Date.now()}`
        );
        const json = await res.json();
        if (!cancelled && json.data) {
          const usData: TickerItem[] = json.data.map((d: MarketIndexResponse) => ({
            symbol: d.symbol,
            name: d.name,
            price: d.value,
            change: d.change,
            changePercent: d.changePercent,
          }));

          const caRes = await fetch(
            `/api/markets?region=ca&_t=${Date.now()}`
          );
          const caJson = await caRes.json();
          if (!cancelled && caJson.data) {
            const caData: TickerItem[] = caJson.data.map((d: MarketIndexResponse) => ({
              symbol: d.symbol,
              name: d.name,
              price: d.value,
              change: d.change,
              changePercent: d.changePercent,
            }));
            setTickers([...usData, ...caData]);
          } else if (!cancelled) {
            setTickers(usData);
          }
        }
      } catch {}
    };

    fetchTickers();
    const interval = setInterval(fetchTickers, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (tickers.length === 0) return null;

  const doubled = [...tickers, ...tickers];

  return (
    <div className="w-full overflow-hidden bg-background border-b border-outline-variant">
      <div
        ref={scrollRef}
        className="flex items-center gap-8 py-2 px-4 animate-ticker whitespace-nowrap"
      >
        {doubled.map((t, i) => {
          const isPositive = t.change >= 0;
          const isCurrency = t.symbol === "CADUSD=X";
          return (
            <div
              key={`${t.symbol}-${i}`}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <span className="text-[11px] font-body font-semibold text-on-surface">
                {t.name}
              </span>
              <span className="text-[11px] font-body text-on-surface-variant">
                {isCurrency
                  ? t.price.toFixed(4)
                  : t.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </span>
              <span
                className={cn(
                  "text-[10px] font-mono",
                  isPositive ? "text-primary" : "text-error"
                )}
              >
                {isPositive ? "+" : ""}
                {t.changePercent.toFixed(2)}%
              </span>
              {i < doubled.length - 1 && (
                <span className="h-3 w-px bg-outline-variant ml-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
