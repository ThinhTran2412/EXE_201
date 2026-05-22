import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpDown, BadgeCheck, Camera, Clock3, Pencil, RefreshCw, Search, Users } from "lucide-react";
import { api } from "../../lib/api";
import {
  compareDate,
  compareNumber,
  compareText,
  formatDateOnly,
  formatDateTime,
  getVerificationTone,
  includesKeyword,
  normalizeVerificationStatus,
  type SortDirection,
} from "./adminData";
import type { AdminCustomer, AdminPhotographer, AdminVerificationRequest } from "./adminData";
import EditUserModal, { type EditUserTarget } from "./EditUserModal";

type AdminUsersPayload = {
  customers: AdminCustomer[];
  photographers: AdminPhotographer[];
  verificationRequests: AdminVerificationRequest[];
};

function normalizeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

type CustomerSortField = "createdAt" | "lastSeenAt" | "name";
type PhotographerSortField = "createdAt" | "rating" | "name" | "updatedAt";
type RequestSortField = "createdAt" | "status" | "documentType";

const customerFilterOptions = ["All", "Verified", "Active", "Inactive"] as const;
const customerSortOptions: Array<{ label: string; value: CustomerSortField }> = [
  { label: "Ngày tạo", value: "createdAt" },
  { label: "Tên A-Z", value: "name" },
  { label: "Hoạt động gần đây", value: "lastSeenAt" },
];

const photographerFilterOptions = ["All", "Verified", "Pending", "Rejected", "Premium", "Available"] as const;
const photographerSortOptions: Array<{ label: string; value: PhotographerSortField }> = [
  { label: "Ngày tạo", value: "createdAt" },
  { label: "Rating cao", value: "rating" },
  { label: "Tên A-Z", value: "name" },
  { label: "Cập nhật gần đây", value: "updatedAt" },
];

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

