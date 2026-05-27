import axios from 'axios';
import { API_URL } from '../api/config';
import { getUserIdFromAccessToken } from './currentUser';
import { tokenStorage } from '../storage/tokenStorage';

export function isTokenExpired(token: string, bufferMs = 60_000): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = (payload.exp as number) * 1000;
    return Date.now() >= exp - bufferMs;
  } catch {
    return true;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStorage.getRefresh();
  if (!refresh) return null;

  const role = await tokenStorage.getRole();
  const endpoint = role === 'photographer'
    ? '/api/photographer-auth/refresh'
    : '/api/auth/refresh';

  try {
    const { data } = await axios.post(`${API_URL}${endpoint}`, { refreshToken: refresh });
    const userId =
      getUserIdFromAccessToken(data.accessToken, role)
      || (await tokenStorage.getUserId())
      || data.customerId
      || data.photographerId
      || '';
    await tokenStorage.save(
      data.accessToken,
      data.refreshToken,
      role ?? 'customer',
      userId,
    );
    return data.accessToken as string;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

/** Returns a valid access token, refreshing when expired or missing. */
export async function ensureAccessToken(): Promise<string | null> {
  let token = await tokenStorage.getAccess();
  if (!token) return null;
  if (isTokenExpired(token)) {
    token = await refreshAccessToken();
  }
  return token;
}
