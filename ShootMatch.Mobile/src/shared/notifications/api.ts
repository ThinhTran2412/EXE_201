import { apiClient } from '../api/client';
import type { AppNotification } from './types';

export async function fetchNotifications(page = 1, pageSize = 30): Promise<{
  items: AppNotification[];
  unreadCount: number;
}> {
  const { data } = await apiClient.get<{
    items: AppNotification[];
    unreadCount: number;
  }>('/api/notifications', { params: { page, pageSize } });
  return {
    items: data.items ?? [],
    unreadCount: data.unreadCount ?? 0,
  };
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<{ unreadCount: number }>('/api/notifications/unread-count');
  return data.unreadCount ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/api/notifications/read-all');
}
