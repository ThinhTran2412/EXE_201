import axios from 'axios';
import { tokenStorage } from '../storage/tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.31:5062';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function refreshAccessToken() {
  try {
    const refresh = await tokenStorage.getRefresh();
    if (!refresh) throw new Error("No refresh token");
    const role = await tokenStorage.getRole();
    const endpoint = role === 'photographer'
      ? '/api/photographer-auth/refresh'
      : '/api/auth/refresh';
    const { data } = await axios.post(`${API_URL}${endpoint}`, { refreshToken: refresh });
    await tokenStorage.save(
      data.accessToken,
      data.refreshToken,
      role ?? 'customer',
      data.userId ?? ''
    );
    return data.accessToken;
  } catch (error) {
    await tokenStorage.clear();
    DeviceEventEmitter.emit('onSessionExpired');
    throw error;
  }
}

// Attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

import { DeviceEventEmitter } from 'react-native';

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch {
        // refreshAccessToken handles clearing and event emission
      }
    }
    return Promise.reject(error);
  }
);

export { API_URL };
