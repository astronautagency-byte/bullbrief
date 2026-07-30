"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";

export interface Notification {
  id: string;
  type: "price_alert" | "news" | "podcast";
  title: string;
  message: string;
  timestamp: string;
  dataTimestamp?: string;
  dataStatus?: string;
  dedupeKey?: string;
  read: boolean;
  href?: string;
}

export interface NotificationPreferences {
  priceMoves: boolean;
  news: boolean;
  podcasts: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  preferences: NotificationPreferences;
  updatePreferences: (next: Partial<NotificationPreferences>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

function generateId() {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadFromStorage(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("bullbrief_notifications");
    const parsed: Notification[] = stored ? JSON.parse(stored) : [];
    return parsed.filter((item) =>
      item.type === "price_alert" || item.type === "news" || item.type === "podcast"
    );
  } catch {
    return [];
  }
}

function saveToStorage(notifications: Notification[]) {
  try {
    const recent = notifications.slice(0, 50);
    localStorage.setItem("bullbrief_notifications", JSON.stringify(recent));
  } catch {}
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  priceMoves: true,
  news: true,
  podcasts: true,
};

function loadPreferences(): NotificationPreferences {
  try {
    return {
      ...DEFAULT_PREFERENCES,
      ...JSON.parse(localStorage.getItem("bullbrief_notification_preferences") || "{}"),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function readSeenKeys(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem("bullbrief_notification_seen") || "{}");
  } catch {
    return {};
  }
}

function saveSeenKeys(keys: Record<string, number>) {
  const cutoff = Date.now() - 14 * 86400000;
  const recent = Object.fromEntries(Object.entries(keys).filter(([, time]) => time > cutoff));
  localStorage.setItem("bullbrief_notification_seen", JSON.stringify(recent));
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      const timer = window.setTimeout(() => {
        setNotifications(loadFromStorage());
        setPreferences(loadPreferences());
        initialized.current = true;
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) {
      saveToStorage(notifications);
    }
  }, [notifications]);

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    setNotifications((prev) => {
      const exists = prev.some((x) =>
        n.dedupeKey ? x.dedupeKey === n.dedupeKey : x.type === n.type && x.title === n.title && !x.read
      );
      if (exists) return prev;
      const newNotif: Notification = {
        ...n,
        id: generateId(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      return [newNotif, ...prev].slice(0, 50);
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((next: Partial<NotificationPreferences>) => {
    setPreferences((current) => {
      const updated = { ...current, ...next };
      localStorage.setItem("bullbrief_notification_preferences", JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    let cancelled = false;
    let firstContentCheck = true;

    async function checkUsefulUpdates() {
      const seen = readSeenKeys();
      const symbols: string[] = JSON.parse(localStorage.getItem("bullbrief_watchlist") || "[]");

      if (preferences.priceMoves && symbols.length) {
        try {
          const response = await fetch(`/api/watchlist-local?symbols=${symbols.join(",")}`);
          const json = await response.json();
          for (const quote of json.data ?? []) {
            const move = Number(quote.changePercent);
            if (!Number.isFinite(move) || Math.abs(move) < 3) continue;
            const direction = move > 0 ? "up" : "down";
            const key = `move:${quote.symbol}:${direction}:${new Date().toISOString().slice(0, 10)}`;
            if (seen[key]) continue;
            addNotification({
              type: "price_alert",
              title: `${quote.symbol} moved ${Math.abs(move).toFixed(1)}%`,
              message: `${quote.companyName} is ${direction} ${Math.abs(move).toFixed(2)}% for the latest available session.`,
              href: `/markets/${quote.symbol}`,
              dataTimestamp: new Date().toISOString(),
              dataStatus: "Latest available quote",
              dedupeKey: key,
            });
            seen[key] = Date.now();
          }
        } catch {}
      }

      if (preferences.news && symbols.length) {
        try {
          const response = await fetch("/api/news?limit=20");
          const json = await response.json();
          const relevant = (json.data ?? []).filter((article: { relatedSymbols?: string[]; publishedAt?: string }) =>
            article.relatedSymbols?.some((symbol) => symbols.includes(symbol)) &&
            Date.now() - new Date(article.publishedAt || 0).getTime() < 12 * 3600000
          );
          for (const article of relevant.slice(0, 2)) {
            const key = `news:${article.providerId || article.url}`;
            if (seen[key]) continue;
            if (!firstContentCheck) {
              addNotification({
                type: "news",
                title: article.title,
                message: `${article.sourceName} · Relevant to ${article.relatedSymbols.filter((symbol: string) => symbols.includes(symbol)).join(", ")}`,
                href: article.url,
                dataTimestamp: article.publishedAt,
                dataStatus: "Published article",
                dedupeKey: key,
              });
            }
            seen[key] = Date.now();
          }
        } catch {}
      }

      if (preferences.podcasts) {
        try {
          const response = await fetch("/api/podcast-favourites");
          const json = await response.json();
          for (const podcast of (json.data ?? []).slice(0, 8)) {
            const detailResponse = await fetch(`/api/podcasts/${encodeURIComponent(podcast.id)}`);
            const detail = await detailResponse.json();
            const episode = detail.data?.episodes?.[0];
            if (!episode?.id || !episode.publishedAt) continue;
            const key = `podcast:${episode.id}`;
            if (seen[key]) continue;
            if (!firstContentCheck && Date.now() - new Date(episode.publishedAt).getTime() < 7 * 86400000) {
              addNotification({
                type: "podcast",
                title: `New from ${podcast.title}`,
                message: episode.title,
                href: "/podcasts",
                dataTimestamp: episode.publishedAt,
                dataStatus: "Latest feed update",
                dedupeKey: key,
              });
            }
            seen[key] = Date.now();
          }
        } catch {}
      }

      firstContentCheck = false;
      saveSeenKeys(seen);
    }

    const initialTimer = window.setTimeout(() => {
      if (!cancelled) void checkUsefulUpdates();
    }, 2500);
    const interval = window.setInterval(() => {
      if (!cancelled && document.visibilityState === "visible") void checkUsefulUpdates();
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [addNotification, preferences]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllRead, clearNotifications, preferences, updatePreferences }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
