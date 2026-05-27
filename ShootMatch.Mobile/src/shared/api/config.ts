export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.31:5062';

export const SIGNALR_URL =
  process.env.EXPO_PUBLIC_SIGNALR_URL ?? `${API_URL.replace(/\/$/, '')}/hubs/chat`;
