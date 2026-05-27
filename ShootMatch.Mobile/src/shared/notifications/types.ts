export type NotificationCategory = 'message' | 'booking' | 'match' | 'call' | 'review' | 'system';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  payloadJson?: string | null;
  actionType?: string | null;
  createdAt: string;
  readAt?: string | null;
  read: boolean;
}

export interface NotificationPayload {
  conversationId?: string;
  messageId?: string;
  bookingId?: string;
  matchId?: string;
}
