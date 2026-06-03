import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore";

type VerificationRequest = {
  id: string;
  photographerId: string;
  documentType: string;
  documentImageUrl: string;
  selfieUrl: string;
  status: string;
  createdAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async (showRefreshing = false) => {
    try {
      setError(null);
      if (showRefreshing) setRefreshing(true);
      const response = await api.get("/staff/verification-requests");
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được danh sách photographer chờ duyệt.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleApprove = async (photographerId: string) => {
    try {
      setBusyId(photographerId);
      await api.post(`/staff/photographers/${photographerId}/verify`);
      await load(true);
    } catch (approveError) {
      console.error(approveError);
      setError("Không thể duyệt photographer lúc này.");
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/auth/staff");
  };

  const filtered = items.filter((item) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return [item.photographerId, item.documentType, item.status, item.id].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(keyword),
    );
  });

  if (loading) {
    return <div className="p-8 text-slate-500">Đang tải yêu cầu photographer...</div>;
  }

  return (
    <div className="space-y-6 p-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 font-semibold">Staff panel</p>
          <h1 className="font-sans text-3xl font-bold text-gray-800">Duyệt photographer</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Làm mới
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Yêu cầu chờ duyệt</h2>
            <p className="text-sm text-slate-500">
              Staff sẽ duyệt photographer sau khi photographer nộp hồ sơ xác minh.
            </p>
          </div>
          <div className="relative w-80 max-w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo photographer, giấy tờ, trạng thái..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#e65a28]"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500">Không có yêu cầu chờ duyệt.</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Photographer {item.photographerId}</h3>
                  <p className="text-sm text-slate-500">
                    {item.documentType} • {formatDate(item.createdAt)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Trạng thái: {item.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={item.documentImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Giấy tờ
                  </a>
                  <a
                    href={item.selfieUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Selfie
                  </a>
                  <button
                    onClick={() => void handleApprove(item.photographerId)}
                    disabled={busyId === item.photographerId}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#e65a28] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} />
                    {busyId === item.photographerId ? "Đang duyệt..." : "Duyệt photographer"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
