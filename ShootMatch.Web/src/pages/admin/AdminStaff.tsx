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
    return <div className="p-8 text-gray-500 text-sm font-semibold uppercase tracking-widest animate-pulse">Đang tải staff...</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#e65a28] font-bold">Quản Lý Đội Ngũ</p>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-wider text-[#1c1917] mt-2 drop-shadow-sm">
            TÀI KHOẢN STAFF
          </h1>
        </div>
        <button
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.1)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} strokeWidth={3} />
          LÀM MỚI
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm font-medium text-rose-600 shadow-sm">{error}</div>
      )}

      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-8 py-7 border-b border-gray-100">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917]">Danh sách staff</h2>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Duyệt staff để họ có quyền vào luồng photographer</p>
          </div>
          <div className="relative w-80 max-w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, email, trạng thái..."
              className="w-full rounded-full border border-gray-200 bg-white/50 py-3 pl-11 pr-5 text-sm outline-none transition focus:border-[#e65a28] focus:bg-white focus:shadow-sm"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100/50 p-4">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 font-medium">Không có staff nào.</div>
          ) : (
            filtered.map((staff) => (
              <div
                key={staff.id}
                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between bg-transparent hover:bg-white hover:shadow-md transition-all rounded-2xl group"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-800">{staff.displayName || staff.email}</h3>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 group-hover:bg-slate-200 transition-colors">
                      {staff.approvalStatus}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                    {staff.email} • {staff.phone || "Chưa có số điện thoại"}
                  </p>
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mt-2">Tạo lúc: {formatDate(staff.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {staff.approvalStatus === "Approved" ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-600">
                      <ShieldCheck size={16} strokeWidth={2.5} /> Đã duyệt
                    </span>
                  ) : (
                    <button
                      onClick={() => void handleApprove(staff.id)}
                      disabled={busyId === staff.id}
                      className="inline-flex items-center gap-2 rounded-full bg-[#e65a28] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-[0_8px_30px_rgb(230,90,40,0.3)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} strokeWidth={2.5} />
                      {busyId === staff.id ? "ĐANG DUYỆT" : "DUYỆT STAFF"}
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
