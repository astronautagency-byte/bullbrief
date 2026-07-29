import { useState, useEffect, useCallback } from 'react';
import type { Asset } from '../types';
import { api } from '../services/api';

export function useLiveQuotes(symbols: string[], refreshMs = 60000) {
  const [quotes, setQuotes] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symbolKey = [...symbols].sort().join(',');

  const refresh = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes([]);
      return;
    }

    setLoading(true);
    try {
      const data = await api.getQuotes(symbols);
      setQuotes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [symbolKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, refreshMs);
    return () => clearInterval(interval);
  }, [refresh, refreshMs]);

  return { quotes, loading, error, refresh };
}
