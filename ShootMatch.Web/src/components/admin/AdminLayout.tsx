import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { Camera, LayoutDashboard, Users, Calendar, LogOut, Upload } from "lucide-react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore";

export default function AdminLayout() {
  const session = useAuthStore((state) => state.session);
  const role = useAuthStore((state) => state.role);
  const adminAvatarUrl = useAuthStore((state) => state.adminAvatarUrl);
  const setAdminAvatarUrl = useAuthStore((state) => state.setAdminAvatarUrl);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || role !== "admin") {
      navigate("/admin/login");
    }
  }, [role, session, navigate]);

  if (!session || role !== "admin") return null;

  const handleLogout = () => {
    clearSession();
    navigate("/admin/login");
  };

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setAvatarError(null);
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append("File", file);

      const response = await api.post("/admin/profile/avatar/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (typeof response.data?.photoUrl === "string") {
        setAdminAvatarUrl(response.data.photoUrl);
      } else {
        setAvatarError("Không nhận được đường dẫn ảnh từ máy chủ.");
      }
    } catch (uploadError) {
      console.error(uploadError);
      setAvatarError("Không thể đổi avatar lúc này.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const navItems = [
    { name: "Tổng quan", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Người dùng", path: "/admin/users", icon: Users },
    { name: "Booking & Giao dịch", path: "/admin/bookings", icon: Calendar },
  ];

  return (
    <div className="flex h-screen bg-[#f5f2eb]">
      {/* Sidebar */}
      <aside className="w-68 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 flex items-center gap-4">
          <button
            type="button"
            onClick={handlePickAvatar}
            disabled={uploadingAvatar}
            className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-[#e65a28] shadow-lg shadow-[#e65a28]/40 ring-1 ring-white/10 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            title="Đổi avatar admin"
          >
            {adminAvatarUrl ? (
              <img src={adminAvatarUrl} alt="Admin avatar" className="h-full w-full object-cover" />
            ) : (
              <Camera size={26} />
            )}
            <span className="absolute inset-0 grid place-items-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/35 group-hover:opacity-100">
              <Upload size={18} />
            </span>
          </button>
          <div>
            <div className="text-xl font-bold tracking-wider leading-none">ShootMatch</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Admin Panel • Nhấn icon để đổi avatar
            </div>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        {avatarError && <div className="px-8 pb-4 text-xs text-rose-300">{avatarError}</div>}

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all ${
                  active
                    ? "bg-[#e65a28] text-white shadow-lg shadow-[#e65a28]/25 font-semibold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white font-medium"
                }`}
              >
                <item.icon size={20} className={active ? "text-white" : "text-slate-400"} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 relative">
        <Outlet />
      </main>
    </div>
  );
}
