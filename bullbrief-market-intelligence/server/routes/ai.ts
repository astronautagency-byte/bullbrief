import { Router } from 'express';
import { analyzeStock, analyzeNews, generateDailyBriefing } from '../services/gemini.js';

const router = Router();

router.post('/analyze-stock', async (req, res, next) => {
  try {
    const { symbol, name, price, changePercent } = req.body;
    if (!symbol) {
      res.status(400).json({ error: 'symbol is required' });
      return;
    }
    const analysis = await analyzeStock(symbol, name || symbol, price || 0, changePercent || 0);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

router.post('/analyze-news', async (req, res, next) => {
  try {
    const { title, text, source } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const analysis = await analyzeNews(title, text || '', source || 'Unknown');
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

router.post('/daily-briefing', async (req, res, next) => {
  try {
    const { marketContext } = req.body;
    const briefing = await generateDailyBriefing(marketContext || 'General market conditions.');
    res.json(briefing);
  } catch (error) {
    next(error);
  }
});

export default router;
