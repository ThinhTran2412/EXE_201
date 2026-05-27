import type { NotificationPayload } from './types';

export function parseNotificationPayload(payloadJson?: string | null): NotificationPayload {
  if (!payloadJson) return {};
  try {
    return JSON.parse(payloadJson) as NotificationPayload;
  } catch {
    return {};
  }
}
