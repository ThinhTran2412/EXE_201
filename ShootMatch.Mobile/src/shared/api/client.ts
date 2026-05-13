import axios from 'axios';
import { tokenStorage } from '../storage/tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.31:5062';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccess();
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
        const refresh = await tokenStorage.getRefresh();
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
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        await tokenStorage.clear();
      }
    }
    return Promise.reject(error);
  }
);

export { API_URL };
