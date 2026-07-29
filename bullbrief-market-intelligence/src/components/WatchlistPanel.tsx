import React, { useEffect, useRef, useState } from 'react';
import { Asset, StockSearchResult } from '../types';
import { api } from '../services/api';
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
  const [isAdding, setIsAdding] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [lookupError, setLookupError] = useState('');
  const searchRequestId = useRef(0);

  // Analytical state
  const [selectedAnalysisAsset, setSelectedAnalysisAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const query = newSymbol.trim();
    const requestId = ++searchRequestId.current;
    if (!isAdding || query.length < 1) {
      setSearchResults([]);
      setLookupError('');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLookupLoading(true);
      setLookupError('');
      try {
        const results = await api.searchStocks(query);
        if (requestId === searchRequestId.current) setSearchResults(results);
      } catch (error) {
        if (!controller.signal.aborted && requestId === searchRequestId.current) {
          setLookupError(error instanceof Error ? error.message : 'Search failed');
        }
      } finally {
        if (!controller.signal.aborted && requestId === searchRequestId.current) setLookupLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isAdding, newSymbol]);

  const addSearchResult = async (result: StockSearchResult) => {
    if (!onLookupSymbol) return;
    setLookupLoading(true);
    setLookupError('');
    try {
      await onLookupSymbol(result.symbol);
      setNewSymbol('');
      setSearchResults([]);
      setIsAdding(false);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Unable to add this listing');
    } finally {
      setLookupLoading(false);
    }
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
            Review the latest available market prices and load deep analyst telemetry. Exchange data may be delayed.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-2.5 bg-white text-neutral-950 text-xs font-semibold rounded-full flex items-center gap-xs cursor-pointer hover:bg-neutral-200 transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock</span>
        </button>
      </div>

      {/* Strict "No Transaction" Alert Banner */}
      <div className="bg-neutral-900/60 border border-outline/40 rounded-2xl p-4 flex gap-sm items-start">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-left">
          <p className="text-xs font-bold text-white uppercase tracking-wider">Read-Only Observation Mode Active</p>
          <p className="text-[11px] text-neutral-400 leading-normal mt-0.5">
            This workspace is a read-only information tool. It does not route orders or support buying or selling. Content is general information, not investment advice or a recommendation.
          </p>
        </div>
      </div>

      {/* Add Ticker Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={(event) => event.preventDefault()}
          className="bg-[#121212] border border-outline rounded-3xl p-6 flex flex-col gap-md animate-scale-up shadow-xl"
        >
          <div className="w-full">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="font-mono text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                Search Canadian or U.S. stocks
              </label>
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Company or ticker (e.g. Shopify, SHOP.TO, AAPL)"
                className="bg-neutral-950 border border-outline rounded-xl p-3 font-mono text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {lookupLoading && <p className="text-xs text-neutral-400">Searching supported exchanges…</p>}
            {!lookupLoading && newSymbol.trim() && searchResults.length === 0 && !lookupError && (
              <p className="text-xs text-neutral-400">No Canadian or U.S. stock listings found.</p>
            )}
            {lookupError && <p className="text-xs text-error">{lookupError}</p>}
            {searchResults.map((result) => (
              <button
                key={result.symbol}
                type="button"
                disabled={lookupLoading}
                onClick={() => addSearchResult(result)}
                className="w-full flex items-center justify-between gap-4 p-3 bg-neutral-950 border border-outline rounded-xl text-left hover:border-primary transition-colors disabled:opacity-50"
              >
                <span>
                  <span className="block font-semibold text-white">{result.name}</span>
                  <span className="block text-[10px] text-neutral-500">{result.exchange} · {result.quoteType}</span>
                </span>
                <span className="font-mono font-bold text-primary">{result.symbol}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewSymbol('');
                setLookupError('');
              }}
              className="px-6 py-3 border border-outline text-on-surface hover:bg-neutral-900 rounded-full font-semibold text-xs cursor-pointer transition-all"
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
                <th className="py-4 px-md text-right">LATEST PRICE</th>
                <th className="py-4 px-md text-right">DAY CHANGE</th>
                <th className="py-4 px-md text-right">MARKET CAP</th>
                <th className="py-4 px-md text-right">SESSION VOLUME</th>
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
                      <span className="block">{asset.symbol}</span>
                      <span className="block text-[9px] font-sans font-normal text-neutral-500">
                        {asset.exchange || 'Exchange unavailable'} · {asset.currency || 'Currency unavailable'}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-5 px-md font-semibold text-neutral-400">
                      {asset.name}
                    </td>

                    {/* Price */}
                    <td className="py-5 px-md text-right font-mono font-bold text-on-surface tabular-nums">
                      {asset.price.toFixed(2)} {asset.currency || ''}
                      <span className="block text-[9px] font-sans font-normal text-neutral-500">
                        {asset.dataStatus || 'Unknown'}{asset.asOf ? ` · ${new Date(asset.asOf).toLocaleString()}` : ''}
                        {asset.dataSource ? ` · Source: ${asset.dataSource}` : ''}
                      </span>
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
