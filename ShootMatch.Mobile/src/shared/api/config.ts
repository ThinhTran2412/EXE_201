export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.pickic.io.vn';

export const SIGNALR_URL =
  process.env.EXPO_PUBLIC_SIGNALR_URL ?? `${API_URL.replace(/\/$/, '')}/hubs/chat`;
