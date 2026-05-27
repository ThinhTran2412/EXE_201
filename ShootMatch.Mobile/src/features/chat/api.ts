import { gql } from '../../shared/api/graphql';

export interface Message {
  id:          string;
  senderId:    string;
  senderRole:  string;
  content:     string;
  contentType: string;
  sentAt:      string;
  readAt?:     string;
  displayContent?: string;
  mediaPreviewUrl?: string;
  mediaExpiresAt?: string;
}

export interface ConversationWithPhotographer {
  id:             string;
  matchId:        string;
  customerId:     string;
  photographerId: string;
  status:         string;
  lastMessageAt?: string;
  customerDisplayName?:     string;
  photographerDisplayName?: string;
  customerAvatarUrl?:       string;
  photographerAvatarUrl?:   string;
  customerLastSeenAt?:      string;
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const data = await gql<{ conversationMessages: Message[] }>(`
    query GetMessages($id: UUID!) {
      conversationMessages(conversationId: $id) {
        id senderId senderRole content contentType sentAt readAt
        displayContent mediaPreviewUrl mediaExpiresAt
      }
    }
  `, { id: conversationId });
  return data.conversationMessages ?? [];
}

export async function getConversationsByPhotographer(): Promise<ConversationWithPhotographer[]> {
  const data = await gql<{ myConversationsAsPhotographer: ConversationWithPhotographer[] }>(`
    query { myConversationsAsPhotographer {
      id matchId customerId photographerId status lastMessageAt
      customerDisplayName photographerDisplayName customerAvatarUrl photographerAvatarUrl customerLastSeenAt
    }}
  `);
  return data.myConversationsAsPhotographer ?? [];
}
