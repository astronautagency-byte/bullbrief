export type MarketauxNewsResponse = {
  data: Array<{
    uuid: string;
    title: string;
    description: string | null;
    keywords: string[];
    snippet: string | null;
    url: string;
    image_url: string | null;
    language: string;
    published_at: string;
    source: {
      name: string;
      url: string;
      logo_url: string | null;
    };
    related?: Array<{
      uuid: string;
      title: string;
      snippet: string;
      url: string;
    }>;
    entities?: Array<{
      symbol: string;
      name: string;
      exchange: string | null;
      mic_code: string | null;
      country: string;
      type: string;
    }>;
    topics?: Array<{
      topic: string;
      sentiment_score: number;
    }>;
  }>;
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
};
