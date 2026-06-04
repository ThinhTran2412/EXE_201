import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import * as ChatHub from '../../features/chat/ChatHub';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './api';
import type { AppNotification, NotificationCategory } from './types';

interface NotificationContextValue {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  prepend: (n: AppNotification) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetchNotifications(1, 50);
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // giữ state cũ
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const refreshUnreadOnly = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch {}
  }, [session?.accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!session?.accessToken) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        await ChatHub.connect();
        if (cancelled) return;
        cleanup = ChatHub.onReceiveNotification((incoming: {
          id: string;
          category: string;
          title: string;
          body: string;
          payloadJson?: string | null;
          actionType?: string | null;
          createdAt: string;
          read?: boolean;
        }) => {
          const n: AppNotification = {
            id: incoming.id,
            category: (incoming.category as NotificationCategory) ?? 'system',
            title: incoming.title,
            body: incoming.body,
            payloadJson: incoming.payloadJson,
            actionType: incoming.actionType,
            createdAt: incoming.createdAt,
            read: incoming.read ?? false,
          };
          setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
          if (!n.read) setUnreadCount((c) => c + 1);
        });
      } catch {}
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [session?.accessToken]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const prepend = useCallback((n: AppNotification) => {
    setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
    if (!n.read) setUnreadCount((c) => c + 1);
  }, []);

  const value = useMemo(() => ({
    items,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
    prepend,
  }), [items, unreadCount, loading, refresh, markRead, markAllRead, prepend]);

  // Đồng bộ badge khi quay lại app
  useEffect(() => {
    const id = setInterval(refreshUnreadOnly, 60_000);
    return () => clearInterval(id);
  }, [refreshUnreadOnly]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function useNotificationUnreadCount(): number {
  const ctx = useContext(NotificationContext);
  return ctx?.unreadCount ?? 0;
}
