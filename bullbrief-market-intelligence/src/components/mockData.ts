import { NewsItem, BriefingItem, PodcastEpisode, Asset, Invoice } from '../types';

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    source: 'REUTERS',
    time: '2 MIN AGO',
    title: 'Federal Reserve Signals Potential Rate Cut Pauses Amid Sticky Inflation Data',
    text: 'Wall Street futures declined slightly following the latest remarks from Jerome Powell regarding the stability of the core CPI indices throughout the quarter.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI8iAo8_f2mKblC0wPHZUmd0VBgEZMCC9z0NFGoSMBqvMbMSvZ6yLFU_NWXYYGga2G415KRkMatENO7CL82kL9k1625RjYmjk2dpso3gK1jvxWBUU6Auhy3XoffVK-V6bPIwo_dWHvrpAc-2aQLFQ2O3j3ZOmZ46uVoGHYttWeQ19ZR4Bi-dUmdEjYWjB_HI8YS6gZFus-2-pMVQzoMJiuMLeRhrHbFnhsV8FKq5xcV6kFCfJ1asRm',
    category: 'latest'
  },
  {
    id: 'news-2',
    source: 'WSJ',
    time: '14 MIN AGO',
    title: 'Tech Stocks Surge as AI Infrastructure Spending Forecasts Beat Institutional Estimates',
    text: 'Major cloud providers are accelerating hardware deployment, leading to a ripple effect across the semiconductor supply chain.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTZr8GOJ1VYqZjU06ejn4fYLyj49mHNj7RGyJ4thS_89yCsMf6ne9tbdZxDnfWG0RJRo_ol8T9D7aWcKyTClnqr1wzEA0TqB0FCpPi_BdcfuF_rkzUo01h71WJsf_Hdjxn0oI-OiKh7gs-MEpDJKoCbsKyoAE8KqUjj2HCVknbZT8hMJZYm9MgAgvZrShN36Bx4UHH6vtq5avBRrcTch7L9ZU-zIl4k6wlaa6SNcd21l8rFVWx_wRl',
    category: 'latest'
  },
  {
    id: 'news-3',
    source: 'CNBC',
    time: '42 MIN AGO',
    title: 'Oil Prices Stabilize After Short-Term Supply Disruption in North Sea Terminals',
    text: 'Brent crude traded at $82.40 per barrel as market participants weigh geopolitical risks against slowing industrial demand in Asian markets.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjYYRtmNNPlZwpGbTXH2aSWGtZPOJHIGXpjOG2JHpqg71VYbV4WISIRtd9-DA6rwg9WYWEMgn_NpavhfmdpchBWs4y6UXMKBF_6CZAcMFYh4RvYKOaWlFBPw4jdrDS3wxxLCE6yW6mKK--OM_knTOpD52bmgs_VsQki75_Soay-NLOrJc_sXz2-RecXjImXpAIV6BOE8tcRVQpyIKZUnT3EyrwZYHtnFh6pVNwZ0t7uOYO4rPR2RcU',
    category: 'latest'
  },
  {
    id: 'news-4',
    source: 'BLOOMBERG',
    time: '1 HOUR AGO',
    title: 'European Central Bank Maintains Rates; Lagarde Emphasizes Data-Dependent Path',
    text: 'The European Central Bank kept interest rates unchanged as expected, with President Christine Lagarde reiterating that future decisions will rely strictly on incoming economic data metrics.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI8iAo8_f2mKblC0wPHZUmd0VBgEZMCC9z0NFGoSMBqvMbMSvZ6yLFU_NWXYYGga2G415KRkMatENO7CL82kL9k1625RjYmjk2dpso3gK1jvxWBUU6Auhy3XoffVK-V6bPIwo_dWHvrpAc-2aQLFQ2O3j3ZOmZ46uVoGHYttWeQ19ZR4Bi-dUmdEjYWjB_HI8YS6gZFus-2-pMVQzoMJiuMLeRhrHbFnhsV8FKq5xcV6kFCfJ1asRm',
    category: 'latest'
  }
];

