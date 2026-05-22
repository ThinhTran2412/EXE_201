import { Link, useNavigate } from "react-router-dom";
import { LogOut, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

export default function CustomerHome() {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_rgba(255,247,240,1)_0%,_rgba(255,255,255,1)_45%,_rgba(245,242,235,1)_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-orange-600">
                <Sparkles className="h-3.5 w-3.5" /> Customer Area
              </p>
              <h1 className="text-3xl font-black uppercase md:text-5xl">Đã đăng nhập thành công</h1>
              <p className="mt-3 text-slate-600">Session hiện tại dùng cùng JWT/refresh/role model với mobile.</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-black"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Role</p>
              <p className="mt-2 text-lg font-bold">{session?.role ?? "customer"}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">User ID</p>
              <p className="mt-2 break-all text-lg font-bold">{session?.userId || "N/A"}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Điều hướng</p>
              <Link to="/auth" className="mt-2 inline-block text-lg font-bold text-orange-600 hover:text-orange-700">
                Về màn đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
