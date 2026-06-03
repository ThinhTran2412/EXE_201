import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, LogIn, Mail, UserPlus } from "lucide-react";
import axios from "axios";
import { api } from "../../lib/api";
import { resolveTokenUserId } from "../../lib/jwt";
import { useAuthStore } from "../../store/useAuthStore";

type StaffAuthVariant = "login" | "register";

interface StaffAuthPageProps {
  variant: StaffAuthVariant;
}

export default function StaffAuthPage({ variant }: StaffAuthPageProps) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const endpoints = useMemo(
    () => ({
      login: "/staff-auth/login",
      register: "/staff-auth/register",
    }),
    [],
  );

  const saveSession = (data: { accessToken: string; refreshToken?: string }) => {
    const userId = resolveTokenUserId(data.accessToken);
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      role: "staff",
      userId,
    });
    navigate("/staff", { replace: true });
  };

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleEmailSubmit = async () => {
    resetMessages();

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedDisplayName = displayName.trim();

    if (variant === "register" && !trimmedDisplayName) {
      setError("Vui lòng nhập tên hiển thị.");
      return;
    }

    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const payload =
        variant === "login"
          ? { email: normalizedEmail, password }
          : { email: normalizedEmail, password, displayName: trimmedDisplayName };

      const { data } =
        variant === "login" ? await api.post(endpoints.login, payload) : await api.post(endpoints.register, payload);

      if (data?.accessToken) {
        saveSession(data);
      } else if (variant === "register" && data?.pending) {
        setSuccess(typeof data.message === "string" ? data.message : "Tài khoản đã được tạo và đang chờ duyệt.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseError = error.response?.data as { error?: string } | string | undefined;
        const message = typeof responseError === "string" ? responseError : responseError?.error;
        setError(
          message ??
            (variant === "login"
              ? "Đăng nhập thất bại. Kiểm tra lại email và mật khẩu."
              : "Đăng ký thất bại. Kiểm tra lại thông tin."),
        );
      } else {
        setError(
          variant === "login"
            ? "Đăng nhập thất bại. Kiểm tra lại email và mật khẩu."
            : "Đăng ký thất bại. Kiểm tra lại thông tin.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isLogin = variant === "login";
  const panelSide = isLogin ? "order-2 lg:order-2" : "order-1 lg:order-1";
  const formSide = isLogin ? "order-1 lg:order-1" : "order-2 lg:order-2";
  const title = isLogin ? "Sign in to ShootMatch" : "Create Account";
  const subtitle = isLogin
    ? "Welcome back. Use your staff account to continue."
    : "Create a staff account with email and password.";
  const panelTitle = isLogin ? "Hello, Friend!" : "Welcome Back!";
  const panelText = isLogin
    ? "Enter your personal details and start your journey with us."
    : "To keep connected with us please login with your personal info.";
  const panelButtonLabel = isLogin ? "SIGN UP" : "SIGN IN";
  const panelButtonTo = isLogin ? "/auth/staff/register" : "/auth/staff/login";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(245,242,235,1)_48%,_rgba(229,91,40,0.08)_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] ring-1 ring-white/70 lg:min-h-[620px] lg:grid-cols-2">
          <div className={`${formSide} flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14`}>
            <div className="mx-auto w-full max-w-md">
              <div className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
                <BadgeCheck className="h-5 w-5 text-[#e65a28]" />
                ShootMatch Auth
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{title}</h1>
              <p className="mt-4 text-sm leading-7 text-slate-500 md:text-base">{subtitle}</p>

              {error && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <div className="mt-6 space-y-4">
                {variant === "register" && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#e65a28] focus:bg-white"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-[#e65a28] focus:bg-white"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#e65a28] focus:bg-white"
                  />
                </label>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleEmailSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e65a28] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#cf4028] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isLogin ? "Sign In" : "Sign Up"}
                </button>

                {variant === "register" && (
                  <p className="text-sm leading-6 text-slate-500">Đăng ký bằng email và mật khẩu giống mobile.</p>
                )}
              </div>
            </div>
          </div>

          <div
            className={`${panelSide} relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-800 px-6 py-10 text-white sm:px-10 lg:px-14`}
          >
            <div className="absolute right-[-72px] top-[-72px] h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-[-80px] left-[-60px] h-56 w-56 rounded-full bg-[#e65a28]/25 blur-3xl" />

            <div className="relative mx-auto w-full max-w-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <BadgeCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-8 text-3xl font-black leading-tight md:text-4xl">{panelTitle}</h2>
              <p className="mt-4 text-sm leading-7 text-white/80 md:text-base">{panelText}</p>

              <div className="mt-8 grid gap-3 text-left text-sm text-white/90">
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">Email / password login</div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">Pending approval after sign up</div>
              </div>

              <button
                type="button"
                onClick={() => navigate(panelButtonTo)}
                className="mt-8 rounded-full border border-white/80 px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-slate-900"
              >
                {panelButtonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