export const BRIEFING_ITEMS: BriefingItem[] = [
  {
    id: 'brief-1',
    title: 'Tech Rally Gains Momentum',
    text: 'Nvidia and Microsoft lead a surge in semiconductor and software sectors as earnings expectations rise for Q3 reports. Market participants are shifting focus from macro yields to enterprise growth.',
    time: '14m ago',
    impact: 'High'
  },
  {
    id: 'brief-2',
    title: 'Treasury Yields Stabilize Near 4.8%',
    text: 'The 10-year Treasury yield cooled slightly after recent volatility, providing a brief window of relief for equities. Analysts remain cautious ahead of upcoming FOMC statements.',
    time: '1h ago',
    impact: 'Neutral'
  },
  {
    id: 'brief-3',
    title: 'Consumer Discretionary Outlook Darkens',
    text: 'Rising fuel costs and persistent inflation are starting to weigh on retail forecasts. Major department stores are seeing a decline in foot traffic as the holiday season approaches.',
    time: '3h ago',
    impact: 'Bearish'
  }
];

export const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: 'pod-1',
    category: 'MARKET ANALYSIS',
    time: 'NOW PLAYING',
    title: 'Macro-Regime Shifts: Navigating the Q3 Liquidity Trap',
    text: 'Chief Strategist Elena Vance breaks down the impending quantitative tightening cycles and what they mean for equity risk premiums over the next 90 days.',
    duration: '48:00',
    progress: '12:45 / 48:00',
    percentComplete: 75,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2u4WxoeI0vHc_DIYc61VyCxDEhkOX-TVUDaWFzc0Ab-2blWsmU2YjLeSH9TFMeCkR04oEO6oP6qvJKzjOUZTm49A4Qzz9WGCKn2VSkyPXOyWyBjR40m0pR2-lqHY4aYptEJnAtBAbf_ONFqLeZ7dKM_RnwVRiAnUXkXqQr6_DC8blDdAYQ-Up4syrizrFebDL1LoVcF4S2THOKrsHu-qZqR4CsCTSa4lRHPHx7PTfzbrdFFAKoRkB',
    author: 'Elena Vance'
  },
  {
    id: 'pod-2',
    category: 'CRYPTO DEEP-DIVE',
    time: '24:12',
    title: 'Solana vs ETH: The Compute Wars',
    text: 'Exploring the modular vs integrated future of L1 chains and processing efficiency benchmarks.',
    duration: '24:12',
    progress: '0:00 / 24:12',
    percentComplete: 0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0UENWPnvZjTf8I7aAYSnK2Jru4g2o7ACBQKlKVLLM9B6HbZUKLpovdNceOZNxsk4YSOkmGdE-WHJME3D8z7z4dzeCv_lV4hHVmITo8X0ZJadbMjtUQxE7CVEkQ-Q7LLIlCzrnpgmqBU6ztW_aYEUD3K4cDLNzW8FDqMyTGsz24UQit5Wc_NgaNp3nx15KOKyZLfmkk1k0prZi2XOKqn8LFuR9l2gI6Agdod4E-p-oLi_zZtIoYvyS',
    author: 'Block Insider'
  },
  {
    id: 'pod-3',
    category: 'INTERVIEWS',
    time: '32:05',
    title: 'Inside the Boardroom: Tech M&A',
    text: 'A candid discussion on the consolidation of AI startups, investment trends, and strategic plays.',
    duration: '32:05',
    progress: '0:00 / 32:05',
    percentComplete: 0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwWugZ4wIOhdgVgjufa2srAtgaiXx_hOqSE549ct0012XBptPmjgdyA7vTXgoq9npLm4JBDNTbUT9mpsD4afM0bB2V6LIMa1RmkKuzHuTIXNDbhoH1jcXSv35Dz4iTZtSn8XVstNXy83bnYgMU6uOoIRhWZUwUgK32zhoive8-au-cPLyn8gcw0DNpBPzrwq_or5-DRjgi6MhWpSEHfVPMokYJLkEOb8eWbx8Jvdvz9Cq9zWGIRljw',
    author: 'Sarah Jenkins'
  },
  {
    id: 'pod-4',
    category: 'MARKET PULSE',
    time: '18:45',
    title: 'Daily Briefing: Yield Curves Invert',
    text: 'Morning analysis of treasury market developments, yield fluctuations, and global macro alerts.',
    duration: '18:45',
    progress: '0:00 / 18:45',
    percentComplete: 0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg18aXKazRT7IYB2fajHAAz868b0svdpy_MN_ovpaAc6C-WHkkgQAn9c0OiRHhwRS9pm5JOBmqOcsiYhQDj5q9q0ltbe1SA1PYWt5EbjUkWU3VbxZzaW9i3OWfcpGJ2IoXFfOwC3AkQMWum07PN54n9TWBAJoj3FyHJXE9E5iEMT6grguqPcXX8UjHU5Vbuh7nToCKuvDsEkDGyV3R018XqiUGO0aN40goWVr-3oNhP_wM2KiaHRT-',
    author: 'BullBrief Desk'
  },
  {
    id: 'pod-5',
    category: 'PRO ANALYSIS',
    time: '45:00',
    title: 'The Alpha Report: ESG Realities',
    text: 'Behind the numbers of institutional sustainability mandates, reporting rules, and corporate values.',
    duration: '45:00',
    progress: '0:00 / 45:00',
    percentComplete: 0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGvdhJAln43uTs-bnxwBYYVRUjXw6R-RJjjCwlDaEXrXqZYRbROwaP0dVMpXJuRLwqoINLGCptCpsX8kE-QfkRNjHD0Hm87SmNVlI_vCt2yGjZnViOLb9kFWd-PscQa7fVeCadke0lhJ0vQek1hu1XXdMpwlqNfP0NsoSfuTLTyoV5Fm5KYNAbfbhBh1yQ8B-8OVRnC7gnUqW0a0qkjDSfVWC4pLtcx--K0HsOBNR9M2S3YSSIqduW',
    author: 'Alpha Insights'
  }
];

