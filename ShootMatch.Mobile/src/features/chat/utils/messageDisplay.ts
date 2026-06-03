import type { Message } from '../api';
import { formatImageUrl } from '../../../shared/utils/formatImageUrl';

/** URL hiển thị — sau 3 ngày dùng bản preview. */
export function getMessageDisplayContent(msg: Message): string {
  if (msg.contentType === 'Image') {
    const expired = msg.mediaExpiresAt && new Date(msg.mediaExpiresAt) <= new Date();
    if (expired && msg.mediaPreviewUrl) return msg.mediaPreviewUrl;
  }
  return msg.displayContent ?? msg.content;
}

export function getMessageImageUri(msg: Message): string {
  return formatImageUrl(getMessageDisplayContent(msg));
}

export function isImageMessage(msg: Message): boolean {
  return msg.contentType === 'Image';
}
