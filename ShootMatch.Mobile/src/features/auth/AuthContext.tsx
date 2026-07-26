import React, { createContext, useContext, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../shared/api/client';
import { tokenStorage } from '../../shared/storage/tokenStorage';
import { getUserIdFromAccessToken } from '../../shared/auth/currentUser';
import * as ChatHub from '../chat/ChatHub';

export type UserRole = 'customer' | 'photographer' | null;

interface Session {
  accessToken: string;
  role: UserRole;
  userId: string;
  membershipTier: string;
}

interface AuthContextValue {
  session:           Session | null;
  initializing:      boolean;
  sendOtp:           (phone: string, role: UserRole) => Promise<void>;
  verifyOtp:         (phone: string, code: string, role: UserRole) => Promise<void>;
  loginWithEmail:    (email: string, password: string, role: UserRole) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, role: UserRole, otpCode: string) => Promise<void>;
  loginWithGoogle:   (idToken: string, role: UserRole) => Promise<void>;
  logout:            () => Promise<void>;
  updateMembershipTier: (tier: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session,      setSession]      = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      const access = await tokenStorage.getAccess();
      const role   = await tokenStorage.getRole() as UserRole;
      if (access && role) {
        const userId = getUserIdFromAccessToken(access, role);
        const storedTier = await AsyncStorage.getItem(`sm_membership_tier_${userId}`);
        const defaultTier = role === 'customer' ? 'Lướt Nhẹ' : 'Basic';
        setSession({
          accessToken: access,
          role,
          userId,
          membershipTier: storedTier || defaultTier,
        });

        // Background refresh from backend API
        (async () => {
          try {
            const endpoint = role === 'customer' ? '/api/customers/me' : '/api/photographers/me';
            const response = await apiClient.get(endpoint, {
              headers: { Authorization: `Bearer ${access}` }
            });
            if (response.data && response.data.membershipTier) {
              const freshTier = response.data.membershipTier;
              await AsyncStorage.setItem(`sm_membership_tier_${userId}`, freshTier);
              setSession(prev => prev ? { ...prev, membershipTier: freshTier } : null);
            }
          } catch (e) {
            console.warn('Failed to refresh membership tier from API:', e);
          }
        })();
      }
    })().finally(() => setInitializing(false));

    const sub = DeviceEventEmitter.addListener('onSessionExpired', () => {
      logout();
    });

    return () => {
      sub.remove();
    };
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
    email: string, password: string, displayName: string, role: UserRole, otpCode: string
  ) {
    const endpoint = role === 'photographer'
      ? '/api/photographer-auth/register'
      : '/api/auth/register';
    const { data } = await apiClient.post(endpoint, { email, password, displayName, otpCode });
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
    try {
      await ChatHub.disconnect();
    } catch (e) {
      console.warn('Failed to disconnect ChatHub on logout:', e);
    }
    await tokenStorage.clear();
    setSession(null);
  }

  async function _saveSession(data: any, role: UserRole) {
    const userId = getUserIdFromAccessToken(data.accessToken, role);
    await tokenStorage.save(data.accessToken, data.refreshToken, role ?? 'customer', userId);
    
    let membershipTier = role === 'customer' ? 'Lướt Nhẹ' : 'Basic';
    try {
      const endpoint = role === 'customer' ? '/api/customers/me' : '/api/photographers/me';
      const response = await apiClient.get(endpoint, {
        headers: { Authorization: `Bearer ${data.accessToken}` }
      });
      if (response.data && response.data.membershipTier) {
        membershipTier = response.data.membershipTier;
      }
    } catch (e) {
      console.warn('Failed to load profile for membership tier from API, using default:', e);
      const storedTier = await AsyncStorage.getItem(`sm_membership_tier_${userId}`);
      if (storedTier) membershipTier = storedTier;
    }

    setSession({
      accessToken: data.accessToken,
      role,
      userId,
      membershipTier,
    });
  }

  async function updateMembershipTier(tier: string) {
    if (session) {
      try {
        const endpoint = session.role === 'customer'
          ? '/api/customers/membership'
          : '/api/photographers/membership';
        await apiClient.post(endpoint, { membershipTier: tier });
      } catch (e) {
        console.warn('Failed to update membership tier on backend:', e);
      }
      await AsyncStorage.setItem(`sm_membership_tier_${session.userId}`, tier);
      setSession(prev => prev ? { ...prev, membershipTier: tier } : null);
    }
  }

  return (
    <AuthContext.Provider value={{
      session, initializing,
      sendOtp, verifyOtp,
      loginWithEmail, registerWithEmail, loginWithGoogle,
      logout,
      updateMembershipTier,
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
