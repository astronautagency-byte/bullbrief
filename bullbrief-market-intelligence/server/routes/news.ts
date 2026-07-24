import { Router } from 'express';
import { fetchLatestNews } from '../services/newsFeed.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const news = await fetchLatestNews(24);
    res.json(news);
  } catch (error) {
    console.warn('News fetch failed:', error);
    res.status(502).json({ error: 'Unable to fetch news feeds' });
  }
});

export default router;
