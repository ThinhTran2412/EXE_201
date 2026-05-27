import { Message } from '../api';
import { isMyMessage } from '../../../shared/auth/currentUser';

export const CLUSTER_GAP_MS = 5 * 60 * 1000;
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export interface ClusterItem {
  msg: Message;
  isMe: boolean;
}

export interface MessageCluster {
  id: string;
  isMe: boolean;
  messages: ClusterItem[];
  startedAt: string;
  endedAt: string;
}

export type ChatListRow =
  | { type: 'spacer'; key: string }
  | { type: 'cluster'; key: string; cluster: MessageCluster };

export function buildMessageClusters(
  messages: Message[],
  currentUserId: string,
): MessageCluster[] {
  const clusters: MessageCluster[] = [];

  for (const msg of messages) {
    const item: ClusterItem = { msg, isMe: isMyMessage(msg.senderId, currentUserId) };
    const t = new Date(msg.sentAt).getTime();
    const last = clusters[clusters.length - 1];

    const canMerge = last
      && last.isMe === item.isMe
      && t - new Date(last.endedAt).getTime() <= CLUSTER_GAP_MS;

    if (canMerge) {
      last.messages.push(item);
      last.endedAt = msg.sentAt;
    } else {
      clusters.push({
        id: msg.id,
        isMe: item.isMe,
        messages: [item],
        startedAt: msg.sentAt,
        endedAt: msg.sentAt,
      });
    }
  }

  return clusters;
}

export function clustersToListRows(clusters: MessageCluster[]): ChatListRow[] {
  const rows: ChatListRow[] = [];

  clusters.forEach((cluster, index) => {
    if (index > 0) {
      const prev = clusters[index - 1];
      const gap = new Date(cluster.startedAt).getTime() - new Date(prev.endedAt).getTime();
      if (gap > CLUSTER_GAP_MS) {
        rows.push({ type: 'spacer', key: `spacer-${cluster.id}` });
      }
    }
    rows.push({ type: 'cluster', key: cluster.id, cluster });
  });

  return rows;
}

export function formatClusterTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (startIso === endIso || start.getTime() === end.getTime()) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

export function isPeerOnline(lastSeenAt?: string | null, liveUntilMs = 0): boolean {
  if (liveUntilMs > Date.now()) return true;
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}
