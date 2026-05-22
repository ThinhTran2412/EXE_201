import { Link, useNavigate } from "react-router-dom";
import { Camera, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

export default function PhotographerHome() {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,1),_rgba(30,41,59,1)_55%,_rgba(245,242,235,1)_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-white/70">
                <Camera className="h-3.5 w-3.5" /> Photographer Area
              </p>
              <h1 className="text-3xl font-black uppercase md:text-5xl">Đã đăng nhập thành công</h1>
              <p className="mt-3 max-w-2xl text-white/70">
                Đây là màn protected route cho photographer, sẵn sàng nối vào dashboard, booking và chat.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Role</p>
              <p className="mt-2 text-lg font-bold">{session?.role ?? "photographer"}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">User ID</p>
              <p className="mt-2 break-all text-lg font-bold">{session?.userId || "N/A"}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Điều hướng</p>
              <Link to="/auth" className="mt-2 inline-block text-lg font-bold text-orange-300 hover:text-orange-200">
                Về màn đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
