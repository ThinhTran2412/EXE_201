import * as signalR from '@microsoft/signalr';
import { tokenStorage } from '../../shared/storage/tokenStorage';
import { refreshAccessToken } from '../../shared/api/client';

const CHAT_HUB_URL = process.env.EXPO_PUBLIC_SIGNALR_URL ?? 'http://192.168.1.7:5000/hubs/chat';
const HUB_URL = CHAT_HUB_URL.replace('/chat', '/location');

let connection: signalR.HubConnection | null = null;

export async function connect(): Promise<signalR.HubConnection> {
  if (connection?.state === signalR.HubConnectionState.Connected) return connection;

  const buildConnection = () => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: async () => {
          const token = await tokenStorage.getAccess();
          return token ?? '';
        },
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    conn.onclose((error) => {
      console.warn('SignalR LocationHub connection closed:', error);
    });
    conn.onreconnecting((error) => {
      console.warn('SignalR LocationHub reconnecting:', error);
    });
    conn.onreconnected((connectionId) => {
      console.log('SignalR LocationHub reconnected:', connectionId);
    });

    return conn;
  };

  connection = buildConnection();

  try {
    await connection.start();
  } catch (err: any) {
    if (err?.message?.includes('401') || err?.statusCode === 401) {
      try {
        await refreshAccessToken();
        connection = buildConnection();
        await connection.start();
      } catch (refreshErr) {
        throw refreshErr;
      }
    } else {
      throw err;
    }
  }
  return connection;
}

export async function disconnect() {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}

export async function joinSession(bookingId: string) {
  const conn = await connect();
  await conn.invoke('JoinSession', bookingId);
}

export async function leaveSession(bookingId: string) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('LeaveSession', bookingId);
  }
}

export async function updateLocation(bookingId: string, latitude: number, longitude: number) {
  const conn = await connect();
  await conn.invoke('UpdateLocation', bookingId, latitude, longitude);
}

export function onReceiveLocation(
  handler: (data: { bookingId: string; senderId: string; role: string; latitude: number; longitude: number; updatedAt: string }) => void
) {
  connection?.on('ReceiveLocation', handler);
  return () => connection?.off('ReceiveLocation', handler);
}
