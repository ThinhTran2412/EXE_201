import { create } from "zustand";
import { resolveTokenUserId } from "../lib/jwt";

export type UserRole = "customer" | "photographer" | "staff" | "admin" | null;

export interface AuthSession {
  accessToken: string;
  refreshToken?: string | null;
  role: UserRole;
  userId: string;
}

interface AuthState {
  session: AuthSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole;
  userId: string | null;
  adminAvatarUrl: string | null;
  isReady: boolean;
  setSession: (session: AuthSession) => void;
  setAdminToken: (token: string | null, refreshToken?: string | null) => void;
  setAdminAvatarUrl: (avatarUrl: string | null) => void;
  clearSession: () => void;
}

const STORAGE_KEY = "sm_web_session";
const ADMIN_KEY = "adminToken";
const ADMIN_PROFILE_KEY = "sm_admin_profile";

interface AdminProfileState {
  avatarUrl: string | null;
}

function readInitialSession(): AuthSession | null {
  if (typeof localStorage === "undefined") return null;

  const rawSession = localStorage.getItem(STORAGE_KEY);
  if (rawSession) {
    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const adminToken = localStorage.getItem(ADMIN_KEY);
  if (adminToken) {
    return {
      accessToken: adminToken,
      refreshToken: null,
      role: "admin",
      userId: resolveTokenUserId(adminToken),
    };
  }

  return null;
}

function readAdminProfile(): AdminProfileState {
  if (typeof localStorage === "undefined") return { avatarUrl: null };

  const rawProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (!rawProfile) return { avatarUrl: null };

  try {
    const parsed = JSON.parse(rawProfile) as AdminProfileState;
    return { avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : null };
  } catch {
    localStorage.removeItem(ADMIN_PROFILE_KEY);
    return { avatarUrl: null };
  }
}

function persistAdminProfile(profile: AdminProfileState) {
  if (typeof localStorage === "undefined") return;
  if (!profile.avatarUrl) {
    localStorage.removeItem(ADMIN_PROFILE_KEY);
    return;
  }

  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
}

function persistSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    if (session.role === "admin") {
      localStorage.setItem(ADMIN_KEY, session.accessToken);
    } else {
      localStorage.removeItem(ADMIN_KEY);
    }
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

const initialSession = readInitialSession();
const initialAdminProfile = readAdminProfile();

export const useAuthStore = create<AuthState>((set) => ({
  session: initialSession,
  accessToken: initialSession?.accessToken ?? null,
  refreshToken: initialSession?.refreshToken ?? null,
  role: initialSession?.role ?? null,
  userId: initialSession?.userId ?? null,
  adminAvatarUrl: initialAdminProfile.avatarUrl,
  isReady: true,
  setSession: (session) => {
    persistSession(session);
    if (session.role !== "admin") {
      set({ adminAvatarUrl: null });
    }
    set({
      session,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? null,
      role: session.role,
      userId: session.userId,
      adminAvatarUrl: session.role === "admin" ? readAdminProfile().avatarUrl : null,
      isReady: true,
    });
  },
  setAdminToken: (token, refreshToken) => {
    if (!token) {
      persistSession(null);
      persistAdminProfile({ avatarUrl: null });
      set({
        session: null,
        accessToken: null,
        refreshToken: null,
        role: null,
        userId: null,
        adminAvatarUrl: null,
        isReady: true,
      });
      return;
    }

    const session: AuthSession = {
      accessToken: token,
      refreshToken: refreshToken ?? null,
      role: "admin",
      userId: resolveTokenUserId(token),
    };

    persistSession(session);
    set({
      session,
      accessToken: token,
      refreshToken: refreshToken ?? null,
      role: "admin",
      userId: session.userId,
      adminAvatarUrl: readAdminProfile().avatarUrl,
      isReady: true,
    });
  },
  setAdminAvatarUrl: (avatarUrl) => {
    persistAdminProfile({ avatarUrl });
    set((state) => (state.role === "admin" ? { adminAvatarUrl: avatarUrl } : { adminAvatarUrl: null }));
  },
  clearSession: () => {
    persistSession(null);
    persistAdminProfile({ avatarUrl: null });
    set({
      session: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      userId: null,
      adminAvatarUrl: null,
      isReady: true,
    });
  },
}));
