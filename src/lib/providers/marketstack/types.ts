export type MarketstackTickerSearchResponse = {
  data: Array<{
    symbol: string;
    name: string;
    stock_exchange: string;
    stock_exchange_timezone: string;
  }>;
};

export type MarketstackTickerDetailResponse = {
  data: {
    symbol: string;
    name: string;
    has_intraday: boolean;
    has_eod: boolean;
    stock_exchange: string;
    stock_exchange_timezone: string;
  };
};

export type MarketstackQuoteResponse = {
  data: Array<{
    symbol: string;
    name: string;
    exchange: string;
    currency: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    intraday_price: number | null;
    intraday_change: number | null;
    change: number;
    change_percent: number;
    previous_close: number;
    timestamp: number;
  }>;
};

export type MarketstackHistoricalResponse = {
  data: Array<{
    symbol: string;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjusted_close: number;
  }>;
};

export type MarketstackExchangeResponse = {
  data: {
    name: string;
    acronym: string;
    mic: string;
    country: string;
    city: string;
    website: string;
  };
};
