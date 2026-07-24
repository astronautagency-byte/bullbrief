import React, { useState } from 'react';
import { Asset } from '../types';
import { api } from '../services/api';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Calculator,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Flame,
  ArrowRight
} from 'lucide-react';

interface QuickPulseDashboardProps {
  watchlist: Asset[];
  searchQuery: string;
}

export default function QuickPulseDashboard({ watchlist, searchQuery }: QuickPulseDashboardProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>('NVDA');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    rating: string;
    reasoning: string[];
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Margin Calculator State
  const [collateral, setCollateral] = useState<number>(10000);
  const [leverage, setLeverage] = useState<number>(3);
  const [assetPrice, setAssetPrice] = useState<number>(150);

  const calculateMargin = () => {
    const totalBuyingPower = collateral * leverage;
    const contractUnits = totalBuyingPower / assetPrice;
    const maintenanceMargin = totalBuyingPower * 0.15; // 15% maintenance requirement
    const liquidationThresholdPrice = assetPrice - (collateral / contractUnits) * 0.85; // Est liquidation point
    return {
      buyingPower: totalBuyingPower,
      units: contractUnits.toFixed(2),
      maintenance: maintenanceMargin.toFixed(2),
      liquidation: Math.max(0, liquidationThresholdPrice).toFixed(2),
    };
  };

  const results = calculateMargin();

  const triggerAnalysis = async () => {
    const asset = watchlist.find((a) => a.symbol === selectedAsset);
    setAnalysisLoading(true);
    try {
      const analysis = await api.analyzeStock(
        selectedAsset,
        asset?.name || selectedAsset,
        asset?.price || 0,
        asset?.dayChangePercent || 0
      );
      setAiAnalysisResult(analysis);
    } catch {
      setAiAnalysisResult({
        bias: 'NEUTRAL',
        rating: '50/100',
        reasoning: ['Unable to reach AI analysis service.', 'Check that the API server is running.', 'Fallback neutral bias applied.'],
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-lg w-full animate-fade-in select-none">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-outline pb-4 gap-sm">
        <div>
          <h2 className="font-headline italic text-2xl md:text-3xl text-on-surface tracking-tight flex items-center gap-2 font-light">
            <Zap className="w-6 h-6 text-primary fill-primary/25" />
            <span>Quick Pulse Radar</span>
          </h2>
          <p className="font-sans text-xs text-secondary/80">
            High-density market briefing digests, quantitative alerts, and real-time leverage sandbox.
          </p>
        </div>
        <div className="bg-surface-container border border-outline rounded-none px-3 py-1.5 flex items-center gap-1.5 select-none">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
          <span className="font-mono text-[9px] font-bold tracking-[0.15em] uppercase text-on-surface">RADAR ACTIVE • AUTO-REFRESH</span>
        </div>
      </div>

      {/* Grid: High Density Digests and AI Sentiment Bias */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column: Tickers & Bullet Digests */}
        <div className="lg:col-span-7 flex flex-col gap-lg">
          {/* Ticker Overview Grid */}
          <div className="bg-surface border border-outline rounded-none p-md">
            <h3 className="font-mono text-[10px] font-bold text-tertiary mb-3 uppercase tracking-[0.2em]">
              INSTITUTIONAL WATCH TAPE
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
              {watchlist.slice(0, 4).map((asset) => {
                const isPositive = asset.dayChangePercent >= 0;
                return (
                  <div key={asset.symbol} className="bg-transparent border border-outline-variant rounded-none p-sm flex flex-col justify-between hover:border-primary/50 hover:bg-surface-container transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-on-surface">{asset.symbol}</span>
                      <span className={`font-mono text-[10px] font-bold ${isPositive ? 'text-primary' : 'text-error'}`}>
                        {isPositive ? '+' : ''}{asset.dayChangePercent}%
                      </span>
                    </div>
                    <div className="font-mono text-xs font-semibold tabular-nums mt-1 text-secondary">
                      ${asset.price.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High Density Bullet Digests */}
          <div className="bg-surface border border-outline rounded-none p-md flex flex-col gap-sm">
            <h3 className="font-mono text-[10px] font-bold text-tertiary border-b border-outline pb-2 uppercase tracking-[0.2em]">
              PRE-MARKET QUANT DIGESTS
            </h3>
            <div className="flex flex-col gap-5 mt-2">
              <div className="flex gap-md">
                <div className="h-6 w-6 rounded-none border border-outline text-primary bg-primary-container flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-headline italic font-semibold text-sm text-on-surface leading-tight">
                    Reverse Repo Facility Drains to $340B
                  </p>
                  <p className="font-sans text-xs text-secondary mt-1 leading-relaxed">
                    Liquidity shifts towards capital bills as yields hold steady. Suggests high-duration assets might find immediate resistance levels around the weekly opening range.
                  </p>
                </div>
              </div>

              <div className="flex gap-md">
                <div className="h-6 w-6 rounded-none border border-outline text-primary bg-primary-container flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-headline italic font-semibold text-sm text-on-surface leading-tight">
                    German 10Y Bunds Breach 2.65% Benchmark
                  </p>
                  <p className="font-sans text-xs text-secondary mt-1 leading-relaxed">
                    European bond pricing pressures global credit derivatives. Real estate and construction sector yields face imminent margin contraction indicators in Frankfurt.
                  </p>
                </div>
              </div>

              <div className="flex gap-md">
                <div className="h-6 w-6 rounded-none border border-outline text-primary bg-primary-container flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-headline italic font-semibold text-sm text-on-surface leading-tight">
                    Tokyo Inflation Re-accelerates to 2.8%
                  </p>
                  <p className="font-sans text-xs text-secondary mt-1 leading-relaxed">
                    Triggers high probability of Bank of Japan overnight interest rate normalization. Yen currency pairing exhibits heavy volatility around the 152 resistance threshold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Bias & Collateral Sandbox */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* AI Sentiment Bias Trigger */}
          <div className="bg-surface border border-outline rounded-none p-md flex flex-col gap-md">
            <div>
              <h3 className="font-mono text-[10px] font-bold text-tertiary mb-xs uppercase tracking-[0.2em]">
                AI COGNITIVE BIAS ENGINE
              </h3>
              <p className="font-sans text-xs text-secondary leading-snug">
                Select an active asset to instantly compute AI macro-sentiment positioning.
              </p>
            </div>

            <div className="flex gap-sm">
              <select
                value={selectedAsset}
                onChange={(e) => {
                  setSelectedAsset(e.target.value);
                  setAiAnalysisResult(null);
                }}
                className="flex-grow bg-surface-container-low border border-outline rounded-none p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="AAPL">AAPL (Apple Inc.)</option>
                <option value="MSFT">MSFT (Microsoft Corp.)</option>
                <option value="GOOGL">GOOGL (Alphabet Inc.)</option>
                <option value="NVDA">NVDA (NVIDIA Corp.)</option>
                <option value="TSLA">TSLA (Tesla, Inc.)</option>
                <option value="BTC">BTC (Bitcoin)</option>
              </select>

              <button
                onClick={triggerAnalysis}
                disabled={analysisLoading}
                className="px-4 py-2.5 bg-primary text-slate-950 border border-primary rounded-none text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-xs cursor-pointer hover:bg-opacity-90 active:scale-95 transition-all shrink-0 disabled:opacity-60"
              >
                <Flame className="w-3.5 h-3.5 fill-slate-950/20" />
                <span>{analysisLoading ? 'Analyzing...' : 'Trigger AI'}</span>
              </button>
            </div>

            {aiAnalysisResult ? (
              <div className="bg-surface-container border border-outline rounded-none p-md flex flex-col gap-sm animate-scale-up">
                <div className="flex items-center justify-between border-b border-outline pb-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-on-surface">{selectedAsset}</span>
                    <span className="text-xs text-secondary">| Bias Index:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-black ${
                      aiAnalysisResult.bias === 'BULLISH'
                        ? 'text-primary'
                        : aiAnalysisResult.bias === 'BEARISH'
                        ? 'text-error'
                        : 'text-secondary'
                    }`}>
                      {aiAnalysisResult.bias}
                    </span>
                    <span className="font-mono text-xs font-black bg-surface px-2 py-0.5 rounded-none border border-outline">
                      {aiAnalysisResult.rating}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-sm">
                  {aiAnalysisResult.reasoning.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-primary font-bold text-xs shrink-0">✓</span>
                      <p className="font-sans text-xs text-secondary leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-outline rounded-none p-lg text-center font-sans text-xs text-secondary/60">
                Select an asset and click "Trigger AI" to load deep-dive insights.
              </div>
            )}
          </div>

          {/* Collateral Margin Sandbox Calculator */}
          <div className="bg-surface border border-outline rounded-none p-md flex flex-col gap-sm">
            <div className="flex items-center gap-xs text-on-surface font-headline italic text-base font-semibold">
              <Calculator className="w-4.5 h-4.5 text-primary" />
              <span>Collateral Margin Sandbox</span>
            </div>
            <p className="font-sans text-xs text-secondary leading-snug">
              Estimate hypothetical buying power, leverage thresholds, and risk pricing tolerances.
            </p>

            <div className="grid grid-cols-3 gap-sm mt-xs">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Collateral ($)</label>
                <input
                  type="number"
                  value={collateral}
                  onChange={(e) => setCollateral(Math.max(0, Number(e.target.value)))}
                  className="bg-surface-container-low border border-outline rounded-none p-2 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Leverage (x)</label>
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="bg-surface-container-low border border-outline rounded-none p-2 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="1">1x (Spot)</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="5">5x</option>
                  <option value="10">10x (Pro)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-tertiary font-bold uppercase">Asset Price ($)</label>
                <input
                  type="number"
                  value={assetPrice}
                  onChange={(e) => setAssetPrice(Math.max(1, Number(e.target.value)))}
                  className="bg-surface-container-low border border-outline rounded-none p-2 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Calculations results */}
            <div className="bg-surface-container border border-outline rounded-none p-md grid grid-cols-2 gap-sm tabular-nums mt-xs">
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-tertiary font-bold">BUYING POWER</span>
                <span className="font-mono text-sm font-black text-on-surface">${results.buyingPower.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-tertiary font-bold">EST CONTRACT UNITS</span>
                <span className="font-mono text-sm font-black text-on-surface">{results.units}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-tertiary font-bold">MAINTENANCE REQ (15%)</span>
                <span className="font-mono text-sm font-black text-on-surface">${Number(results.maintenance).toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-error font-bold">EST LIQUIDATION PRICE</span>
                <span className="font-mono text-sm font-black text-error">${results.liquidation}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-secondary bg-surface-container-low p-2 border border-outline rounded-none mt-xs">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Calculated with a simulated 15% maintenance margin requirement. Real terms may vary.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
