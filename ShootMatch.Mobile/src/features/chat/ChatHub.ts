import * as signalR from '@microsoft/signalr';
import { AppState, type AppStateStatus } from 'react-native';
import { ensureAccessToken, refreshAccessToken } from '../../shared/auth/tokenRefresh';
import { SIGNALR_URL } from '../../shared/api/config';

const HUB_URL = SIGNALR_URL;

/** Client chờ server ping — mặc định 30s dễ timeout trên iOS khi idle */
const SERVER_TIMEOUT_MS = 90_000;
const KEEP_ALIVE_MS = 20_000;

let connection: signalR.HubConnection | null = null;
let appStateSub: { remove: () => void } | null = null;

function isUnauthorizedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('401') || msg.toLowerCase().includes('unauthorized');
}

function isTimeoutDisconnect(err?: Error): boolean {
  if (!err?.message) return false;
  return err.message.includes('timeout') || err.message.includes('Server timeout');
}

function buildConnection(): signalR.HubConnection {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: async () => (await ensureAccessToken()) ?? '',
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
    .configureLogging(signalR.LogLevel.Error)
    .build();

  conn.serverTimeoutInMilliseconds = SERVER_TIMEOUT_MS;
  conn.keepAliveIntervalInMilliseconds = KEEP_ALIVE_MS;

  conn.onreconnecting(() => {
    // Đang thử kết nối lại — không log ERROR
  });

  conn.onreconnected(() => {
    // Kết nối lại thành công
  });

  conn.onclose((err) => {
    if (err && !isTimeoutDisconnect(err)) {
      console.warn('[ChatHub] disconnected:', err.message);
    }
  });

  return conn;
}

function ensureAppStateListener() {
  if (appStateSub) return;
  appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active' && connection?.state === signalR.HubConnectionState.Disconnected) {
      connect().catch(() => {});
    }
  });
}

export async function connect(): Promise<signalR.HubConnection> {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    ensureAppStateListener();
    return connection;
  }

  const token = await ensureAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập — không thể kết nối chat realtime.');
  }

  if (!connection || connection.state === signalR.HubConnectionState.Disconnected) {
    connection = buildConnection();
  }

  if (connection.state === signalR.HubConnectionState.Connecting
    || connection.state === signalR.HubConnectionState.Reconnecting) {
    return connection;
  }

  try {
    await connection.start();
    ensureAppStateListener();
  } catch (err) {
    if (!isUnauthorizedError(err)) throw err;

    const refreshed = await refreshAccessToken();
    if (!refreshed) throw err;

    connection = buildConnection();
    await connection.start();
    ensureAppStateListener();
  }

  return connection;
}

export async function disconnect() {
  if (connection) {
    try {
      await connection.stop();
    } catch {
      // noop
    }
    connection = null;
  }
}

export async function joinConversation(conversationId: string) {
  const conn = await connect();
  await conn.invoke('JoinConversation', conversationId);
}

export async function leaveConversation(conversationId: string) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    try {
      await connection.invoke('LeaveConversation', conversationId);
    } catch {
      // noop
    }
  }
}

export async function sendMessage(conversationId: string, content: string) {
  const conn = await connect();
  await conn.invoke('SendMessage', conversationId, content);
}

export async function sendImageMessage(conversationId: string, imageUrl: string, previewUrl: string) {
  const conn = await connect();
  await conn.invoke('SendImageMessage', conversationId, imageUrl, previewUrl);
}

export interface ReceivedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  contentType: string;
  sentAt: string;
  mediaPreviewUrl?: string;
  mediaExpiresAt?: string;
}

export function onReceiveMessage(handler: (msg: ReceivedMessage) => void) {
  connection?.on('ReceiveMessage', handler);
  return () => connection?.off('ReceiveMessage', handler);
}

export interface ReceivedNotification {
  id: string;
  category: string;
  title: string;
  body: string;
  payloadJson?: string | null;
  actionType?: string | null;
  createdAt: string;
  read?: boolean;
}

export function onReceiveNotification(handler: (n: ReceivedNotification) => void) {
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
  }) => void,
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
  }) => void,
) {
  connection?.on('ReceiveCallSignal', handler);
  return () => connection?.off('ReceiveCallSignal', handler);
}

export function getConnection() { return connection; }
