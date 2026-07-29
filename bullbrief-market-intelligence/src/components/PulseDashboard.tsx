import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { NewsItem, BriefingItem, Asset, User } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};
import {
  Play,
  Pause,
  Volume2,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Share2,
  Bookmark,
  ChevronRight,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  ChevronDown,
  ArrowUpRight,
  ListFilter,
  Layers,
  HelpCircle,
  Trash2
} from 'lucide-react';
import WealthsimpleChart from './WealthsimpleChart';
import MarketTickerBar from './MarketTickerBar';
import { api, type NewsAnalysis } from '../services/api';

interface PulseDashboardProps {
  news: NewsItem[];
  briefings: BriefingItem[];
  watchlist: Asset[];
  user: User | null;
  searchQuery: string;
  onAddToWatchlist: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
  setActivePage: (page: string) => void;
}

// Portfolio account items with math summing up to exactly $248,340.50
const PORTFOLIO_ACCOUNTS = [
  {
    id: 'acct-chequing',
    name: 'Chequing',
    type: 'Chequing portfolio',
    value: 12450.80,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/25',
    initial: 'C'
  },
  {
    id: 'acct-savings',
    name: 'USD savings',
    type: 'High-yield savings',
    value: 45210.00,
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/25',
    initial: 'S'
  },
  {
    id: 'acct-tfsa',
    name: 'TFSA',
    type: 'Tax-Free Savings Account',
    value: 85420.00,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/25',
    initial: 'T'
  },
  {
    id: 'acct-rrsp',
    name: 'RRSP',
    type: 'Registered Retirement Savings Plan',
    value: 105259.70,
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/25',
    initial: 'R'
  }
];

// High-end portfolio holdings mock data
const PORTFOLIO_HOLDINGS = [
  { symbol: 'GOLD', name: 'SPDR Gold Shares', shares: '45.0', value: 9812.50, change: 1.25 },
  { symbol: 'SIVR', name: 'Aberdeen Physical Silver', shares: '120.0', value: 3048.00, change: -0.84 },
  { symbol: 'RY', name: 'Royal Bank of Canada', shares: '85.0', value: 11475.00, change: 0.62 },
  { symbol: 'EUFN', name: 'iShares MSCI Europe Fin', shares: '150.0', value: 3240.00, change: -1.15 },
  { symbol: 'VFV', name: 'Vanguard S&P 500 ETF', shares: '180.0', value: 21600.00, change: 1.84 },
  { symbol: 'GOOGL', name: 'Alphabet Inc Class A', shares: '55.0', value: 7845.75, change: -0.88 }
];

