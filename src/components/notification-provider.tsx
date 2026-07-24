"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";

export interface Notification {
  id: string;
  type: "price_alert" | "market_open" | "market_close" | "briefing_ready" | "news";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  href?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
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
    return stored ? JSON.parse(stored) : [];
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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setNotifications(loadFromStorage());
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (initialized.current) {
      saveToStorage(notifications);
    }
  }, [notifications]);

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    setNotifications((prev) => {
      const exists = prev.some(
        (x) => x.type === n.type && x.title === n.title && !x.read
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllRead, clearNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
