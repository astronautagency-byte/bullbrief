import React, { useState } from 'react';
import { Asset } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Search,
  Sparkles,
  Layers,
  LineChart,
  Target,
  Activity,
  AlertTriangle,
  Info
} from 'lucide-react';

interface WatchlistPanelProps {
  watchlist: Asset[];
  onAddAsset: (asset: Asset) => void;
  onRemoveAsset: (symbol: string) => void;
  onLookupSymbol?: (symbol: string) => Promise<void>;
}

export default function WatchlistPanel({ watchlist, onAddAsset, onRemoveAsset, onLookupSymbol }: WatchlistPanelProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('150');
  const [isAdding, setIsAdding] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Analytical state
  const [selectedAnalysisAsset, setSelectedAnalysisAsset] = useState<Asset | null>(null);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !newName) {
      alert('Please fill out Ticker and Asset Name.');
      return;
    }

    const priceNum = parseFloat(newPrice) || 100.0;
    const changePct = parseFloat((Math.random() * 6 - 3).toFixed(2)); // random -3% to +3%
    const changeAmt = parseFloat((priceNum * (changePct / 100)).toFixed(2));

    const newAsset: Asset = {
      symbol: newSymbol.toUpperCase(),
      name: newName,
      price: priceNum,
      dayChangePercent: changePct,
      dayChangeAmount: changeAmt,
      marketCap: `${(Math.random() * 500 + 10).toFixed(1)}B`,
      volume24h: `${(Math.random() * 50 + 2).toFixed(1)}M`,
    };

    onAddAsset(newAsset);
    setNewSymbol('');
    setNewName('');
    setNewPrice('150');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-lg w-full animate-fade-in select-none">
      {/* Title block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-outline/35 pb-4 gap-sm">
        <div>
          <h2 className="font-serif italic text-2xl md:text-3xl text-on-surface tracking-tight flex items-center gap-2 font-light">
            <span>Workspace Watchlist</span>
          </h2>
          <p className="font-sans text-xs text-secondary">
            Deconstruct high-conviction market streams, review real-time spot changes, and load deep analyst telemetry.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-2.5 bg-white text-neutral-950 text-xs font-semibold rounded-full flex items-center gap-xs cursor-pointer hover:bg-neutral-200 transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Ticker</span>
        </button>
      </div>

      {/* Strict "No Transaction" Alert Banner */}
      <div className="bg-neutral-900/60 border border-outline/40 rounded-2xl p-4 flex gap-sm items-start">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-left">
          <p className="text-xs font-bold text-white uppercase tracking-wider">Read-Only Observation Mode Active</p>
          <p className="text-[11px] text-neutral-400 leading-normal mt-0.5">
            This workspace operates strictly as a read-only market monitor. Under federal compliance guidelines, transactional features, buying, selling, or order routing operations are disabled on this terminal.
          </p>
        </div>
      </div>

      {/* Add Ticker Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateAsset}
          className="bg-[#121212] border border-outline rounded-3xl p-6 flex flex-col md:flex-row items-end gap-md animate-scale-up shadow-xl"
        >
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="font-mono text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Ticker Symbol (e.g. NFLX)</label>
              <input
                type="text"
                required
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Ticker"
                className="bg-neutral-950 border border-outline rounded-xl p-3 font-mono text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="font-mono text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Asset Name (e.g. Netflix Inc.)</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Company Name"
                className="bg-neutral-950 border border-outline rounded-xl p-3 font-sans text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="font-mono text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Current Spot Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Price"
                className="bg-neutral-950 border border-outline rounded-xl p-3 font-mono text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            {onLookupSymbol && newSymbol.trim() && (
              <button
                type="button"
                disabled={lookupLoading}
                onClick={async () => {
                  setLookupLoading(true);
                  try {
                    await onLookupSymbol(newSymbol.trim());
                    setNewSymbol('');
                    setNewName('');
                    setIsAdding(false);
                  } finally {
                    setLookupLoading(false);
                  }
                }}
                className="flex-1 md:flex-initial px-6 py-3 bg-white text-neutral-950 font-semibold text-xs rounded-full cursor-pointer hover:bg-neutral-200 transition-all shadow disabled:opacity-50"
              >
                {lookupLoading ? 'Looking up...' : 'Fetch Live Quote'}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 md:flex-initial px-6 py-3 bg-primary text-slate-950 font-semibold text-xs rounded-full cursor-pointer hover:bg-opacity-90 active:scale-95 transition-all shadow"
            >
              Save Asset
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 md:flex-initial px-6 py-3 border border-outline text-on-surface hover:bg-neutral-900 rounded-full font-semibold text-xs cursor-pointer transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Watchlist Table */}
      <section className="bg-[#121212] border border-outline rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-outline bg-neutral-950/20 text-neutral-500 font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
                <th className="py-4 px-lg">ASSET CODE</th>
                <th className="py-4 px-md">COMPANY NAME</th>
                <th className="py-4 px-md text-right">SPOT PRICE</th>
                <th className="py-4 px-md text-right">DAY CHANGE</th>
                <th className="py-4 px-md text-right">MARKET CAP</th>
                <th className="py-4 px-md text-right">24H VOLUME</th>
                <th className="py-4 px-lg text-center">ACTION DECK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-sans text-xs">
              {watchlist.map((asset) => {
                const isPositive = asset.dayChangePercent >= 0;
                return (
                  <tr
                    key={asset.symbol}
                    className="hover:bg-neutral-950/40 transition-colors group cursor-pointer"
                  >
                    {/* Ticker Symbol */}
                    <td className="py-5 px-lg font-mono font-black text-on-surface text-sm">
                      {asset.symbol}
                    </td>

                    {/* Name */}
                    <td className="py-5 px-md font-semibold text-neutral-400">
                      {asset.name}
                    </td>

                    {/* Price */}
                    <td className="py-5 px-md text-right font-mono font-bold text-on-surface tabular-nums">
                      ${asset.price.toFixed(2)}
                    </td>

                    {/* Delta Percentage Change */}
                    <td className="py-5 px-md text-right tabular-nums">
                      <div className={`inline-flex items-center gap-0.5 font-mono text-[10px] uppercase font-bold rounded-full px-2.5 py-0.5 ${
                        isPositive
                          ? 'bg-[#12D162]/10 text-primary border border-primary/15'
                          : 'bg-error/10 text-error border border-error/15'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{isPositive ? '+' : ''}{asset.dayChangePercent.toFixed(2)}%</span>
                      </div>
                    </td>

                    {/* Market Cap */}
                    <td className="py-5 px-md text-right font-mono text-neutral-500 font-semibold">
                      {asset.marketCap}
                    </td>

                    {/* 24h Volume */}
                    <td className="py-5 px-md text-right font-mono text-neutral-500 font-semibold">
                      {asset.volume24h}
                    </td>

                    {/* Delete / View Info */}
                    <td className="py-5 px-lg text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedAnalysisAsset(asset)}
                          className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-outline text-white hover:text-primary text-[10px] font-semibold uppercase tracking-wider rounded-full cursor-pointer transition-all"
                        >
                          Asset Intel
                        </button>
                        <button
                          onClick={() => onRemoveAsset(asset.symbol)}
                          className="p-1.5 text-neutral-500 hover:text-error hover:bg-error/10 rounded-full cursor-pointer transition-all border border-transparent"
                          title="Purge Ticker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Simulated Analyst Profile Modal Overlay */}
      {selectedAnalysisAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-md select-none">
          <div className="bg-[#121212] border border-outline rounded-3xl max-w-lg w-full shadow-2xl animate-scale-up overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-outline/30 flex items-center justify-between bg-neutral-900/10 text-on-surface">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Quantitative Analyst Deck
                </h3>
              </div>
              <button
                onClick={() => setSelectedAnalysisAsset(null)}
                className="text-neutral-500 hover:text-white font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-md">
              {/* Asset Snapshot Row */}
              <div className="flex items-center justify-between border-b border-outline/30 pb-sm text-left">
                <div>
                  <span className="font-mono text-2xl font-black text-white">{selectedAnalysisAsset.symbol}</span>
                  <span className="text-xs text-neutral-500 ml-1.5 font-medium">({selectedAnalysisAsset.name})</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-white block">${selectedAnalysisAsset.price.toFixed(2)}</span>
                  <span className="block font-mono text-[9px] text-neutral-500 font-bold uppercase tracking-wider">SPOT REFERENCE</span>
                </div>
              </div>

              {/* Read-Only Operational Metrics Grid */}
              <div className="grid grid-cols-2 gap-sm" id="operational-metrics-deck">
                <div className="bg-neutral-950 border border-outline rounded-2xl p-4 flex flex-col items-start text-left">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <Target className="w-3.5 h-3.5" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Analyst Target</span>
                  </div>
                  <span className="text-white font-bold font-mono text-sm mt-1">
                    ${(selectedAnalysisAsset.price * 1.14).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-primary font-semibold mt-0.5">
                    +14.0% Upside Forecast
                  </span>
                </div>

                <div className="bg-neutral-950 border border-outline rounded-2xl p-4 flex flex-col items-start text-left">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <LineChart className="w-3.5 h-3.5" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Volatility (Beta)</span>
                  </div>
                  <span className="text-white font-bold font-mono text-sm mt-1">
                    {(1.0 + Math.random() * 0.4).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                    Institutional Benchmark
                  </span>
                </div>

                <div className="bg-neutral-950 border border-outline rounded-2xl p-4 flex flex-col items-start text-left">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider">52W Range Benchmark</span>
                  </div>
                  <span className="text-white font-bold font-mono text-xs mt-1.5">
                    ${(selectedAnalysisAsset.price * 0.82).toFixed(2)} - ${(selectedAnalysisAsset.price * 1.12).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                    Annual Trading Bound
                  </span>
                </div>

                <div className="bg-neutral-950 border border-outline rounded-2xl p-4 flex flex-col items-start text-left">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider">AI Consensus Rating</span>
                  </div>
                  <span className="text-primary font-bold text-xs mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                    ● High Accumulate
                  </span>
                  <span className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                    Cognitive Index Score
                  </span>
                </div>
              </div>

              {/* Smart Analyst Summary Card */}
              <div className="bg-neutral-900/60 border border-outline/35 rounded-2xl p-4 text-left">
                <span className="font-mono text-[9px] font-bold text-primary uppercase tracking-wider">Macro Structural Summary</span>
                <p className="text-[11px] text-neutral-400 leading-relaxed mt-1.5 font-medium">
                  Institutional flow metrics show net-positive buyer concentration for {selectedAnalysisAsset.symbol} over the past 45 trading sessions. Options open-interest exhibits substantial call concentration near the next major standard deviation threshold.
                </p>
              </div>

              {/* Safety Compliance warning line */}
              <div className="flex gap-2 text-[10px] text-neutral-400 bg-neutral-950/60 border border-outline rounded-2xl p-3">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Simulated Sandbox Telemetry. No live broker links or transactional trading mechanisms are established on this node. Use purely for informational market analysis.</span>
              </div>
            </div>

            <div className="p-6 bg-neutral-950 border-t border-outline/30 flex justify-end select-none">
              <button
                onClick={() => setSelectedAnalysisAsset(null)}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-outline text-white hover:text-primary rounded-full font-semibold text-xs transition-all cursor-pointer text-center"
              >
                Close Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
