import { Router } from 'express';
import { fetchQuotes, fetchSingleQuote, fetchMarketTickers, fetchChartData } from '../services/yahooFinance.js';

const router = Router();

router.get('/tickers', async (_req, res, next) => {
  try {
    const tickers = await fetchMarketTickers();
    res.json(tickers);
  } catch (error) {
    next(error);
  }
});

router.get('/quotes', async (req, res, next) => {
  try {
    const symbols = String(req.query.symbols || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (symbols.length === 0) {
      res.status(400).json({ error: 'Provide symbols query param, e.g. ?symbols=AAPL,MSFT' });
      return;
    }

    const quotes = await fetchQuotes(symbols);
    res.json(quotes);
  } catch (error) {
    next(error);
  }
});

router.get('/quote/:symbol', async (req, res, next) => {
  try {
    const quote = await fetchSingleQuote(req.params.symbol);
    if (!quote) {
      res.status(404).json({ error: 'Symbol not found' });
      return;
    }
    res.json(quote);
  } catch (error) {
    next(error);
  }
});

router.get('/chart/:symbol', async (req, res, next) => {
  try {
    const range = (req.query.range as '1mo' | '3mo' | '6mo' | 'ytd' | '1y' | 'max') || '1mo';
    const market = req.query.market === 'Canada' ? '^GSPTSE' : '^GSPC';
    const symbol = req.params.symbol === 'index' ? market : req.params.symbol;
    const data = await fetchChartData(symbol, range);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
