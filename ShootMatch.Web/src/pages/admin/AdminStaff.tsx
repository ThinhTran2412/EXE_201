import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";

type StaffAccount = {
  id: string;
  displayName: string;
  phone: string;
  email: string;
  role: string;
  approvalStatus: string;
  createdAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AdminStaff() {
  const [items, setItems] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async (showRefreshing = false) => {
    try {
      setError(null);
      if (showRefreshing) setRefreshing(true);
      const response = await api.get("/admin/staff");
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được danh sách staff.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleApprove = async (staffId: string) => {
    try {
      setBusyId(staffId);
      await api.post(`/admin/staff/${staffId}/approve`);
      await load(true);
    } catch (approveError) {
      console.error(approveError);
      setError("Không thể duyệt staff lúc này.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = items.filter((item) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return [item.displayName, item.email, item.phone, item.approvalStatus, item.id].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(keyword),
    );
  });

  if (loading) {
    return <div className="p-8 text-slate-500">Đang tải staff...</div>;
  }

  return (
    <div className="space-y-6 p-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 font-semibold">Admin staff</p>
          <h1 className="font-sans text-3xl font-bold text-gray-800">Duyệt tài khoản staff</h1>
        </div>
        <button
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Danh sách staff</h2>
            <p className="text-sm text-slate-500">Duyệt staff để họ có quyền vào luồng photographer.</p>
          </div>
          <div className="relative w-80 max-w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, email, trạng thái..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#e65a28]"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500">Không có staff nào.</div>
          ) : (
            filtered.map((staff) => (
              <div
                key={staff.id}
                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">{staff.displayName || staff.email}</h3>
                    <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                      {staff.approvalStatus}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {staff.email} • {staff.phone || "Chưa có số điện thoại"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Tạo lúc: {formatDate(staff.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {staff.approvalStatus === "Approved" ? (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                      <ShieldCheck size={16} /> Đã duyệt
                    </span>
                  ) : (
                    <button
                      onClick={() => void handleApprove(staff.id)}
                      disabled={busyId === staff.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#e65a28] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} />
                      {busyId === staff.id ? "Đang duyệt..." : "Duyệt staff"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
