import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { Camera, LayoutDashboard, Users, Calendar, LogOut, Upload, ShieldCheck, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const [usersMenuOpen, setUsersMenuOpen] = useState(location.pathname.startsWith("/admin/users"));

  const navItems = [
    { name: "Tổng quan", path: "/admin/dashboard", icon: LayoutDashboard },
    {
      name: "Người dùng",
      path: "/admin/users",
      icon: Users,
      subItems: [
        { name: "Khách hàng", path: "/admin/users/customers" },
        { name: "Nhiếp ảnh gia", path: "/admin/users/photographers" },
        { name: "Yêu cầu xác minh", path: "/admin/users/verifications" },
      ],
    },
    { name: "Duyệt staff", path: "/admin/staff", icon: ShieldCheck },
    { name: "Booking & Giao dịch", path: "/admin/bookings", icon: Calendar },
    { name: "Giao dịch Hội viên", path: "/admin/memberships", icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-[#f5f2eb]">
      {/* Sidebar - Collapsible Neo-Brutalist Style */}
      <aside className={`relative bg-[#1c1917] text-white flex flex-col z-20 border-r-4 border-[#1c1917] transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-68'}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-4 top-8 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-[#e65a28] text-white border-2 border-white shadow-[2px_2px_0_0_rgba(28,25,23,0.8)] hover:-translate-y-0.5 transition-transform"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`flex items-center gap-4 border-b-2 border-white/10 transition-all ${sidebarCollapsed ? 'p-3 justify-center' : 'p-8'}`}>
          <button
            type="button"
            onClick={handlePickAvatar}
            disabled={uploadingAvatar}
            className={`group relative flex items-center justify-center overflow-hidden bg-[#e65a28] border-2 border-white shadow-[4px_4px_0_0_rgba(255,255,255,0.8)] transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0 disabled:cursor-not-allowed disabled:opacity-70 ${sidebarCollapsed ? 'h-10 w-10 shadow-[2px_2px_0_0_rgba(255,255,255,0.8)]' : 'h-14 w-14'}`}
            title="Đổi avatar admin"
          >
            {adminAvatarUrl ? (
              <img src={adminAvatarUrl} alt="Admin avatar" className="h-full w-full object-cover grayscale contrast-125" />
            ) : (
              <Camera size={sidebarCollapsed ? 18 : 26} />
            )}
            <span className="absolute inset-0 grid place-items-center bg-[#1c1917]/50 text-white opacity-0 transition group-hover:opacity-100">
              <Upload size={sidebarCollapsed ? 14 : 18} />
            </span>
          </button>
          {!sidebarCollapsed && (
            <div className="animate-in fade-in duration-200">
              <div className="text-2xl font-display tracking-widest leading-none drop-shadow-md">SHOOTMATCH</div>
              <div className="text-[10px] text-white/50 mt-1 uppercase tracking-widest font-mono font-bold">
                ADMIN CONSOLE
              </div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        {avatarError && !sidebarCollapsed && (
          <div className="px-8 py-2 text-xs text-[#e65a28] font-bold uppercase border-b-2 border-[#e65a28]/20">{avatarError}</div>
        )}

        <nav className={`flex-1 space-y-4 py-6 transition-all ${sidebarCollapsed ? 'px-3' : 'px-6'}`}>
          {navItems.map((item) => {
            const hasSubItems = !!item.subItems;
            const active = location.pathname.startsWith(item.path);

            if (hasSubItems) {
              return (
                <div key={item.path} className="space-y-2">
                  <button
                    onClick={() => {
                      if (sidebarCollapsed) {
                        navigate(item.subItems![0].path);
                      } else {
                        setUsersMenuOpen(!usersMenuOpen);
                      }
                    }}
                    className={`w-full flex items-center justify-between transition-all font-bold uppercase tracking-wider text-sm border-2 ${
                      sidebarCollapsed ? 'p-3.5 justify-center' : 'px-4 py-3.5'
                    } ${
                      active
                        ? "bg-[#e65a28] text-white border-white shadow-[4px_4px_0_0_#ffffff] -translate-y-0.5 -translate-x-0.5"
                        : "bg-transparent text-white/70 border-transparent hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <item.icon size={20} className={active ? "text-white" : "text-white/50"} strokeWidth={active ? 2.5 : 2} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="text-[10px] transition-transform duration-200" style={{ transform: usersMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        ▶
                      </span>
                    )}
                  </button>
                  {usersMenuOpen && !sidebarCollapsed && (
                    <div className="pl-4 space-y-2 border-l-2 border-[#e65a28]/35 ml-6 animate-in slide-in-from-top-2 duration-200">
                      {item.subItems?.map((sub) => {
                        const subActive = location.pathname === sub.path;
                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            className={`block px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                              subActive
                                ? "text-[#e65a28]"
                                : "text-white/60 hover:text-white"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 transition-all font-bold uppercase tracking-wider text-sm border-2 ${
                  sidebarCollapsed ? 'p-3.5 justify-center' : 'px-4 py-3.5'
                } ${
                  active
                    ? "bg-[#e65a28] text-white border-white shadow-[4px_4px_0_0_#ffffff] -translate-y-0.5 -translate-x-0.5"
                    : "bg-transparent text-white/70 border-transparent hover:border-white/20 hover:text-white"
                }`}
              >
                <item.icon size={20} className={active ? "text-white" : "text-white/50"} strokeWidth={active ? 2.5 : 2} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t-2 border-white/10 transition-all ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-3 w-full bg-white text-[#1c1917] border-2 border-white hover:bg-[#e65a28] hover:text-white hover:border-[#e65a28] transition-colors font-bold uppercase tracking-widest text-sm ${
              sidebarCollapsed ? 'p-2.5' : 'px-4 py-3'
            }`}
            title="Đăng xuất"
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>THOÁT</span>}
          </button>
        </div>
      </aside>

      {/* Main Content - Warm Beige Background */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f5f2eb] relative">
        <Outlet />
      </main>
    </div>
  );
}
