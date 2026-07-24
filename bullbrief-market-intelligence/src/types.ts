export type PageId =
  | 'pulse'
  | 'quick-pulse'
  | 'news'
  | 'watchlist'
  | 'pro'
  | 'account'
  | 'billing'
  | 'checkout'
  | 'login'
  | 'register';

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  dayChangePercent: number;
  dayChangeAmount: number;
  marketCap: string;
  volume24h: string;
}

export interface NewsItem {
  id: string;
  source: string;
  time: string;
  title: string;
  text: string;
  imageUrl: string;
  category: 'latest' | 'markets' | 'crypto' | 'forex';
}

export interface BriefingItem {
  id: string;
  title: string;
  text: string;
  time: string;
  impact: 'High' | 'Neutral' | 'Bearish';
}

export interface PodcastEpisode {
  id: string;
  category: string;
  time: string;
  title: string;
  text: string;
  duration: string;
  progress: string; // e.g. "12:45 / 48:00"
  percentComplete: number; // e.g. 75
  imageUrl: string;
  author: string;
  authorAvatar?: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
}

export interface User {
  name: string;
  email: string;
  isPro: boolean;
  joinedDate: string;
}
