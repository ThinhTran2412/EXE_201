import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, CircleDashed, Fingerprint, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import { resolveTokenUserId } from "../../lib/jwt";
import { useAuthStore } from "../../store/useAuthStore";
import type { UserRole } from "../../store/useAuthStore";

type AuthMode = "otp" | "email" | "register" | "google";

export default function RoleAuthPage({ role }: { role: Exclude<UserRole, null> }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [mode, setMode] = useState<AuthMode>("otp");
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
    const prefix = role === "photographer" ? "/photographer-auth" : "/auth";
    return {
      otpSend: `${prefix}/otp/send`,
      otpVerify: `${prefix}/otp/verify`,
      login: `${prefix}/login`,
      register: `${prefix}/register`,
      google: `${prefix}/google`,
    };
  }, [role]);

  const destination = role === "photographer" ? "/photographer" : "/customer";

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
      saveSession(data);
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
      saveSession(data);
    } catch {
      setError("Không thể xác thực Google token.");
    } finally {
      setLoading(false);
    }
  };

  const title = role === "photographer" ? "Nhiếp ảnh gia" : "Khách hàng";
  const toneClass =
    role === "photographer" ? "from-slate-900 via-slate-800 to-slate-700" : "from-orange-500 via-amber-500 to-rose-500";

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
          <h1 className="mt-3 text-4xl font-black uppercase leading-tight md:text-5xl">Đăng nhập {title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            Cùng session model với mobile và backend: OTP, email/mật khẩu, Google, refresh token và role guard.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/85">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <Phone className="h-4 w-4" /> OTP qua điện thoại
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <Mail className="h-4 w-4" /> Email / mật khẩu
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <Fingerprint className="h-4 w-4" /> Google ID token
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <ShieldCheck className="h-4 w-4" /> Authorization theo role
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {(["otp", "email", "register", "google"] as AuthMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === item ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item === "otp" && "OTP"}
                {item === "email" && "Email"}
                {item === "register" && "Đăng ký"}
                {item === "google" && "Google"}
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

          {mode === "otp" && (
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
                Tạo tài khoản
              </button>
            </div>
          )}

          {mode === "google" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Google ID token</label>
                <textarea
                  value={googleIdToken}
                  onChange={(e) => setGoogleIdToken(e.target.value)}
                  rows={5}
                  placeholder="Dán Google ID token nếu web đã tích hợp Google Identity Services"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4285F4] px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CircleDashed className="h-4 w-4" />
                Đăng nhập Google
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
