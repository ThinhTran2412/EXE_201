import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../../shared/api/client';
import { tokenStorage } from '../../shared/storage/tokenStorage';

export type UserRole = 'customer' | 'photographer' | null;

interface Session {
  accessToken: string;
  role: UserRole;
  userId: string;
}

interface AuthContextValue {
  session:           Session | null;
  initializing:      boolean;
  sendOtp:           (phone: string, role: UserRole) => Promise<void>;
  verifyOtp:         (phone: string, code: string, role: UserRole) => Promise<void>;
  loginWithEmail:    (email: string, password: string, role: UserRole) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  loginWithGoogle:   (idToken: string, role: UserRole) => Promise<void>;
  logout:            () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session,      setSession]      = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      const access = await tokenStorage.getAccess();
      const role   = await tokenStorage.getRole() as UserRole;
      const userId = await tokenStorage.getUserId();
      if (access && role) setSession({ accessToken: access, role, userId: userId ?? '' });
    })().finally(() => setInitializing(false));
  }, []);

  // ── Phone OTP ──────────────────────────────────────────────────────────────

  async function sendOtp(phone: string, role: UserRole) {
    const endpoint = role === 'photographer'
      ? '/api/photographer-auth/otp/send'
      : '/api/auth/otp/send';
    await apiClient.post(endpoint, { phone });
  }

  async function verifyOtp(phone: string, code: string, role: UserRole) {
    const endpoint = role === 'photographer'
      ? '/api/photographer-auth/otp/verify'
      : '/api/auth/otp/verify';
    const { data } = await apiClient.post(endpoint, { phone, otpCode: code });
    await _saveSession(data, role);
  }

  // ── Email + Password ───────────────────────────────────────────────────────

  async function loginWithEmail(email: string, password: string, role: UserRole) {
    const endpoint = role === 'photographer'
      ? '/api/photographer-auth/login'
      : '/api/auth/login';
    const { data } = await apiClient.post(endpoint, { email, password });
    await _saveSession(data, role);
  }

  async function registerWithEmail(
    email: string, password: string, displayName: string, role: UserRole,
  ) {
    const endpoint = role === 'photographer'
      ? '/api/photographer-auth/register'
      : '/api/auth/register';
    const { data } = await apiClient.post(endpoint, { email, password, displayName });
    await _saveSession(data, role);
  }

  // ── Google OAuth ───────────────────────────────────────────────────────────

  async function loginWithGoogle(idToken: string, role: UserRole) {
    const endpoint = role === 'photographer'
      ? '/api/photographer-auth/google'
      : '/api/auth/google';
    const { data } = await apiClient.post(endpoint, { idToken });
    await _saveSession(data, role);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function logout() {
    await tokenStorage.clear();
    setSession(null);
  }

  async function _saveSession(data: any, role: UserRole) {
    const userId = data.customerId ?? data.photographerId ?? '';
    await tokenStorage.save(data.accessToken, data.refreshToken, role ?? 'customer', userId);
    setSession({ accessToken: data.accessToken, role, userId });
  }

  return (
    <AuthContext.Provider value={{
      session, initializing,
      sendOtp, verifyOtp,
      loginWithEmail, registerWithEmail, loginWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
