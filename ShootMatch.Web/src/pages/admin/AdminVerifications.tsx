import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpDown, BadgeCheck, RefreshCw, Search } from "lucide-react";
import { api } from "../../lib/api";
import {
  compareDate,
  compareText,
  formatDateTime,
  getVerificationTone,
  includesKeyword,
  normalizeVerificationStatus,
  type SortDirection,
} from "./adminData";
import type { AdminPhotographer, AdminVerificationRequest } from "./adminData";

function normalizeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

type RequestSortField = "createdAt" | "status" | "documentType";

const requestFilterOptions = ["All", "Pending", "Verified", "Rejected", "Unverified"] as const;
const requestSortOptions: Array<{ label: string; value: RequestSortField }> = [
  { label: "Ngày gửi", value: "createdAt" },
  { label: "Trạng thái", value: "status" },
  { label: "Loại giấy tờ", value: "documentType" },
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

export default function AdminVerifications() {
  const [verificationRequests, setVerificationRequests] = useState<AdminVerificationRequest[]>([]);
  const [photographers, setPhotographers] = useState<AdminPhotographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [requestFilter, setRequestFilter] = useState<(typeof requestFilterOptions)[number]>("All");
  const [requestSortField, setRequestSortField] = useState<RequestSortField>("createdAt");
  const [requestSortDirection, setRequestSortDirection] = useState<SortDirection>("desc");
  const [error, setError] = useState<string | null>(null);

  const loadData = async (options?: { showRefreshing?: boolean }) => {
    try {
      if (options?.showRefreshing) {
        setError(null);
        setRefreshing(true);
      }
      const [verificationResponse, photographersResponse] = await Promise.all([
        api.get("/admin/verification-requests"),
        api.get("/admin/photographers"),
      ]);

      setError(null);
      setVerificationRequests(normalizeList<AdminVerificationRequest>(verificationResponse.data));
      setPhotographers(normalizeList<AdminPhotographer>(photographersResponse.data));
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được dữ liệu xác minh. Hãy kiểm tra API hoặc token admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredRequests = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return [...verificationRequests]
      .filter((request) => {
        if (requestFilter !== "All" && normalizeVerificationStatus(request.status) !== requestFilter) return false;

        return includesKeyword([request.documentType, request.photographerId, request.status, request.id], keyword);
      })
      .sort((left, right) => {
        switch (requestSortField) {
          case "status":
            return compareText(
              normalizeVerificationStatus(left.status),
              normalizeVerificationStatus(right.status),
              requestSortDirection,
            );
          case "documentType":
            return compareText(left.documentType, requestSortDirection);
          case "createdAt":
          default:
            return compareDate(left.createdAt, right.createdAt, requestSortDirection);
        }
      });
  }, [verificationRequests, query, requestFilter, requestSortDirection, requestSortField]);

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

  const pendingCount = verificationRequests.filter((r) => normalizeVerificationStatus(r.status) === "Pending").length;

  const cards = [
    { title: "Tổng Yêu Cầu", value: verificationRequests.length, icon: BadgeCheck, color: "text-[#e65a28]", bg: "bg-[#e65a28]/10" },
    { title: "Chờ Phê Duyệt", value: pendingCount, icon: BadgeCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#e65a28] font-bold">Quản Lý Xác Minh</p>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-wider text-[#1c1917] mt-2 drop-shadow-sm">
            YÊU CẦU XÁC MINH
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

      <div className="grid grid-cols-2 md:grid-cols-2 gap-6 py-6 border-y border-gray-200/50">
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
            <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917]">
              Yêu cầu xác minh danh tính
            </h2>
            <p className="text-sm text-slate-500 mt-1">Duyệt trực tiếp từ request thực tế của photographer.</p>
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="relative w-72 max-w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm yêu cầu..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#e65a28]"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
            {requestFilterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setRequestFilter(filter)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  requestFilter === filter
                    ? "border-[#e65a28] bg-[#e65a28] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {filter}
              </button>
            ))}
            <select
              value={requestSortField}
              onChange={(event) => setRequestSortField(event.target.value as RequestSortField)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#e65a28]"
            >
              {requestSortOptions.map((option) => (
                <option key={`${option.value}-${option.label}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setRequestSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowUpDown size={14} />
              {requestSortDirection === "asc" ? "Tăng dần" : "Giảm dần"}
            </button>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
          {filteredRequests.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500">Không có request chờ duyệt.</div>
          ) : (
            filteredRequests.map((request) => {
              const photographer = photographers.find((item) => item.id === request.photographerId);
              return (
                <div key={request.id} className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {photographer?.displayName ?? request.photographerId}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">{request.documentType}</div>
                      <div className="text-xs text-slate-500">Gửi lúc: {formatDateTime(request.createdAt)}</div>
                    </div>
                    <Badge className={getVerificationTone(request.status)}>{request.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={request.documentImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Xem giấy tờ
                    </a>
                    <a
                      href={request.selfieUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Xem selfie
                    </a>
                    {normalizeVerificationStatus(request.status) === "Pending" && (
                      <button
                        onClick={() => void handleApproveVerification(request.photographerId)}
                        disabled={busyId === request.photographerId}
                        className="rounded-lg bg-[#e65a28] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cf4028] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === request.photographerId ? "Đang duyệt..." : "Duyệt xác minh"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
