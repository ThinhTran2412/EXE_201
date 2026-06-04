import type { Message } from '../api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

/** URL hiển thị — sau 3 ngày dùng bản preview. */
export function getMessageDisplayContent(msg: Message): string {
  const typed = msg as Message & {
    mediaExpiresAt?: string | null;
    mediaPreviewUrl?: string | null;
    displayContent?: string | null;
  };

  if (typed.contentType === 'Image') {
    const expired = typed.mediaExpiresAt && new Date(typed.mediaExpiresAt) <= new Date();
    if (expired && typed.mediaPreviewUrl) return typed.mediaPreviewUrl;
  }
  return typed.displayContent ?? typed.content;
}

export function getMessageImageUri(msg: Message): string {
  return formatImageUrl(getMessageDisplayContent(msg));
}

export function isImageMessage(msg: Message): boolean {
  return msg.contentType === 'Image';
}
