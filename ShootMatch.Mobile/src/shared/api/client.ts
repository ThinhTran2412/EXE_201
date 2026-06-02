import axios from 'axios';
import { ensureAccessToken, refreshAccessToken } from '../auth/tokenRefresh';
import { tokenStorage } from '../storage/tokenStorage';
import { API_URL } from './config';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach a fresh JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await ensureAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        if (!accessToken) throw new Error('refresh failed');
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch {
        await tokenStorage.clear();
      }
    }
    return Promise.reject(error);
  }
);

export { API_URL } from './config';
