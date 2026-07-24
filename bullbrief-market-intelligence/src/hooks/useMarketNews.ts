import { useState, useEffect } from 'react';
import type { NewsItem } from '../types';
import { api } from '../services/api';
import { INITIAL_NEWS } from '../components/mockData';

export function useMarketNews() {
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getNews();
        if (!cancelled) {
          setNews(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load news');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { news, loading, error };
}
