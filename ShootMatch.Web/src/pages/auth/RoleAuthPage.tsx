import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, CircleDashed, Fingerprint, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import { resolveTokenUserId } from "../../lib/jwt";
import { useAuthStore } from "../../store/useAuthStore";
import type { UserRole } from "../../store/useAuthStore";

type AuthMode = "otp" | "email" | "register" | "phone" | "google";
type AuthVariant = "all" | "login" | "register";

export default function RoleAuthPage({
  role,
  variant = "all",
}: {
  role: Exclude<UserRole, null>;
  variant?: AuthVariant;
}) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [mode, setMode] = useState<AuthMode>(() => {
    if (role === "staff") {
      return variant === "login" ? "email" : variant === "register" ? "register" : "register";
    }

    return "otp";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [googleIdToken, setGoogleIdToken] = useState("");

  const endpoints = useMemo(() => {
    const prefix = role === "photographer" ? "/photographer-auth" : role === "staff" ? "/staff-auth" : "/auth";
    return {
      otpSend: `${prefix}/otp/send`,
      otpVerify: `${prefix}/otp/verify`,
      login: `${prefix}/login`,
      register: `${prefix}/register`,
      google: `${prefix}/google`,
      googleRegister: role === "staff" ? "/staff-auth/google/register" : `${prefix}/google`,
    };
  }, [role]);

  const destination = role === "photographer" ? "/photographer" : role === "staff" ? "/staff" : "/customer";

  const saveSession = (data: { accessToken: string; refreshToken?: string }) => {
    const tokenRole = role;
    const userId = resolveTokenUserId(data.accessToken);
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      role: tokenRole,
      userId,
    });
    navigate(destination, { replace: true });
  };

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post(endpoints.otpSend, { phone });
      setSuccess("Mã OTP đã được gửi.");
    } catch {
      setError("Không gửi được OTP. Kiểm tra số điện thoại hoặc kết nối API.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post(endpoints.otpVerify, { phone, otpCode });
      if (data?.accessToken) {
        saveSession(data);
      } else if (data?.pending) {
        setSuccess(typeof data.message === "string" ? data.message : "Tài khoản đang chờ duyệt.");
      } else {
        setSuccess("Xác thực OTP thành công.");
      }
    } catch {
      setError("OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post(endpoints.login, { email, password });
      saveSession(data);
    } catch {
      setError("Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post(endpoints.register, { email, password, displayName });
      saveSession(data);
    } catch {
      setError("Đăng ký thất bại. Kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post(endpoints.google, { idToken: googleIdToken });
      if (data?.accessToken) {
        saveSession(data);
      } else if (data?.pending) {
        setSuccess(typeof data.message === "string" ? data.message : "Tài khoản đã được tạo và đang chờ duyệt.");
      } else {
        setSuccess("Đăng nhập Google thành công.");
      }
    } catch {
      setError("Không thể xác thực Google token.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post(endpoints.googleRegister, { idToken: googleIdToken });
      if (data?.accessToken) {
        saveSession(data);
      } else {
        setSuccess(typeof data?.message === "string" ? data.message : "Đăng ký Gmail đã gửi thành công.");
      }
    } catch {
      setError("Không thể xác thực Google token.");
    } finally {
      setLoading(false);
    }
  };

  const title = role === "photographer" ? "Nhiếp ảnh gia" : role === "staff" ? "Staff" : "Khách hàng";
  const authLabel = variant === "register" ? "Đăng ký" : "Đăng nhập";
  const toneClass =
    role === "photographer"
      ? "from-slate-900 via-slate-800 to-slate-700"
      : role === "staff"
        ? "from-emerald-700 via-teal-700 to-slate-800"
        : "from-orange-500 via-amber-500 to-rose-500";
  const showOtp = role !== "staff";
  const showPhone = role === "staff" && (variant === "all" || mode === "phone");
  const showGoogle = true;
  const modes: AuthMode[] =
    role === "staff"
      ? variant === "login"
        ? ["email", "phone", "google"]
        : variant === "register"
          ? ["register", "phone", "google"]
          : ["email", "register", "phone", "google"]
      : ["otp", "email", "register", "google"];

  const staffModeCopy = {
    login: {
      intro: "Đăng nhập staff bằng đúng một trong các cách: email/mật khẩu, số điện thoại, hoặc Gmail.",
      primaryAction: "Đăng nhập",
      phoneAction: "Xác thực số điện thoại",
      googleAction: "Đăng nhập bằng Gmail",
      phoneHint: "Nhận OTP qua số điện thoại để vào hệ thống staff.",
    },
    register: {
      intro: "Đăng ký staff bằng email/mật khẩu, số điện thoại, hoặc Gmail. Tài khoản vẫn cần chờ duyệt.",
      primaryAction: "Tạo tài khoản",
      phoneAction: "Đăng ký bằng số điện thoại",
      googleAction: "Đăng ký bằng Gmail",
      phoneHint: "Dùng OTP để tạo staff mới bằng số điện thoại.",
    },
  } as const;
  const currentStaffCopy = variant === "register" ? staffModeCopy.register : staffModeCopy.login;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(245,242,235,1)_50%,_rgba(255,174,92,0.12)_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div
          className={`rounded-[2rem] bg-gradient-to-br ${toneClass} p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]`}
        >
          <div className="inline-flex rounded-2xl bg-white/10 p-3 backdrop-blur">
            {role === "photographer" ? <Camera className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">ShootMatch Web</p>
          <h1 className="mt-3 text-4xl font-black uppercase leading-tight md:text-5xl">
            {authLabel} {title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            {role === "staff"
              ? currentStaffCopy.intro
              : "Cùng session model với mobile và backend: email/mật khẩu, Gmail, số điện thoại, refresh token và role guard."}
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/85">
            {showOtp && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <Phone className="h-4 w-4" /> OTP qua điện thoại
              </div>
            )}
            {showPhone && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <Phone className="h-4 w-4" /> {variant === "register" ? "Đăng ký bằng số điện thoại" : "Số điện thoại"}
              </div>
            )}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <Mail className="h-4 w-4" /> Email / mật khẩu
            </div>
            {showGoogle && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <Fingerprint className="h-4 w-4" /> Google ID token
              </div>
            )}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <ShieldCheck className="h-4 w-4" /> Authorization theo role
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {modes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === item ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item === "otp" && "OTP"}
                {item === "email" && (role === "staff" ? (variant === "register" ? "Email" : "Email") : "Email")}
                {item === "register" && (role === "staff" ? "Đăng ký thường" : "Đăng ký")}
                {item === "phone" && "Số điện thoại"}
                {item === "google" && (role === "staff" ? "Gmail" : "Google")}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {showOtp && mode === "otp" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Số điện thoại</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSendOtp}
                  className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Đang gửi..." : "Gửi OTP"}
                </button>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Mã OTP"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleVerifyOtp}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Xác thực OTP
              </button>
            </div>
          )}

          {mode === "email" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleEmailLogin}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                Đăng nhập
              </button>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-4">
              {role === "staff" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  {currentStaffCopy.intro}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Tên hiển thị</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tên của bạn"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleRegister}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {currentStaffCopy.primaryAction}
              </button>
            </div>
          )}

          {mode === "phone" && role === "staff" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Số điện thoại</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSendOtp}
                  className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Đang gửi..." : "Gửi OTP"}
                </button>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Mã OTP"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleVerifyOtp}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {currentStaffCopy.phoneAction}
              </button>
              <p className="text-sm leading-6 text-slate-500">{currentStaffCopy.phoneHint}</p>
            </div>
          )}

          {showGoogle && mode === "google" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {role === "staff" ? "Google ID token / Gmail" : "Google ID token"}
                </label>
                <textarea
                  value={googleIdToken}
                  onChange={(e) => setGoogleIdToken(e.target.value)}
                  rows={5}
                  placeholder={
                    role === "staff"
                      ? "Dán Google ID token của Gmail staff"
                      : "Dán Google ID token nếu web đã tích hợp Google Identity Services"
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={role === "staff" ? handleGoogleRegister : handleGoogleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4285F4] px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CircleDashed className="h-4 w-4" />
                {role === "staff" ? currentStaffCopy.googleAction : "Đăng nhập Google"}
              </button>
            </div>
          )}

          {role === "staff" && variant !== "all" && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span>{variant === "login" ? "Chưa có tài khoản staff?" : "Đã có tài khoản staff?"}</span>
              <button
                type="button"
                onClick={() => navigate(variant === "login" ? "/auth/staff/register" : "/auth/staff/login")}
                className="font-semibold text-[#e65a28] transition hover:text-[#cf4028]"
              >
                {variant === "login" ? "Đăng ký" : "Đăng nhập"}
              </button>
            </div>
          )}

          <p className="mt-6 text-sm leading-6 text-slate-500">
            Mọi luồng trên đều dùng cùng backend auth hiện có và cùng model authorization theo role.
          </p>
        </div>
      </div>
    </div>
  );
}
