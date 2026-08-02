"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { useNotifications, type Notification } from "@/components/notification-provider";
import { Bell, CheckCheck, Trash2, TrendingUp, Newspaper, Podcast, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getNotifIcon(type: Notification["type"]) {
  switch (type) {
    case "price_alert":
      return <TrendingUp className="w-4 h-4" />;
    case "news":
      return <Newspaper className="w-4 h-4" />;
    case "podcast":
      return <Podcast className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
}

function getNotifColor(type: Notification["type"]) {
  switch (type) {
    case "price_alert":
      return "text-primary bg-primary/10";
    case "news":
      return "text-blue-400 bg-blue-400/10";
    case "podcast":
      return "text-amber-300 bg-amber-300/10";
    default:
      return "text-on-surface-variant bg-surface-container-high";
  }
}

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllRead, clearNotifications, preferences, updatePreferences } = useNotifications();
  const [open, setOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-on-primary text-[10px] font-bold rounded-full px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-3 top-[102px] w-[calc(100vw-1.5rem)] max-w-96 max-h-[calc(100vh-7rem)] bg-surface-container rounded-[28px] border border-outline-variant z-[200] overflow-hidden md:right-6">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-on-surface">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-mono font-bold rounded">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-md hover:bg-surface-container-high"
                title="Notification preferences"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-md hover:bg-surface-container-high"
                  title="Mark all read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-md hover:bg-surface-container-high"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {showPreferences && (
            <div className="grid grid-cols-3 gap-2 border-b border-outline-variant bg-surface-container-low px-4 py-3">
              {([
                ["priceMoves", "Price moves"],
                ["news", "News"],
                ["podcasts", "Podcasts"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updatePreferences({ [key]: !preferences[key] })}
                  className={cn(
                    "rounded-md border px-2 py-2 text-[10px] font-medium transition-colors",
                    preferences[key]
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-outline-variant text-on-surface-variant"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm">No notifications yet</p>
                <p className="text-on-surface-variant/50 text-xs mt-1">
                  Material watchlist moves and relevant updates will appear here
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-outline-variant/50 cursor-pointer transition-colors hover:bg-surface-container-high/50",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className={cn("p-1.5 rounded-lg flex-shrink-0 mt-0.5", getNotifColor(n.type))}>
                    {getNotifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-medium truncate", n.read ? "text-on-surface" : "text-on-surface font-semibold")}>
                        {n.title}
                      </p>
                      {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-on-surface-variant/50 mt-1 font-mono">{formatTimeAgo(n.timestamp)}</p>
                    {(n.dataTimestamp || n.dataStatus) && (
                      <p className="mt-1 text-[9px] text-on-surface-variant/40">
                        {n.dataStatus}{n.dataTimestamp ? ` · ${new Date(n.dataTimestamp).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                      </p>
                    )}
                  </div>
                  {n.href && (
                    <Link
                      href={n.href}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-primary hover:text-primary-fixed transition-colors flex-shrink-0 mt-1"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