export default function PulseDashboard({
  news,
  briefings,
  watchlist,
  user,
  searchQuery,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  setActivePage,
}: PulseDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'markets' | 'crypto' | 'forex'>('all');
  const [sentimentValue, setSentimentValue] = useState<number>(72);
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [briefingTime, setBriefingTime] = useState(160); // 2 mins 40s in seconds
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsAnalysis, setNewsAnalysis] = useState<NewsAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Wealthsimple Portfolio Specific States
  const [showBalances, setShowBalances] = useState<boolean>(() => {
    const saved = localStorage.getItem('bullbrief_show_balances');
    return saved !== null ? saved === 'true' : true;
  });
  const [selectedInterval, setSelectedInterval] = useState<'1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL'>('1M');
  const [selectedMetric, setSelectedMetric] = useState<'value' | 'returns'>('value');
  const [market, setMarket] = useState<'USA' | 'Canada'>('USA');
  const [sidebarTab, setSidebarTab] = useState<'watchlist' | 'holdings'>('holdings');

  // Chart hover tracker states
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [hoveredPercent, setHoveredPercent] = useState<number | null>(null);

  // Persist show balances state
  useEffect(() => {
    localStorage.setItem('bullbrief_show_balances', String(showBalances));
  }, [showBalances]);

  useEffect(() => {
    if (!selectedNews) {
      setNewsAnalysis(null);
      return;
    }

    let cancelled = false;
    setAnalysisLoading(true);

    api
      .analyzeNews(selectedNews.title, selectedNews.text, selectedNews.source)
      .then((analysis) => {
        if (!cancelled) setNewsAnalysis(analysis);
      })
      .catch(() => {
        if (!cancelled) setNewsAnalysis(null);
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedNews]);

  // Audio simulation timer
  useEffect(() => {
    let timer: any;
    if (isPlayingBriefing) {
      timer = setInterval(() => {
        setBriefingTime((prev) => {
          if (prev >= 735) { // 12:15 cap
            setIsPlayingBriefing(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / audioSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlayingBriefing, audioSpeed]);

  const formatBriefingDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickAdd = (sym: string) => {
    if (!sym) return;
    onAddToWatchlist(sym);
  };

  // Filter news based on category and search query
  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSentimentText = (val: number) => {
    if (val < 35) return { text: 'Extreme Bearish', color: 'text-error' };
    if (val < 48) return { text: 'Moderately Bearish', color: 'text-orange-500' };
    if (val < 55) return { text: 'Neutral Consolidation', color: 'text-secondary' };
    if (val < 80) return { text: 'Moderately Bullish', color: 'text-primary' };
    return { text: 'High Conviction Bullish', color: 'text-primary' };
  };

  const sentimentInfo = getSentimentText(sentimentValue);

  // Dynamic values depending on selected interval and market index
  const getIntervalDefaults = () => {
    if (market === 'USA') {
      switch (selectedInterval) {
        case '1M': return { total: 5430.50, change: 150.50, pct: 2.85, period: 'past month', label: 'S&P 500 INDEX' };
        case '3M': return { total: 5430.50, change: 310.50, pct: 6.07, period: 'past 3 months', label: 'S&P 500 INDEX' };
        case '6M': return { total: 5430.50, change: 580.50, pct: 11.97, period: 'past 6 months', label: 'S&P 500 INDEX' };
        case 'YTD': return { total: 5430.50, change: 660.50, pct: 13.85, period: 'year to date', label: 'S&P 500 INDEX' };
        case '1Y': return { total: 5430.50, change: 980.50, pct: 22.03, period: 'past year', label: 'S&P 500 INDEX' };
        case 'ALL': return { total: 5430.50, change: 2230.50, pct: 69.70, period: 'all time', label: 'S&P 500 INDEX' };
      }
    } else {
      switch (selectedInterval) {
        case '1M': return { total: 22340.50, change: 490.50, pct: 2.24, period: 'past month', label: 'S&P/TSX COMPOSITE INDEX' };
        case '3M': return { total: 22340.50, change: 890.50, pct: 4.15, period: 'past 3 months', label: 'S&P/TSX COMPOSITE INDEX' };
        case '6M': return { total: 22340.50, change: 1490.50, pct: 7.15, period: 'past 6 months', label: 'S&P/TSX COMPOSITE INDEX' };
        case 'YTD': return { total: 22340.50, change: 1760.50, pct: 8.55, period: 'year to date', label: 'S&P/TSX COMPOSITE INDEX' };
        case '1Y': return { total: 22340.50, change: 2490.50, pct: 12.54, period: 'past year', label: 'S&P/TSX COMPOSITE INDEX' };
        case 'ALL': return { total: 22340.50, change: 6140.50, pct: 37.90, period: 'all time', label: 'S&P/TSX COMPOSITE INDEX' };
      }
    }
  };

  const intervalDefaults = getIntervalDefaults() || { total: 5430.50, change: 150.50, pct: 2.85, period: 'past month', label: 'S&P 500 INDEX' };

  // If hovered, show hovered stats, otherwise defaults
  const displayValue = hoveredValue !== null ? hoveredValue : intervalDefaults.total;
  const displayChangePercent = hoveredPercent !== null ? hoveredPercent : intervalDefaults.pct;
  const displayChangeAmount = hoveredValue !== null ? (hoveredValue - (intervalDefaults.total / (1 + intervalDefaults.pct / 100))) : intervalDefaults.change;
  const isPositiveChange = displayChangePercent >= 0;

  const isCanadianSymbol = (sym: string) => {
    return ['RY', 'TD', 'SHOP', 'CNR', 'ENB', 'CSU'].includes(sym.toUpperCase()) || sym.toUpperCase().endsWith('.TO');
  };
  const filteredWatchlist = watchlist.filter(asset => {
    const isCad = isCanadianSymbol(asset.symbol);
    return market === 'Canada' ? isCad : !isCad;
  });

  // Format currency helper
  const formatCurrency = (val: number) => {
    if (!showBalances) return '• • • • • •';
    return val.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Greeting helper based on time
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-lg w-full text-on-surface"
    >
      {/* Ticker Tape */}
      <motion.section variants={cardVariants}>
        <MarketTickerBar />
      </motion.section>

      {/* Main Wealthsimple-Style Core Screen split layout */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-lg items-start" id="wealthsimple-portfolio-dashboard">
        {/* Left Column (Wide) */}
        <motion.div
          variants={containerVariants}
          className="xl:col-span-8 flex flex-col gap-lg bg-transparent"
        >
          {/* Header & Market Toggle */}
          <motion.div
            variants={cardVariants}
            className="flex flex-col gap-sm select-none"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
              <div className="flex flex-col text-left">
                <span className="font-serif italic text-2xl text-secondary font-light">
                  {getGreeting()}, {user?.name.split(' ')[0] || 'Katherine'}
                </span>
                <span className="font-sans text-[10px] text-tertiary uppercase tracking-[0.2em] font-bold mt-1">
                  Institutional Market Monitor
                </span>
              </div>

              {/* USA vs Canada Toggle */}
              <div className="flex bg-neutral-900 border border-outline rounded-full p-0.5 self-start sm:self-center">
                <button
                  onClick={() => {
                    setMarket('USA');
                    setHoverIdxNull();
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                    market === 'USA'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  🇺🇸 USA Markets
                </button>
                <button
                  onClick={() => {
                    setMarket('Canada');
                    setHoverIdxNull();
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                    market === 'Canada'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  🇨🇦 Canada Markets
                </button>
              </div>
            </div>

            <div className="flex flex-col text-left gap-xs mt-sm">
              <span className="text-[11px] font-mono font-bold tracking-wider text-primary uppercase">
                {intervalDefaults?.label || 'S&P 500 INDEX'}
              </span>

              <div className="flex items-baseline gap-sm">
                <span className="font-sans text-4xl font-medium tracking-tight text-white tabular-nums">
                  {showBalances ? displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' pts' : '• • • • • •'}
                </span>

                {/* Eye Button toggle */}
                <button
                  onClick={() => setShowBalances(!showBalances)}
                  className="p-1.5 rounded-full hover:bg-neutral-800 text-tertiary hover:text-white transition-colors cursor-pointer"
                  title={showBalances ? "Hide values" : "Show values"}
                >
                  {showBalances ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Performance metrics display */}
              <div className="flex items-center gap-1.5 font-sans text-xs mt-0.5 tabular-nums">
                {showBalances ? (
                  <>
                    <span className={`font-semibold ${isPositiveChange ? 'text-primary' : 'text-error'}`}>
                      {isPositiveChange ? '+' : ''}{displayChangeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts
                    </span>
                    <span className={`font-semibold ${isPositiveChange ? 'text-primary' : 'text-error'}`}>
                      ({isPositiveChange ? '+' : ''}{displayChangePercent.toFixed(2)}%)
                    </span>
                  </>
                ) : (
                  <span className="text-neutral-500 font-semibold">• • • • (• • •%)</span>
                )}
                <span className="text-neutral-500">
                  {hoveredValue !== null ? 'at hover point' : intervalDefaults?.period}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Custom SVG Chart */}
          <motion.div
            variants={cardVariants}
            className="bg-neutral-950/20 border border-outline rounded-2xl p-md flex flex-col gap-md relative overflow-hidden"
          >
            <WealthsimpleChart
              selectedInterval={selectedInterval}
              selectedMetric={selectedMetric}
              showBalances={showBalances}
              onHoverPoint={(val, pct) => {
                setHoveredValue(val);
                setHoveredPercent(pct);
              }}
              market={market}
            />

            {/* Chart Sub Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-md border-t border-outline/40 pt-md select-none">
              {/* Interval Selectors */}
              <div className="flex bg-neutral-900/60 rounded-full p-0.5 border border-outline">
                {(['1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as const).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => {
                      setSelectedInterval(interval);
                      setHoverIdxNull();
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedInterval === interval
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {interval}
                  </button>
                ))}
              </div>

              {/* Value / Returns Pill Toggles */}
              <div className="flex bg-neutral-900/60 rounded-full p-0.5 border border-outline">
                <button
                  onClick={() => setSelectedMetric('value')}
                  className={`px-4 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedMetric === 'value'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Value
                </button>
                <button
                  onClick={() => setSelectedMetric('returns')}
                  className={`px-4 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedMetric === 'returns'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Returns
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stocks Katherine is Watching Section */}
          <motion.div
            variants={cardVariants}
            className="flex flex-col gap-sm"
            id="katherine-watchlist-section"
          >
            <div className="flex items-center justify-between px-1 select-none">
              <div className="flex flex-col text-left">
                <h3 className="font-sans font-semibold text-lg text-white">
                  Stocks Katherine is Watching
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Latest available observation for {market === 'USA' ? 'US Equities (USD)' : 'Canadian Equities (CAD)'}. Data may be delayed.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                {market === 'USA' ? 'NASDAQ & NYSE' : 'TSX COMPOSITE'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              {filteredWatchlist.length === 0 ? (
                <div className="col-span-2 p-8 border border-outline border-dashed rounded-2xl text-center text-secondary text-xs">
                  No {market === 'USA' ? 'US' : 'Canadian'} stocks are currently in your watch list. Use the quick-add input below.
                </div>
              ) : (
                filteredWatchlist.map((asset) => {
                  const isPositive = asset.dayChangePercent >= 0;
                  return (
                    <div
                      key={asset.symbol}
                      className="flex flex-col justify-between p-4 bg-neutral-900/40 hover:bg-neutral-900/70 border border-outline rounded-2xl transition-all duration-200 select-none group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-sm">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border border-outline bg-neutral-800 text-white font-mono group-hover:border-primary transition-colors">
                            {asset.symbol.slice(0, 3)}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold text-white tracking-tight group-hover:text-primary transition-colors">
                              {asset.symbol}
                            </span>
                            <span className="text-xs text-neutral-500 font-medium truncate max-w-[150px]">
                              {asset.name}
                            </span>
                          </div>
                        </div>

                        {/* Sparkline Visual - Miniature trend visual inside card */}
                        <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
                          <svg className="w-full h-full" viewBox="0 0 100 30">
                            <path
                              d={isPositive 
                                ? "M 0 20 Q 25 10 50 15 T 100 5" 
                                : "M 0 5 Q 25 20 50 10 T 100 25"
                              }
                              fill="none"
                              stroke={isPositive ? '#12D162' : '#FF5C5C'}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-white font-mono">
                            {showBalances ? `${market === 'Canada' ? 'C$' : '$'}${asset.price.toFixed(2)}` : '• • • • •'}
                          </span>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold font-mono">
                            MCAP: {asset.marketCap}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                            isPositive 
                              ? 'text-primary border-primary/20 bg-primary/10' 
                              : 'text-error border-error/20 bg-error/10'
                          }`}>
                            {isPositive ? '+' : ''}{asset.dayChangePercent.toFixed(2)}%
                          </span>

                          {/* Quick delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromWatchlist(asset.symbol);
                            }}
                            className="p-1 hover:bg-neutral-800 rounded-full text-neutral-500 hover:text-error transition-colors cursor-pointer"
                            title="Remove from watch list"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick add widget for adding to watch list */}
            <div className="p-4 bg-neutral-900/20 border border-outline/50 rounded-2xl flex flex-col md:flex-row items-center gap-md">
              <div className="flex-1 text-left">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Add to WATCHLIST</span>
                <p className="text-[11px] text-neutral-500 leading-normal mt-0.5">Quickly track any new public ticker on this observation workspace.</p>
              </div>

              <div className="flex items-center gap-sm w-full md:w-auto">
                <div className="relative flex-1 md:w-32">
                  <input
                    type="text"
                    placeholder="Ticker (e.g. NVDA)"
                    id="quick-add-symbol"
                    className="w-full bg-neutral-900 border border-outline rounded-full px-4 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-primary font-mono uppercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          handleQuickAdd(val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    const inputEl = document.getElementById('quick-add-symbol') as HTMLInputElement;
                    if (inputEl && inputEl.value.trim()) {
                      handleQuickAdd(inputEl.value.trim());
                      inputEl.value = '';
                    }
                  }}
                  className="bg-white text-neutral-950 hover:bg-neutral-200 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                >
                  Watch
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Sidebar Column (Narrower) */}
        <div className="xl:col-span-4 flex flex-col gap-lg">
          {/* Advisor Action Hub */}
          <div className="bg-[#121212] border border-outline rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden select-none shadow-xl">
            <div className="flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-primary font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                  Research Review Hub
                </span>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>

              <h4 className="text-white font-serif italic text-lg tracking-tight mt-sm">
                Katherine's Daily Focus
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                General market briefings and research topics for review:
              </p>

              <div className="flex flex-col gap-xs mt-2">
                <div className="flex items-start gap-2 p-2.5 bg-neutral-900/60 border border-outline/30 rounded-xl text-left">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">Fed Liquidity Pause</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5 font-medium leading-normal">Monitor rate sensitivity on high-beta client allocations.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 bg-neutral-900/60 border border-outline/30 rounded-xl text-left">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">Yield Curve Support</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5 font-medium leading-normal">Yields near 4.8% offer high-quality entry points for conservative ladders.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 bg-neutral-900/60 border border-outline/30 rounded-xl text-left">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">Sector Rebalancing</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5 font-medium leading-normal">Lock in select gains ahead of upcoming regional policy adjustments.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-outline/30 mt-4 pt-3 flex items-center justify-between text-[11px] font-semibold">
              <span className="text-neutral-500 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1" onClick={() => alert('Opening Advisory Strategy PDF...')}>
                View 2026 Strategy Guides <ArrowRight className="w-3 h-3" />
              </span>
              <span className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                Active
              </span>
            </div>
          </div>

          {/* Holdings / Watchlist tab Card */}
          <div className="bg-[#121212] border border-outline rounded-3xl p-5 flex flex-col gap-md select-none">
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-outline/40 pb-sm">
              <div className="flex bg-neutral-900 rounded-full p-0.5 border border-outline">
                <button
                  onClick={() => setSidebarTab('holdings')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    sidebarTab === 'holdings'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Holdings
                </button>
                <button
                  onClick={() => setSidebarTab('watchlist')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    sidebarTab === 'watchlist'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Watchlist
                </button>
              </div>

              {/* Sub controls layout */}
              <div className="flex items-center gap-2 text-neutral-500">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase">1D</span>
                <button className="p-1 hover:bg-neutral-800 rounded-full hover:text-white cursor-pointer transition-colors" title="Sort List">
                  <ListFilter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List entries */}
            <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto scrollbar-none">
              {sidebarTab === 'holdings' ? (
                PORTFOLIO_HOLDINGS.map((holding) => {
                  const itemPositive = holding.change >= 0;
                  return (
                    <div
                      key={holding.symbol}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-sm">
                        {/* Circle Avatar with ticker initials */}
                        <div className="w-8 h-8 rounded-full bg-neutral-900 border border-outline flex items-center justify-center font-bold text-xs text-white uppercase shrink-0 group-hover:border-primary transition-colors">
                          {holding.symbol.slice(0, 2)}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-white uppercase tracking-tight">{holding.symbol}</span>
                          <span className="text-[10px] text-neutral-500 font-medium truncate max-w-[120px]">{holding.name}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col font-mono tracking-tight text-xs">
                        <span className="text-white font-semibold">
                          {formatCurrency(holding.value)}
                        </span>
                        <span className={`text-[10px] font-medium ${itemPositive ? 'text-primary' : 'text-error'}`}>
                          {itemPositive ? '▲' : '▼'} {Math.abs(holding.change).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                watchlist.map((asset) => {
                  const itemPositive = asset.dayChangePercent >= 0;
                  return (
                    <div
                      key={asset.symbol}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 border border-outline flex items-center justify-center font-bold text-xs text-white uppercase shrink-0 group-hover:border-primary transition-colors">
                          {asset.symbol.slice(0, 2)}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-white uppercase tracking-tight">{asset.symbol}</span>
                          <span className="text-[10px] text-neutral-500 font-medium truncate max-w-[120px]">{asset.name}</span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col font-mono tracking-tight text-xs">
                        <span className="text-white font-semibold">
                          {showBalances ? `$${asset.price.toFixed(2)}` : '• • • • •'}
                        </span>
                        <span className={`text-[10px] font-medium ${itemPositive ? 'text-primary' : 'text-error'}`}>
                          {itemPositive ? '+' : ''}{asset.dayChangePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-outline/30 pt-3 text-center">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" /> LATEST AVAILABLE STREAM
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-outline/40 my-md" />

      {/* Section 2: Macro Intelligence Deck (Audio Briefing & Sentiment Dial) */}
      <motion.section
        variants={containerVariants}
        className="flex flex-col gap-sm"
        id="intelligence-briefing-core"
      >
        <div className="flex items-center justify-between select-none">
          <div>
            <h3 className="font-serif italic text-xl text-white font-light">Today's Intelligence Core</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Macro summaries, attributed media feeds, and sector heatmaps. Timing varies by source.</p>
          </div>
          <span className="font-mono text-[9px] bg-primary text-slate-950 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            NODAL ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md select-none mt-xs">
          {/* Left: Dynamic Audio Briefing Card */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-8 bg-[#121212] border border-outline rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden"
          >
            {/* Subtle logo background */}
            <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none transform translate-x-12 translate-y-12">
              <img
                src="/assets/bullbrief_transparent_white.png"
                alt="Briefing Background"
                className="w-80 h-auto"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-slate-950 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.2em]">
                    TODAY'S MACRO BRIEF
                  </span>
                  <span className="font-mono text-xs text-secondary/80">12:15 Duration</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                  <span className="tracking-[0.1em] font-semibold">SYNCHRONIZED</span>
                </div>
              </div>

              <h4 className="font-serif italic text-2xl text-on-surface tracking-tight mb-xs font-light">
                Daily Macro Intel briefing
              </h4>
              <p className="font-sans text-xs text-secondary max-w-2xl leading-relaxed mb-md font-medium">
                Elena Vance delivers an institutional snapshot of current treasury yields, sector flow shifts, and the upcoming core PCE index forecast ahead of the opening bell.
              </p>
            </div>

            {/* Audio Player Controls */}
            <div className="bg-neutral-950/40 border border-outline rounded-2xl p-4 flex flex-col md:flex-row items-center gap-md">
              {/* Play Button */}
              <button
                onClick={() => setIsPlayingBriefing(!isPlayingBriefing)}
                className="w-12 h-12 rounded-full bg-primary text-slate-950 flex items-center justify-center cursor-pointer hover:bg-opacity-90 active:scale-95 transition-all shrink-0 shadow-md"
              >
                {isPlayingBriefing ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                )}
              </button>

              {/* Time progress bar */}
              <div className="flex-1 w-full flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-secondary">
                  <span>{formatBriefingDuration(briefingTime)}</span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Live Playback
                  </span>
                  <span>12:15</span>
                </div>

                {/* Progress track */}
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden relative cursor-pointer">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(briefingTime / 735) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Audio speed controls */}
              <div className="flex items-center gap-1 bg-neutral-900 border border-outline rounded-full p-1 shrink-0">
                <span className="text-[10px] font-mono text-neutral-500 pr-1 pl-2 font-bold uppercase">SPEED</span>
                {[1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setAudioSpeed(speed)}
                    className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold cursor-pointer transition-all ${
                      audioSpeed === speed
                        ? 'bg-primary text-slate-950 shadow'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Dynamic Sentiment Gauge Dial */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-4 bg-[#121212] border border-outline rounded-3xl p-6 flex flex-col justify-between shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between mb-xs">
                <span className="font-mono text-[9px] font-bold text-neutral-500 tracking-[0.2em] uppercase">
                  SENTIMENT ANCHOR
                </span>
                <Info className="w-4 h-4 text-secondary hover:text-primary cursor-pointer" title="Illustrative score derived from available briefing content; not a recommendation" />
              </div>
              <h4 className="font-serif italic text-xl text-on-surface tracking-tight mb-1 font-light">
                Consensus Index
              </h4>
              <p className="font-sans text-xs text-neutral-400 leading-normal font-medium">
                Continuous weighted metric derived from institutional analyst sentiment.
              </p>
            </div>

            {/* Interactive Gauge */}
            <div className="my-md flex flex-col items-center gap-xs select-none">
              <span className="font-sans text-4xl text-on-surface tabular-nums font-semibold tracking-tight">
                {sentimentValue} <span className="text-lg font-normal text-neutral-500">/ 100</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold px-3 py-1 bg-neutral-950 border border-outline rounded-full text-primary">
                ● {sentimentInfo.text}
              </span>
            </div>

            {/* Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="bg-neutral-800 h-2 w-full rounded-full relative">
                {/* slider indicator */}
                <div
                  className="absolute w-4.5 h-4.5 bg-white border-2 border-primary rounded-full -top-1.25 -translate-x-1/2 cursor-grab active:cursor-grabbing hover:scale-110 transition-all shadow"
                  style={{ left: `${sentimentValue}%` }}
                ></div>
              </div>

              <input
                type="range"
                min="10"
                max="90"
                value={sentimentValue}
                onChange={(e) => setSentimentValue(Number(e.target.value))}
                className="w-full opacity-0 cursor-pointer h-4 -mt-4 z-10"
              />

              <div className="flex justify-between text-[10px] font-mono text-neutral-500 font-bold px-1 uppercase tracking-wider">
                <span>Bearish</span>
                <span>Neutral</span>
                <span>Bullish</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Grid Split-Pane: News Feed vs Sectors */}
      <motion.section
        variants={containerVariants}
        className="grid grid-cols-1 xl:grid-cols-12 gap-lg mt-md"
      >
        {/* Left Side: Latest Intelligence News Feed */}
        <motion.div
          variants={cardVariants}
          className="xl:col-span-8 flex flex-col gap-md"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-sm border-b border-outline/30 pb-3">
            <h3 className="font-serif italic text-xl text-on-surface tracking-tight font-light">
              Latest Intelligence Stream
            </h3>

            {/* Category tabs */}
            <div className="flex items-center gap-xs bg-neutral-950/40 border border-outline rounded-full p-0.5 select-none">
              {(['all', 'markets', 'crypto', 'forex'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-[0.15em] font-bold uppercase transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All Intel' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of News Articles */}
          <div className="flex flex-col gap-4">
            {filteredNews.length > 0 ? (
              filteredNews.map((item) => (
                <article
                  key={item.id}
                  onClick={() => setSelectedNews(item)}
                  className="bg-[#121212]/40 hover:bg-[#121212]/90 border border-outline rounded-2xl p-4 transition-all duration-200 flex flex-col md:flex-row cursor-pointer group gap-md select-none"
                >
                  <div className="md:w-40 h-28 relative overflow-hidden shrink-0 bg-neutral-900 rounded-xl border border-outline">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-neutral-950 text-primary font-mono text-[8px] px-2 py-0.5 rounded-full border border-outline/20 uppercase tracking-[0.15em]">
                      {item.category}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[9px] font-bold text-neutral-500 tracking-[0.25em] uppercase">
                          {item.source}
                        </span>
                        <span className="font-mono text-[9px] text-neutral-500 flex items-center gap-0.5 uppercase font-semibold">
                          <Clock className="w-3 h-3" /> {item.time}
                        </span>
                      </div>

                      <h5 className="font-sans font-semibold text-sm text-on-surface leading-snug mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h5>
                      <p className="font-sans text-xs text-neutral-400 leading-relaxed line-clamp-2 font-medium">
                        {item.text}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-mono uppercase tracking-[0.15em] font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Read Full Intel <ArrowRight className="w-3 h-3" />
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Bookmarked: ${item.title}`);
                          }}
                          className="p-1 hover:bg-neutral-800 text-neutral-500 hover:text-white rounded-full cursor-pointer"
                          title="Bookmark"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                          }}
                          className="p-1 hover:bg-neutral-800 text-neutral-500 hover:text-white rounded-full cursor-pointer"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="bg-surface border border-outline rounded-2xl p-xl text-center">
                <p className="font-sans text-sm text-secondary">
                  No market intelligence matches your query. Try a different category or search parameter.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Side: Sectors & Hot Flashes */}
        <motion.div
          variants={containerVariants}
          className="xl:col-span-4 flex flex-col gap-lg"
        >
          {/* Sector Map */}
          <motion.div
            variants={cardVariants}
            className="bg-[#121212] border border-outline rounded-3xl p-5 shadow-lg select-none"
          >
            <h4 className="font-mono text-[10px] font-bold text-neutral-500 tracking-[0.1em] mb-4 uppercase">
              Sector Performance
            </h4>
            <div className="grid grid-cols-2 gap-sm">
              <div className="bg-neutral-950/40 border border-outline rounded-2xl p-3 flex flex-col text-left hover:border-primary/30 transition-colors">
                <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">TECHNOLOGY</span>
                <span className="font-sans text-lg text-primary font-bold mt-0.5">+2.45%</span>
              </div>
              <div className="bg-neutral-950/40 border border-outline rounded-2xl p-3 flex flex-col text-left hover:border-primary/30 transition-colors">
                <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">FINANCE</span>
                <span className="font-sans text-lg text-primary font-bold mt-0.5">+0.82%</span>
              </div>
              <div className="bg-neutral-950/40 border border-outline rounded-2xl p-3 flex flex-col text-left hover:border-error/30 transition-colors">
                <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">ENERGY</span>
                <span className="font-sans text-lg text-error font-bold mt-0.5">-1.20%</span>
              </div>
              <div className="bg-neutral-950/40 border border-outline rounded-2xl p-3 flex flex-col text-left hover:border-neutral-500/30 transition-colors">
                <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">HEALTHCARE</span>
                <span className="font-sans text-lg text-neutral-400 font-bold mt-0.5">+0.15%</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Analyst Briefings */}
          <motion.div
            variants={cardVariants}
            className="bg-[#121212] border border-outline rounded-3xl p-5 flex flex-col gap-md shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-outline/30 pb-sm select-none">
              <h4 className="font-mono text-[10px] font-bold text-neutral-500 tracking-[0.1em] uppercase">
                Analyst Hot Flashes
              </h4>
              <span className="font-mono text-[9px] bg-primary text-slate-950 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                LATEST
              </span>
            </div>

            <div className="flex flex-col gap-md select-none">
              {briefings.map((brief) => {
                const badgeColor =
                  brief.impact === 'High'
                    ? 'bg-primary text-slate-950'
                    : brief.impact === 'Bearish'
                    ? 'bg-error text-slate-950'
                    : 'bg-neutral-800 text-neutral-300';
                return (
                  <div key={brief.id} className="flex flex-col gap-1.5 text-left border-b border-outline/35 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
                        {brief.impact} Impact
                      </span>
                      <span className="font-mono text-[9px] text-neutral-500 font-bold">{brief.time}</span>
                    </div>
                    <h5 className="font-sans font-semibold text-xs text-primary leading-snug">
                      {brief.title}
                    </h5>
                    <p className="font-sans text-[11px] text-neutral-400 leading-normal font-medium">
                      {brief.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActivePage('news')}
              className="w-full mt-xs py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-outline rounded-full font-mono font-bold text-[10px] tracking-widest text-primary uppercase transition-all flex items-center justify-center gap-xs cursor-pointer"
            >
              <span>Explore all media</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Institutional Briefing Overlay Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-md overflow-y-auto">
          <div className="bg-[#121212] border border-outline rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-outline/30 flex items-start justify-between select-none">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                    {selectedNews.category}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                    {selectedNews.source}
                  </span>
                </div>
                <h3 className="font-serif italic text-2xl text-on-surface tracking-tight leading-snug">
                  {selectedNews.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNews(null)}
                className="p-1 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white cursor-pointer font-bold text-xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-md">
              <img
                src={selectedNews.imageUrl}
                alt={selectedNews.title}
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover rounded-2xl border border-outline"
              />

              <p className="font-sans text-sm text-neutral-300 leading-relaxed whitespace-pre-line font-medium">
                {selectedNews.text}
              </p>

              {/* AI macro implications analysis card */}
              <div className="bg-[#12D162]/5 border border-[#12D162]/10 rounded-2xl p-4 flex flex-col gap-sm select-none">
                <div className="flex items-center gap-xs text-primary font-sans font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>AI Analyst Implications</span>
                  {analysisLoading && (
                    <span className="text-[10px] font-mono text-neutral-500 ml-2">Analyzing...</span>
                  )}
                </div>
                <div className="font-sans text-xs text-neutral-400 flex flex-col gap-sm leading-relaxed font-medium">
                  {newsAnalysis ? (
                    <>
                      <p className="text-neutral-300">{newsAnalysis.summary}</p>
                      {newsAnalysis.implications.map((item, i) => (
                        <p key={i}>
                          <strong className="text-on-surface font-semibold">{i + 1}. {item.title}:</strong>{' '}
                          {item.text}
                        </p>
                      ))}
                    </>
                  ) : (
                    <p>AI analysis unavailable. Add a GEMINI_API_KEY to enable live analyst insights.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-900/30 border-t border-outline/35 flex items-center justify-between gap-md select-none">
              <span className="font-mono text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                BULLBRIEF MACRO DEPT.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onAddToWatchlist(selectedNews.source === 'WSJ' ? 'MSFT' : 'AAPL');
                    alert(`Added ticker associated with this story to Watchlist.`);
                  }}
                  className="px-5 py-2 bg-primary text-slate-950 text-xs font-semibold rounded-full cursor-pointer hover:bg-opacity-95 active:scale-95 transition-all"
                >
                  Watch Associated Assets
                </button>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="px-5 py-2 border border-outline text-xs font-semibold rounded-full cursor-pointer hover:bg-neutral-800 transition-all text-on-surface"
                >
                  Close Brief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  // Helper helper to avoid chart index reset errors
  function setHoverIdxNull() {
    setHoveredValue(null);
    setHoveredPercent(null);
  }
}
