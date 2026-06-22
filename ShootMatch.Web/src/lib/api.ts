import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { resolveTokenRole } from "./jwt";

const baseURL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.includes("192.168."))
    ? "http://localhost:5062/api"
    : "https://api.pickic.io.vn/api";

export const api = axios.create({
  baseURL,
});

const refreshClient = axios.create({
  baseURL,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const responseStatus = error.response?.status;

    if (!originalRequest || responseStatus !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const currentSession = useAuthStore.getState().session;
    const refreshToken = currentSession?.refreshToken;

    if (!refreshToken) {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }

    const role = currentSession?.role ?? resolveTokenRole(currentSession?.accessToken ?? "");
    const refreshEndpoint =
      role === "photographer" ? "/photographer-auth/refresh" : role === "customer" ? "/auth/refresh" : null;

    if (!refreshEndpoint) {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const { data } = await refreshClient.post(refreshEndpoint, { refreshToken });
      const nextSession = {
        accessToken: data.accessToken as string,
        refreshToken: data.refreshToken as string,
        role: role,
        userId: currentSession?.userId ?? "",
      };

      useAuthStore.getState().setSession(nextSession);
      originalRequest.headers.Authorization = `Bearer ${nextSession.accessToken}`;
      return api.request(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      return Promise.reject(refreshError);
    }
  },
);
