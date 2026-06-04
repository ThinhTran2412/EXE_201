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

export async function sendImageMessage(conversationId: string, photoUrl: string, previewUrl?: string) {
  const conn = await connect();
  await conn.invoke('SendImageMessage', conversationId, photoUrl, previewUrl ?? null);
}

export function onReceiveMessage(
  handler: (msg: { senderId: string; senderRole: string; content: string; sentAt: string }) => void
) {
  connection?.on('ReceiveMessage', handler);
  return () => connection?.off('ReceiveMessage', handler);
}

export function onReceiveNotification(
  handler: (incoming: {
    id: string;
    category: string;
    title: string;
    body: string;
    payloadJson?: string | null;
    actionType?: string | null;
    createdAt: string;
    read?: boolean;
  }) => void
) {
  connection?.on('ReceiveNotification', handler);
  return () => connection?.off('ReceiveNotification', handler);
}

// ── Calling Methods ───────────────────────────────────────────────────────────
export async function startCall(conversationId: string, callType: string, sessionToken?: string) {
  const conn = await connect();
  await conn.invoke('StartCall', conversationId, callType, sessionToken || null);
}

export async function acceptCall(callSessionId: string, sessionToken?: string) {
  const conn = await connect();
  await conn.invoke('AcceptCall', callSessionId, sessionToken || null);
}

export async function rejectCall(callSessionId: string, reason?: string) {
  const conn = await connect();
  await conn.invoke('RejectCall', callSessionId, reason || 'rejected');
}

export async function endCall(callSessionId: string, reason?: string) {
  const conn = await connect();
  await conn.invoke('EndCall', callSessionId, reason || 'ended');
}

export async function cancelCall(callSessionId: string, reason?: string) {
  const conn = await connect();
  await conn.invoke('CancelCall', callSessionId, reason || 'cancelled');
}

export async function sendCallSignal(callSessionId: string, signalType: string, payloadJson: string) {
  const conn = await connect();
  await conn.invoke('SendCallSignal', callSessionId, signalType, payloadJson);
}

export async function joinCallRoom(callSessionId: string) {
  const conn = await connect();
  await conn.invoke('JoinCallRoom', callSessionId);
}

// ── Calling Event Listeners ───────────────────────────────────────────────────
export function onReceiveCallEvent(
  handler: (evt: {
    id: string;
    conversationId: string;
    callType: string;
    status: string;
    initiatorId: string;
    initiatorRole: string;
    startedAt: string;
    answeredAt?: string;
    endedAt?: string;
    endReason?: string;
    sessionToken?: string;
    event: 'ring' | 'accept' | 'reject' | 'hangup' | 'cancel' | string;
  }) => void
) {
  connection?.on('ReceiveCallEvent', handler);
  return () => connection?.off('ReceiveCallEvent', handler);
}

export function onReceiveCallSignal(
  handler: (sig: {
    id: string;
    callSessionId: string;
    conversationId: string;
    senderId: string;
    senderRole: string;
    signalType: string;
    payloadJson: string;
    sentAt: string;
  }) => void
) {
  connection?.on('ReceiveCallSignal', handler);
  return () => connection?.off('ReceiveCallSignal', handler);
}

export function getConnection() { return connection; }