export default function AdminUsers() {
  const [payload, setPayload] = useState<AdminUsersPayload>({
    customers: [],
    photographers: [],
    verificationRequests: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<EditUserTarget | null>(null);
  const [query, setQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState<(typeof customerFilterOptions)[number]>("All");
  const [customerSortField, setCustomerSortField] = useState<CustomerSortField>("createdAt");
  const [customerSortDirection, setCustomerSortDirection] = useState<SortDirection>("desc");
  const [photographerFilter, setPhotographerFilter] = useState<(typeof photographerFilterOptions)[number]>("All");
  const [photographerSortField, setPhotographerSortField] = useState<PhotographerSortField>("createdAt");
  const [photographerSortDirection, setPhotographerSortDirection] = useState<SortDirection>("desc");
  const [requestFilter, setRequestFilter] = useState<(typeof requestFilterOptions)[number]>("All");
  const [requestSortField, setRequestSortField] = useState<RequestSortField>("createdAt");
  const [requestSortDirection, setRequestSortDirection] = useState<SortDirection>("desc");
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async (options?: { showRefreshing?: boolean }) => {
    try {
      if (options?.showRefreshing) {
        setError(null);
        setRefreshing(true);
      }
      const [customersResponse, photographersResponse, verificationResponse] = await Promise.all([
        api.get("/admin/customers"),
        api.get("/admin/photographers"),
        api.get("/admin/verification-requests"),
      ]);

      setError(null);
      setPayload({
        customers: normalizeList<AdminCustomer>(customersResponse.data),
        photographers: normalizeList<AdminPhotographer>(photographersResponse.data),
        verificationRequests: normalizeList<AdminVerificationRequest>(verificationResponse.data),
      });
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được dữ liệu người dùng. Hãy kiểm tra API hoặc token admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [customersResponse, photographersResponse, verificationResponse] = await Promise.all([
          api.get("/admin/customers"),
          api.get("/admin/photographers"),
          api.get("/admin/verification-requests"),
        ]);

        if (active) {
          setError(null);
          setPayload({
            customers: normalizeList<AdminCustomer>(customersResponse.data),
            photographers: normalizeList<AdminPhotographer>(photographersResponse.data),
            verificationRequests: normalizeList<AdminVerificationRequest>(verificationResponse.data),
          });
        }
      } catch (loadError) {
        if (active) {
          console.error(loadError);
          setError("Không tải được dữ liệu người dùng. Hãy kiểm tra API hoặc token admin.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const verificationRequestIds = useMemo(
    () => new Set(payload.verificationRequests.map((request) => request.photographerId)),
    [payload.verificationRequests],
  );

  const filteredCustomers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return [...payload.customers]
      .filter((customer) => {
        if (customerFilter === "Verified" && !customer.isVerified) return false;
        if (customerFilter === "Active" && !customer.isActive) return false;
        if (customerFilter === "Inactive" && customer.isActive) return false;

        return includesKeyword(
          [customer.displayName, customer.email, customer.phone, customer.region, customer.id],
          keyword,
        );
      })
      .sort((left, right) => {
        switch (customerSortField) {
          case "lastSeenAt":
            return compareDate(
              left.lastSeenAt ?? left.createdAt,
              right.lastSeenAt ?? right.createdAt,
              customerSortDirection,
            );
          case "name":
            return compareText(left.displayName, right.displayName, customerSortDirection);
          case "createdAt":
          default:
            return compareDate(left.createdAt, right.createdAt, customerSortDirection);
        }
      });
  }, [customerFilter, customerSortDirection, customerSortField, payload.customers, query]);

  const filteredPhotographers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return [...payload.photographers]
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
  }, [photographerFilter, photographerSortDirection, photographerSortField, payload.photographers, query]);

  const filteredRequests = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return [...payload.verificationRequests]
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
            return compareText(left.documentType, right.documentType, requestSortDirection);
          case "createdAt":
          default:
            return compareDate(left.createdAt, right.createdAt, requestSortDirection);
        }
      });
  }, [payload.verificationRequests, query, requestFilter, requestSortDirection, requestSortField]);

  const verifiedCustomers = payload.customers.filter((customer) => customer.isVerified).length;
  const activeCustomers = payload.customers.filter((customer) => customer.isActive).length;
  const premiumPhotographers = payload.photographers.filter((photographer) => photographer.isPremium).length;
  const verifiedPhotographers = payload.photographers.filter(
    (photographer) => normalizeVerificationStatus(photographer.verificationStatus) === "Verified",
  ).length;

  const handleApproveVerification = async (photographerId: string) => {
    try {
      setBusyId(photographerId);
      await api.post(`/admin/photographers/${photographerId}/verify`);
      await loadUsers();
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
      await loadUsers();
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
        <div className="h-8 w-64 rounded-lg bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Khách hàng", value: payload.customers.length, icon: Users, color: "bg-blue-500" },
    { title: "Khách hàng đã xác minh", value: verifiedCustomers, icon: BadgeCheck, color: "bg-emerald-500" },
    { title: "Nhiếp ảnh gia", value: payload.photographers.length, icon: Camera, color: "bg-indigo-500" },
    { title: "Xác minh chờ duyệt", value: payload.verificationRequests.length, icon: Clock3, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 font-semibold">Admin users</p>
          <h1 className="font-sans text-3xl font-bold leading-[1.15] tracking-normal text-gray-800">
            Quản lý người dùng thật
          </h1>
        </div>
        <button
          onClick={() => void loadUsers({ showRefreshing: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex items-center gap-5"
          >
            <div className={`p-4 rounded-xl text-white ${card.color} shadow-lg`}>
              <card.icon size={26} />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{card.title}</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800">Khách hàng</h2>
              <p className="text-sm text-slate-500 mt-1">
                Tổng: {payload.customers.length} • Đang hoạt động: {activeCustomers}
              </p>
            </div>
            <div className="flex flex-col gap-3 items-end">
              <div className="relative w-72 max-w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm khách hàng, SĐT, email..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#e65a28]"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {customerFilterOptions.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCustomerFilter(filter)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      customerFilter === filter
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
                  value={customerSortField}
                  onChange={(event) => setCustomerSortField(event.target.value as CustomerSortField)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#e65a28]"
                >
                  {customerSortOptions.map((option) => (
                    <option key={`${option.value}-${option.label}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setCustomerSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowUpDown size={14} />
                  {customerSortDirection === "asc" ? "Tăng dần" : "Giảm dần"}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Người dùng</th>
                  <th className="px-6 py-4 text-left font-semibold">Khu vực</th>
                  <th className="px-6 py-4 text-left font-semibold">Xác minh</th>
                  <th className="px-6 py-4 text-left font-semibold">Hoạt động</th>
                  <th className="px-6 py-4 text-left font-semibold">Cập nhật lần cuối</th>
                  <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Không tìm thấy khách hàng phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{customer.displayName}</div>
                        <div className="text-xs text-slate-500 mt-1">{customer.email}</div>
                        <div className="text-xs text-slate-500">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{customer.region || "-"}</td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            customer.isVerified
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {customer.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            customer.isActive
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }
                        >
                          {customer.isActive ? "Hoạt động" : "Tạm khóa"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDateTime(customer.lastSeenAt ?? customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingTarget({ kind: "customer", user: customer })}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col gap-4 px-6 py-5 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800">
                Xác minh chờ duyệt
              </h2>
              <p className="text-sm text-slate-500 mt-1">Duyệt trực tiếp từ request thực tế của photographer.</p>
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
          <div className="divide-y divide-gray-100">
            {filteredRequests.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500">Không có request chờ duyệt.</div>
            ) : (
              filteredRequests.map((request) => {
                const photographer = payload.photographers.find((item) => item.id === request.photographerId);
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
                      <button
                        onClick={() => void handleApproveVerification(request.photographerId)}
                        disabled={busyId === request.photographerId}
                        className="rounded-lg bg-[#e65a28] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cf4028] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === request.photographerId ? "Đang duyệt..." : "Duyệt xác minh"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 px-6 py-5 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800">Nhiếp ảnh gia</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý trạng thái premium, availability và verification.</p>
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="text-sm text-slate-500">
              Premium: {premiumPhotographers} • Verified: {verifiedPhotographers}
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider text-xs">
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
            <tbody className="divide-y divide-gray-100 bg-white">
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
                    <tr key={photographer.id} className="hover:bg-slate-50/70 transition-colors">
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
          await loadUsers({ showRefreshing: true });
        }}
      />
    </div>
  );
}
