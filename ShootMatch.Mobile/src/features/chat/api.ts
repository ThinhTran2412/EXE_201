import { gql } from '../../shared/api/graphql';

export interface Message {
  id:          string;
  senderId:    string;
  senderRole:  string;
  content:     string;
  contentType: string;
  sentAt:      string;
  readAt?:     string;
}

export interface ConversationWithPhotographer {
  id:             string;
  matchId:        string;
  customerId:     string;
  photographerId: string;
  status:         string;
  lastMessageAt?: string;
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const data = await gql<{ conversationMessages: Message[] }>(`
    query GetMessages($id: UUID!) {
      conversationMessages(conversationId: $id) {
        id senderId senderRole content contentType sentAt readAt
      }
    }
  `, { id: conversationId });
  return data.conversationMessages ?? [];
}

export async function getConversationsByPhotographer(): Promise<ConversationWithPhotographer[]> {
  const data = await gql<{ myConversationsAsPhotographer: ConversationWithPhotographer[] }>(`
    query { myConversationsAsPhotographer {
      id matchId customerId photographerId status lastMessageAt
    }}
  `);
  return data.myConversationsAsPhotographer ?? [];
}
