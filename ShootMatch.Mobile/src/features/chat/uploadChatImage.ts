import { API_URL } from '../../shared/api/config';
import { parseApiError } from '../../shared/api/parseApiError';
import { ensureAccessToken } from '../../shared/auth/tokenRefresh';
import type { ChatImageUploadResult } from './types';

export type { ChatImageUploadResult } from './types';

/**
 * Upload multipart qua fetch — ổn định hơn axios trên React Native / Expo.
 * Không set Content-Type thủ công (để runtime tự gắn boundary).
 */
export async function uploadChatImage(
  conversationId: string,
  uri: string,
  mimeType: string,
  filename: string,
): Promise<ChatImageUploadResult> {
  const token = await ensureAccessToken();
  if (!token) throw new Error('Chưa đăng nhập — không thể gửi ảnh.');

  const form = new FormData();
  form.append('file', {
    uri,
    name: filename,
    type: mimeType,
  } as any);

  const url = `${API_URL}/api/conversations/${conversationId}/media/upload`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: form,
  });

  const text = await response.text();
  let body: ChatImageUploadResult & { error?: string } = {} as ChatImageUploadResult;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // ignore
  }

  if (!response.ok) {
    const msg = body?.error ?? `Upload thất bại (${response.status})`;
    console.warn('[uploadChatImage]', response.status, url, text.slice(0, 300));
    throw new Error(msg);
  }

  if (!body.photoUrl || !body.previewUrl) {
    console.warn('[uploadChatImage] invalid response', body);
    throw new Error('Server không trả về URL ảnh.');
  }

  return body;
}

export function logChatImageError(err: unknown, step: string) {
  const message = parseApiError(err, 'Không gửi được ảnh.');
  console.warn(`[chat-image] ${step}:`, message, err);
  return message;
}
