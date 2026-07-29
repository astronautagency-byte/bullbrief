import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

function getClient(): GoogleGenAI | null {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function parseJsonResponse<T>(text: string): T {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned) as T;
}

export interface StockAnalysis {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rating: string;
  reasoning: string[];
}

export interface NewsAnalysis {
  implications: { title: string; text: string }[];
  sentiment: number;
  summary: string;
}

export interface DailyBriefing {
  title: string;
  summary: string;
  highlights: { title: string; text: string; impact: 'High' | 'Neutral' | 'Bearish' }[];
  sentimentScore: number;
}

export async function analyzeStock(symbol: string, name: string, price: number, changePercent: number): Promise<StockAnalysis> {
  const client = getClient();
  if (!client) {
    return fallbackStockAnalysis(symbol, changePercent);
  }

  const prompt = `You are a market-information analyst at BullBrief. Provide general, impersonal research about ${symbol} (${name}) using the supplied price of $${price} (${changePercent >= 0 ? '+' : ''}${changePercent}%). Do not recommend buying, selling, holding, position sizing, or suitability for any person. State uncertainty and distinguish facts from inference.

Return ONLY valid JSON with this shape:
{
  "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "rating": "0-100 conviction score as string like '72/100'",
  "reasoning": ["3 concise bullet points about current outlook"]
}`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text ?? '';
  return parseJsonResponse<StockAnalysis>(text);
}

export async function analyzeNews(title: string, text: string, source: string): Promise<NewsAnalysis> {
  const client = getClient();
  if (!client) {
    return fallbackNewsAnalysis(title, text);
  }

  const prompt = `You are a market-information analyst at BullBrief. Summarize this news for general informational use. Do not provide personalized advice, trading instructions, or suitability conclusions:

Source: ${source}
Title: ${title}
Summary: ${text}

Return ONLY valid JSON:
{
  "summary": "2 sentence executive summary",
  "sentiment": 0-100 bullish sentiment score,
  "implications": [
    {"title": "Short label", "text": "1-2 sentence implication for investors/advisors"},
    {"title": "Short label", "text": "1-2 sentence implication"},
    {"title": "Short label", "text": "1-2 sentence implication"}
  ]
}`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return parseJsonResponse<NewsAnalysis>(response.text ?? '');
}

export async function generateDailyBriefing(marketContext: string): Promise<DailyBriefing> {
  const client = getClient();
  if (!client) {
    return fallbackDailyBriefing();
  }

  const prompt = `You are BullBrief's market-information editor. Generate a general morning briefing. Do not provide personalized recommendations, trading instructions, or suitability conclusions.

Current market context:
${marketContext}

Return ONLY valid JSON:
{
  "title": "Brief headline",
  "summary": "3-4 sentence macro briefing for financial advisors",
  "sentimentScore": 0-100,
  "highlights": [
    {"title": "...", "text": "...", "impact": "High" | "Neutral" | "Bearish"},
    {"title": "...", "text": "...", "impact": "High" | "Neutral" | "Bearish"},
    {"title": "...", "text": "...", "impact": "High" | "Neutral" | "Bearish"}
  ]
}`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return parseJsonResponse<DailyBriefing>(response.text ?? '');
}

function fallbackStockAnalysis(symbol: string, changePercent: number): StockAnalysis {
  const bias = changePercent > 1 ? 'BULLISH' : changePercent < -1 ? 'BEARISH' : 'NEUTRAL';
  return {
    bias,
    rating: `${Math.min(90, Math.max(35, 50 + Math.round(changePercent * 5)))}/100`,
    reasoning: [
      `${symbol} is ${changePercent >= 0 ? 'showing positive' : 'facing negative'} momentum in today's session.`,
      'Monitor upcoming earnings and macro catalysts for confirmation of trend.',
      'This directional label is a mechanical description of recent price movement, not a recommendation or suitability assessment.',
    ],
  };
}

function fallbackNewsAnalysis(title: string, text: string): NewsAnalysis {
  return {
    summary: `${title}. ${text.slice(0, 120)}...`,
    sentiment: 55,
    implications: [
      { title: 'Market Impact', text: 'This development may influence near-term sector rotation and volatility expectations.' },
      { title: 'Rate Sensitivity', text: 'Fixed income and growth equities could react to shifts in rate expectations tied to this headline.' },
      { title: 'Research Context', text: 'Readers may wish to compare the headline with primary filings and current market data before drawing conclusions.' },
    ],
  };
}

function fallbackDailyBriefing(): DailyBriefing {
  return {
    title: 'Daily Macro Intel Briefing',
    summary: 'Markets are navigating mixed signals from inflation data and central bank commentary. Equities remain resilient while bond yields stabilize near recent highs. Advisors should monitor sector dispersion and maintain balanced exposure.',
    sentimentScore: 62,
    highlights: [
      { title: 'Fed Policy Watch', text: 'Rate expectations remain data-dependent with markets pricing gradual easing.', impact: 'High' },
      { title: 'Tech Leadership', text: 'Mega-cap tech continues to drive index performance amid AI infrastructure spending.', impact: 'Neutral' },
      { title: 'Energy Headwinds', text: 'Crude volatility persists on supply concerns and demand uncertainty.', impact: 'Bearish' },
    ],
  };
}
