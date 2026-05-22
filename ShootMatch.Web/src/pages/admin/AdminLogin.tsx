import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
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
      setAdminToken(res.data.accessToken);
      navigate("/admin/dashboard");
    } catch {
      setError("Đăng nhập thất bại. Kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#f5f2eb]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#e65a28]/20 relative">
        <div className="flex justify-center mb-6">
          <div className="bg-[#e65a28] text-white p-4 rounded-full shadow-lg shadow-[#e65a28]/40">
            <Camera size={36} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Quản trị viên</h2>
        <p className="text-center text-gray-500 mb-8">ShootMatch System Control Panel</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e65a28] focus:border-[#e65a28] outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="Nhập tên đăng nhập (admin)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#e65a28] focus:border-[#e65a28] outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e65a28] hover:bg-[#cc4f23] text-white font-bold py-3.5 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-[#e65a28]/30 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Đang xác thực..." : "Đăng Nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