export const INITIAL_WATCHLIST: Asset[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 182.52,
    dayChangePercent: 0.42,
    dayChangeAmount: 0.76,
    marketCap: '2.82T',
    volume24h: '48.2M'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 415.50,
    dayChangePercent: 1.15,
    dayChangeAmount: 4.72,
    marketCap: '3.08T',
    volume24h: '22.1M'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 142.65,
    dayChangePercent: -0.88,
    dayChangeAmount: -1.27,
    marketCap: '1.79T',
    volume24h: '28.5M'
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 178.22,
    dayChangePercent: 0.12,
    dayChangeAmount: 0.21,
    marketCap: '1.85T',
    volume24h: '31.2M'
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 924.12,
    dayChangePercent: 4.82,
    dayChangeAmount: 42.50,
    marketCap: '2.31T',
    volume24h: '62.8M'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 171.05,
    dayChangePercent: -2.15,
    dayChangeAmount: -3.75,
    marketCap: '544.1B',
    volume24h: '94.5M'
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 502.30,
    dayChangePercent: 0.95,
    dayChangeAmount: 4.73,
    marketCap: '1.28T',
    volume24h: '18.4M'
  },
  {
    symbol: 'RY',
    name: 'Royal Bank of Canada',
    price: 142.50,
    dayChangePercent: 0.62,
    dayChangeAmount: 0.88,
    marketCap: '202.4B',
    volume24h: '4.2M'
  },
  {
    symbol: 'SHOP',
    name: 'Shopify Inc.',
    price: 94.30,
    dayChangePercent: 2.15,
    dayChangeAmount: 1.98,
    marketCap: '121.2B',
    volume24h: '8.5M'
  },
  {
    symbol: 'TD',
    name: 'Toronto-Dominion Bank',
    price: 81.20,
    dayChangePercent: -0.45,
    dayChangeAmount: -0.37,
    marketCap: '143.5B',
    volume24h: '5.1M'
  },
  {
    symbol: 'CNR',
    name: 'Canadian National Railway',
    price: 162.80,
    dayChangePercent: 0.12,
    dayChangeAmount: 0.20,
    marketCap: '103.8B',
    volume24h: '2.1M'
  },
  {
    symbol: 'ENB',
    name: 'Enbridge Inc.',
    price: 48.90,
    dayChangePercent: -0.15,
    dayChangeAmount: -0.07,
    marketCap: '104.2B',
    volume24h: '6.8M'
  },
  {
    symbol: 'CSU',
    name: 'Constellation Software',
    price: 3680.00,
    dayChangePercent: 1.84,
    dayChangeAmount: 66.50,
    marketCap: '78.1B',
    volume24h: '0.15M'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-0712',
    date: 'Jul 12, 2026',
    amount: 99.00,
    status: 'PAID'
  },
  {
    id: 'INV-2026-0612',
    date: 'Jun 12, 2026',
    amount: 99.00,
    status: 'PAID'
  },
  {
    id: 'INV-2026-0512',
    date: 'May 12, 2026',
    amount: 99.00,
    status: 'PAID'
  },
  {
    id: 'INV-2026-0412',
    date: 'Apr 12, 2026',
    amount: 99.00,
    status: 'PAID'
  }
];
