import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpDown, Camera, Pencil, RefreshCw, Search } from "lucide-react";
import { api } from "../../lib/api";
import {
  compareDate,
  compareNumber,
  compareText,
  formatDateOnly,
  getVerificationTone,
  includesKeyword,
  normalizeVerificationStatus,
  type SortDirection,
} from "./adminData";
import type { AdminPhotographer, AdminVerificationRequest } from "./adminData";
import EditUserModal, { type EditUserTarget } from "./EditUserModal";

function normalizeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

type PhotographerSortField = "createdAt" | "rating" | "name" | "updatedAt";

const photographerFilterOptions = ["All", "Verified", "Pending", "Rejected", "Premium", "Available"] as const;
const photographerSortOptions: Array<{ label: string; value: PhotographerSortField }> = [
  { label: "Ngày tạo", value: "createdAt" },
  { label: "Rating cao", value: "rating" },
  { label: "Tên A-Z", value: "name" },
  { label: "Cập nhật gần đây", value: "updatedAt" },
];

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

export default function AdminPhotographers() {
  const [photographers, setPhotographers] = useState<AdminPhotographer[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<AdminVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<EditUserTarget | null>(null);
  const [query, setQuery] = useState("");
  const [photographerFilter, setPhotographerFilter] = useState<(typeof photographerFilterOptions)[number]>("All");
  const [photographerSortField, setPhotographerSortField] = useState<PhotographerSortField>("createdAt");
  const [photographerSortDirection, setPhotographerSortDirection] = useState<SortDirection>("desc");
  const [error, setError] = useState<string | null>(null);

  const loadData = async (options?: { showRefreshing?: boolean }) => {
    try {
      if (options?.showRefreshing) {
        setError(null);
        setRefreshing(true);
      }
      const [photographersResponse, verificationResponse] = await Promise.all([
        api.get("/admin/photographers"),
        api.get("/admin/verification-requests"),
      ]);

      setError(null);
      setPhotographers(normalizeList<AdminPhotographer>(photographersResponse.data));
      setVerificationRequests(normalizeList<AdminVerificationRequest>(verificationResponse.data));
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được dữ liệu nhiếp ảnh gia. Hãy kiểm tra API hoặc token admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const verificationRequestIds = useMemo(
    () => new Set(verificationRequests.map((request) => request.photographerId)),
    [verificationRequests],
  );

  const filteredPhotographers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return [...photographers]
      .filter((photographer) => {
        const verificationStatus = normalizeVerificationStatus(photographer.verificationStatus);

        if (photographerFilter === "Verified" && verificationStatus !== "Verified") return false;
        if (photographerFilter === "Pending" && verificationStatus !== "Pending") return false;
        if (photographerFilter === "Rejected" && verificationStatus !== "Rejected") return false;
        if (photographerFilter === "Premium" && !photographer.isPremium) return false;
        if (photographerFilter === "Available" && !photographer.isAvailable) return false;

        return includesKeyword(
          [photographer.displayName, photographer.email, photographer.phone, photographer.region, photographer.id],
          keyword,
        );
      })
      .sort((left, right) => {
        switch (photographerSortField) {
          case "rating":
            return compareNumber(left.rating ?? 0, right.rating ?? 0, photographerSortDirection);
          case "name":
            return compareText(left.displayName, right.displayName, photographerSortDirection);
          case "updatedAt":
            return compareDate(left.updatedAt, right.updatedAt, photographerSortDirection);
          case "createdAt":
          default:
            return compareDate(left.createdAt, right.createdAt, photographerSortDirection);
        }
      });
  }, [photographerFilter, photographerSortDirection, photographerSortField, photographers, query]);

  const premiumPhotographers = photographers.filter((photographer) => photographer.isPremium).length;
  const verifiedPhotographers = photographers.filter(
    (photographer) => normalizeVerificationStatus(photographer.verificationStatus) === "Verified",
  ).length;

  const handleApproveVerification = async (photographerId: string) => {
    try {
      setBusyId(photographerId);
      await api.post(`/admin/photographers/${photographerId}/verify`);
      await loadData();
    } catch (actionError) {
      console.error(actionError);
      setError("Không thể duyệt xác minh lúc này.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokePremium = async (photographerId: string) => {
    try {
      setBusyId(photographerId);
      await api.post(`/admin/photographers/${photographerId}/revoke-premium`);
      await loadData();
    } catch (actionError) {
      console.error(actionError);
      setError("Không thể thu hồi premium lúc này.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <div className="h-10 w-72 rounded-full bg-[#1c1917]/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-white/50 shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Tổng Thợ Ảnh", value: photographers.length, icon: Camera, color: "text-[#e65a28]", bg: "bg-[#e65a28]/10" },
    { title: "Thợ Premium", value: premiumPhotographers, icon: Camera, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Đã Xác Minh", value: verifiedPhotographers, icon: Camera, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#e65a28] font-bold">Quản Lý Người Dùng</p>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-wider text-[#1c1917] mt-2 drop-shadow-sm">
            NHIẾP ẢNH GIA
          </h1>
        </div>
        <button
          onClick={() => void loadData({ showRefreshing: true })}
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-gray-200/50">
        {cards.map((card) => (
          <div
            key={card.title}
            className="flex flex-col gap-2 relative group"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                <card.icon size={14} strokeWidth={3} />
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{card.title}</div>
            </div>
            <div className="text-2xl font-display tracking-wide text-gray-800">{card.value}</div>
            
            <div className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gray-200/50 group-last:hidden" />
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
        <div className="flex flex-col gap-4 px-8 py-7 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917]">Nhiếp ảnh gia</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý trạng thái premium, availability và verification.</p>
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="relative w-72 max-w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm thợ ảnh, SĐT, email..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#e65a28]"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {photographerFilterOptions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPhotographerFilter(filter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    photographerFilter === filter
                      ? "border-[#e65a28] bg-[#e65a28] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={photographerSortField}
                onChange={(event) => setPhotographerSortField(event.target.value as PhotographerSortField)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#e65a28]"
              >
                {photographerSortOptions.map((option) => (
                  <option key={`${option.value}-${option.label}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setPhotographerSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowUpDown size={14} />
                {photographerSortDirection === "asc" ? "Tăng dần" : "Giảm dần"}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-gray-400 uppercase tracking-widest text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Nhiếp ảnh gia</th>
                <th className="px-6 py-4 text-left font-semibold">Khu vực</th>
                <th className="px-6 py-4 text-left font-semibold">Rating</th>
                <th className="px-6 py-4 text-left font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-left font-semibold">Premium</th>
                <th className="px-6 py-4 text-left font-semibold">Đăng ký</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {filteredPhotographers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy nhiếp ảnh gia phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPhotographers.map((photographer) => {
                  const verificationStatus = normalizeVerificationStatus(photographer.verificationStatus);
                  const canApprove = verificationStatus !== "Verified" && verificationRequestIds.has(photographer.id);
                  return (
                    <tr key={photographer.id} className="bg-white hover:shadow-md transition-shadow rounded-2xl group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{photographer.displayName}</div>
                        <div className="text-xs text-slate-500 mt-1">{photographer.email}</div>
                        <div className="text-xs text-slate-500">{photographer.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{photographer.region || "-"}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{photographer.rating.toFixed(1)}</td>
                      <td className="px-6 py-4">
                        <Badge className={getVerificationTone(verificationStatus)}>{verificationStatus}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            photographer.isPremium
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }
                        >
                          {photographer.isPremium ? "Premium" : "Standard"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDateOnly(photographer.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canApprove && (
                            <button
                              onClick={() => void handleApproveVerification(photographer.id)}
                              disabled={busyId === photographer.id}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyId === photographer.id ? "Đang duyệt" : "Xác minh"}
                            </button>
                          )}
                          <button
                            onClick={() => setEditingTarget({ kind: "photographer", user: photographer })}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Pencil size={14} />
                              Sửa
                            </span>
                          </button>
                          {photographer.isPremium && (
                            <button
                              onClick={() => void handleRevokePremium(photographer.id)}
                              disabled={busyId === photographer.id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyId === photographer.id ? "Đang xử lý" : "Thu hồi premium"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserModal
        open={editingTarget !== null}
        target={editingTarget}
        onClose={() => setEditingTarget(null)}
        onSaved={async () => {
          await loadData({ showRefreshing: true });
        }}
      />
    </div>
  );
}
