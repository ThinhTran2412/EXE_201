import * as signalR from '@microsoft/signalr';
import { tokenStorage } from '../../shared/storage/tokenStorage';

const HUB_URL = process.env.EXPO_PUBLIC_SIGNALR_URL ?? 'http://192.168.1.7:5000/hubs/chat';

let connection: signalR.HubConnection | null = null;

export async function connect(): Promise<signalR.HubConnection> {
  if (connection?.state === signalR.HubConnectionState.Connected) return connection;

  const token = await tokenStorage.getAccess();

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      // WebSocket doesn't support Authorization header — send via query string
      accessTokenFactory: () => token ?? '',
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  await connection.start();
  return connection;
}

export async function disconnect() {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}

export async function joinConversation(conversationId: string) {
  const conn = await connect();
  await conn.invoke('JoinConversation', conversationId);
}

export async function leaveConversation(conversationId: string) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('LeaveConversation', conversationId);
  }
}

export async function sendMessage(conversationId: string, content: string) {
  const conn = await connect();
  await conn.invoke('SendMessage', conversationId, content);
}

export function onReceiveMessage(
  handler: (msg: { senderId: string; senderRole: string; content: string; sentAt: string }) => void
) {
  connection?.on('ReceiveMessage', handler);
  return () => connection?.off('ReceiveMessage', handler);
}

export function getConnection() { return connection; }
