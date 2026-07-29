import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketTickers } from '../hooks/useMarketTickers';

const FALLBACK_TICKERS = [
  { label: 'SPX 500', price: 5432.12, changePercent: 1.24 },
  { label: 'NASDAQ', price: 18624.5, changePercent: 1.85 },
  { label: 'DOW JONES', price: 39812.2, changePercent: 0.18 },
  { label: 'BTC/USD', price: 68490, changePercent: 3.4 },
  { label: 'US 10Y', price: 4.825, changePercent: -0.015, suffix: '%' },
  { label: 'EUR/USD', price: 1.0844, changePercent: -0.12 },
];

export default function MarketTickerBar() {
  const { tickers, loading } = useMarketTickers(60000);
  const display = tickers.length > 0 ? tickers : FALLBACK_TICKERS;

  const formatPrice = (price: number, suffix?: string) => {
    if (suffix === '%') return `${price.toFixed(3)}%`;
    if (price > 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toFixed(4);
  };

  return (
    <section className="bg-surface/40 border border-outline rounded-xl py-3 px-4 select-none backdrop-blur-sm">
      <div className="flex items-center justify-between gap-lg min-w-[760px] tabular-nums font-mono text-[11px] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-xs pr-md border-r border-outline shrink-0">
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400' : 'bg-primary'} ${!loading ? 'animate-ping' : ''}`} />
          <span className="font-bold text-on-surface tracking-wider uppercase">
            {loading ? 'Syncing Markets...' : 'Latest Market Data:'}
          </span>
        </div>

        {display.map((ticker) => {
          const positive = ticker.changePercent >= 0;
          const suffix = 'suffix' in ticker ? ticker.suffix : undefined;
          const prefix = ticker.label === 'BTC/USD' ? '$' : '';

          return (
            <div key={ticker.label} className="flex items-center gap-xs">
              <span className="text-secondary font-bold">{ticker.label}</span>
              <span className="text-on-surface font-semibold">
                {prefix}{formatPrice(ticker.price, suffix)}
              </span>
              <span className={`${positive ? 'text-primary' : 'text-error'} flex items-center gap-0.5 font-bold`}>
                {positive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                {positive ? '+' : ''}{ticker.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
