import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../lib/api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAdminToken = useAuthStore((state) => state.setAdminToken);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/admin/auth/login", { username, password });
      setAdminToken(res.data.accessToken, res.data.refreshToken);
      navigate("/admin/dashboard");
    } catch {
      setError("THÔNG TIN ĐĂNG NHẬP KHÔNG CHÍNH XÁC.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2eb] flex flex-col lg:flex-row relative overflow-hidden select-none">
      
      {/* LEFT SIDE: Photography Image Background (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative border-r-8 border-[#1c1917]">
        {/* Stunning High-Contrast Camera Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center grayscale contrast-125 brightness-75 hover:grayscale-0 hover:contrast-100 transition-all duration-700"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1600&auto=format&fit=crop')" }}
        ></div>
        
        {/* Dark overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/90 via-[#1c1917]/20 to-transparent"></div>

        <div className="relative z-10 p-16 flex flex-col justify-between w-full h-full">
          {/* Logo / Header */}
          <div className="flex items-center gap-3 text-white">
            <div className="px-4 py-2 bg-[#e65a28] border-2 border-white text-white font-display text-xl tracking-widest shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
              S.M.
            </div>
            <span className="font-display text-2xl tracking-widest text-white shadow-black drop-shadow-md">SHOOTMATCH</span>
          </div>

          {/* Massive Abstract Typography over image */}
          <div className="my-auto">
            <h1 className="font-display text-[90px] leading-none text-white tracking-tighter select-none drop-shadow-xl">
              SYSTEM<br />
              <span className="text-[#e65a28] bg-white/10 backdrop-blur-sm px-2">CONTROL</span><br />
              PANEL.
            </h1>
            <p className="mt-6 text-white/80 font-mono text-sm max-w-sm tracking-wide leading-relaxed bg-[#1c1917]/60 p-4 border-l-4 border-[#e65a28]">
              [ SECURE ACCESS FOR AUTHORIZED PERSONNEL ONLY. ALL ACTIONS ARE LOGGED AND AUDITED TO ENSURE PLATFORM INTEGRITY. ]
            </p>
          </div>

          {/* Footer info */}
          <div className="text-white/60 font-mono text-xs font-bold drop-shadow-md">
            V1.0.0 // INTERNAL CONSOLE // PHOTOGRAPHY NETWORK
          </div>
        </div>
      </div>

      {/* RIGHT SIDE / MAIN FORM */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative">
        {/* Giant Watermark Text in Background */}
        <div className="absolute right-[-100px] bottom-[-50px] font-display text-[220px] text-[#1c1917]/5 leading-none pointer-events-none select-none tracking-widest">
          ADMIN
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Main Card (Neo-Brutalist Style) */}
          <div className="bg-white border-4 border-[#1c1917] p-8 lg:p-10 rounded-2xl shadow-[10px_10px_0_0_#1c1917] hover:shadow-[14px_14px_0_0_#e65a28] transition-all duration-300">
            
            <div className="mb-8">
              <div className="inline-block px-3 py-1 bg-[#1c1917] text-[#f5f2eb] text-xs font-mono rounded-none border border-[#1c1917] mb-4 font-bold tracking-widest">
                SECURITY PROTOCOL
              </div>
              <h2 className="text-4xl font-display text-[#1c1917] tracking-tight uppercase">ĐĂNG NHẬP</h2>
              <p className="text-sm text-[#1c1917]/50 font-medium">Nhập thông tin quản trị viên để tiếp tục</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-xs font-mono text-red-700 uppercase tracking-wider font-bold">
                !! {error} !!
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-2">
                  Tên tài khoản //
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-4 bg-white border-2 border-[#1c1917] rounded-xl text-[#1c1917] font-medium placeholder-[#1c1917]/30 focus:outline-none focus:bg-[#fbf9f6] focus:border-[#e65a28] transition-all"
                    placeholder="ADMIN USERNAME"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1c1917] uppercase tracking-wider mb-2">
                  Mật khẩu bảo mật //
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white border-2 border-[#1c1917] rounded-xl text-[#1c1917] font-medium placeholder-[#1c1917]/30 focus:outline-none focus:bg-[#fbf9f6] focus:border-[#e65a28] transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#e65a28] text-white border-2 border-[#1c1917] py-4 rounded-xl font-display text-lg tracking-wider uppercase shadow-[4px_4px_0_0_#1c1917] hover:shadow-[6px_6px_0_0_#1c1917] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {loading ? "AUTHENTICATING..." : "ACCESS CONTROL"}
              </button>
            </form>
          </div>
          
          <div className="mt-8 text-center text-xs text-[#1c1917]/40 font-mono flex items-center justify-center gap-2 font-bold">
            <span>&copy; {new Date().getFullYear()} SHOOTMATCH</span>
            <span>|</span>
            <span>SECURED BY SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
