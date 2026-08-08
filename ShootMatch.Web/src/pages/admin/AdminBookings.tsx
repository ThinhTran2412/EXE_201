import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpDown, CalendarCheck, Clock3, RefreshCw, Search, TrendingUp, Users } from "lucide-react";
import { api } from "../../lib/api";
import { downloadAdminReport } from "./adminExports.ts";
import {
  compareDate,
  compareNumber,
  compareText,
  formatCurrency,
  formatDateTime,
  getBookingStatusTone,
  includesKeyword,
  isWithinDateRange,
  normalizeBookingStatus,
  type DateRangePreset,
  type SortDirection,
} from "./adminData";
import type { AdminBooking, AdminCustomer, AdminPhotographer } from "./adminData";

type AdminBookingsPayload = {
  bookings: AdminBooking[];
  customers: AdminCustomer[];
  photographers: AdminPhotographer[];
};

function normalizeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

const statusFilters = ["All", "Pending", "Confirmed", "Completed", "Cancelled", "Disputed"] as const;
const dateRangeFilters: Array<{ label: string; value: DateRangePreset }> = [
  { label: "Tất cả", value: "all" },
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "90 ngày", value: "90d" },
];

const sortOptions: Array<{ label: string; value: BookingSortField }> = [
  { label: "Ngày tạo", value: "createdAt" },
  { label: "Lịch chụp", value: "scheduledAt" },
  { label: "Giá booking", value: "agreedPrice" },
  { label: "Phí nền tảng", value: "commission" },
  { label: "Trạng thái", value: "status" },
  { label: "Khách hàng", value: "customer" },
  { label: "Nhiếp ảnh gia", value: "photographer" },
];

type BookingSortField =
  | "createdAt"
  | "scheduledAt"
  | "agreedPrice"
  | "commission"
  | "status"
  | "customer"
  | "photographer";

export default function AdminBookings() {
  const [payload, setPayload] = useState<AdminBookingsPayload>({ bookings: [], customers: [], photographers: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangePreset>("30d");
  const [sortField, setSortField] = useState<BookingSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadBookings = async (options?: { showRefreshing?: boolean }) => {
    try {
      if (options?.showRefreshing) {
        setError(null);
        setRefreshing(true);
      }
      const [bookingsResponse, customersResponse, photographersResponse] = await Promise.all([
        api.get("/admin/bookings"),
        api.get("/admin/customers"),
        api.get("/admin/photographers"),
      ]);

      setError(null);
      setPayload({
        bookings: normalizeList<AdminBooking>(bookingsResponse.data),
        customers: normalizeList<AdminCustomer>(customersResponse.data),
        photographers: normalizeList<AdminPhotographer>(photographersResponse.data),
      });
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được dữ liệu booking. Hãy kiểm tra API hoặc token admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [bookingsResponse, customersResponse, photographersResponse] = await Promise.all([
          api.get("/admin/bookings"),
          api.get("/admin/customers"),
          api.get("/admin/photographers"),
        ]);

        if (active) {
          setError(null);
          setPayload({
            bookings: normalizeList<AdminBooking>(bookingsResponse.data),
            customers: normalizeList<AdminCustomer>(customersResponse.data),
            photographers: normalizeList<AdminPhotographer>(photographersResponse.data),
          });
        }
      } catch (loadError) {
        if (active) {
          console.error(loadError);
          setError("Không tải được dữ liệu booking. Hãy kiểm tra API hoặc token admin.");
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

  const exportBookingsReport = async (format: "pdf" | "excel") => {
    try {
      setError(null);
      setExportingFormat(format);
      const params = new URLSearchParams();
      params.set("statusFilter", statusFilter);
      params.set("dateRange", dateRangeFilter);
      params.set("search", query);

      const response = await api.get(`/admin/reports/bookings/${format}?${params.toString()}`, {
        responseType: "blob",
      });

      downloadAdminReport(response, `admin-bookings-report.${format === "excel" ? "xlsx" : "pdf"}`);
    } catch (exportError) {
      console.error(exportError);
      setError("Không xuất được báo cáo booking. Vui lòng thử lại.");
    } finally {
      setExportingFormat(null);
    }
  };

  const customerMap = useMemo(
    () => new Map(payload.customers.map((customer) => [customer.id, customer])),
    [payload.customers],
  );
  const photographerMap = useMemo(
    () => new Map(payload.photographers.map((photographer) => [photographer.id, photographer])),
    [payload.photographers],
  );

  const bookedCompletedRevenue = useMemo(
    () =>
      payload.bookings.reduce((sum, booking) => {
        return normalizeBookingStatus(booking.status) === "Completed" ? sum + (booking.commission ?? 0) : sum;
      }, 0),
    [payload.bookings],
  );

  const filteredBookings = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return [...payload.bookings]
      .filter((booking) => {
        const status = normalizeBookingStatus(booking.status);
        if (statusFilter !== "All" && status !== statusFilter) return false;

        if (!isWithinDateRange(booking.createdAt, dateRangeFilter)) {
          return false;
        }

        if (!keyword) return true;

        const customer = customerMap.get(booking.customerId);
        const photographer = photographerMap.get(booking.photographerId);
        return includesKeyword(
          [
            booking.id,
            booking.matchId,
            booking.customerId,
            booking.photographerId,
            customer?.displayName,
            customer?.email,
            customer?.phone,
            photographer?.displayName,
            photographer?.email,
            photographer?.phone,
            booking.cancellationReason,
            status,
          ],
          keyword,
        );
      })
      .sort((left, right) => {
        const leftCustomer = customerMap.get(left.customerId);
        const rightCustomer = customerMap.get(right.customerId);
        const leftPhotographer = photographerMap.get(left.photographerId);
        const rightPhotographer = photographerMap.get(right.photographerId);

        switch (sortField) {
          case "scheduledAt":
            return compareDate(left.scheduledAt, right.scheduledAt, sortDirection);
          case "agreedPrice":
            return compareNumber(left.agreedPrice ?? 0, right.agreedPrice ?? 0, sortDirection);
          case "commission":
            return compareNumber(left.commission ?? 0, right.commission ?? 0, sortDirection);
          case "status":
            return compareText(
              normalizeBookingStatus(left.status),
              normalizeBookingStatus(right.status),
              sortDirection,
            );
          case "customer":
            return compareText(
              leftCustomer?.displayName ?? left.customerId,
              rightCustomer?.displayName ?? right.customerId,
              sortDirection,
            );
          case "photographer":
            return compareText(
              leftPhotographer?.displayName ?? left.photographerId,
              rightPhotographer?.displayName ?? right.photographerId,
              sortDirection,
            );
          case "createdAt":
          default:
            return compareDate(left.createdAt, right.createdAt, sortDirection);
        }
      });
  }, [customerMap, dateRangeFilter, photographerMap, payload.bookings, query, sortDirection, sortField, statusFilter]);

  const stats = {
    totalBookings: payload.bookings.length,
    completedBookings: payload.bookings.filter((booking) => normalizeBookingStatus(booking.status) === "Completed")
      .length,
    cancelledBookings: payload.bookings.filter((booking) => normalizeBookingStatus(booking.status) === "Cancelled")
      .length,
    totalRevenue: bookedCompletedRevenue,
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
    { title: "Tổng Booking", value: stats.totalBookings, icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Hoàn Thành", value: stats.completedBookings, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Đã Hủy", value: stats.cancelledBookings, icon: Clock3, color: "text-rose-500", bg: "bg-rose-500/10" },
    {
      title: "Doanh Thu",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "text-[#e65a28]",
      bg: "bg-[#e65a28]/10"
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#e65a28] font-bold">Quản Lý Giao Dịch</p>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-wider text-[#1c1917] mt-2 drop-shadow-sm">
            BOOKINGS
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 self-start">
          <button
            onClick={() => void exportBookingsReport("pdf")}
            disabled={Boolean(exportingFormat) || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.1)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            Xuất PDF
          </button>
          <button
            onClick={() => void exportBookingsReport("excel")}
            disabled={Boolean(exportingFormat) || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.1)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            Xuất Excel
          </button>
          <button
            onClick={() => void loadBookings({ showRefreshing: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full bg-[#e65a28] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest shadow-[0_8px_30px_rgb(230,90,40,0.3)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} strokeWidth={3} />
            LÀM MỚI
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm font-medium text-rose-600 shadow-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-200/50">
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
            
            {/* Divider cho màn hình lớn */}
            <div className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gray-200/50 group-last:hidden" />
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
        <div className="flex flex-col gap-4 px-8 py-7 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917]">Danh Sách Booking</h2>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">
              Lọc theo trạng thái, thời gian tạo và tìm kiếm
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="relative w-80 max-w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm booking, khách, photographer..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#e65a28]"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {dateRangeFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setDateRangeFilter(filter.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    dateRangeFilter === filter.value
                      ? "border-[#e65a28] bg-[#e65a28] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === filter
                      ? "border-[#e65a28] bg-[#e65a28] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <select
                value={sortField}
                onChange={(event) => setSortField(event.target.value as BookingSortField)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#e65a28]"
              >
                {sortOptions.map((option) => (
                  <option key={`${option.value}-${option.label}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowUpDown size={14} />
                {sortDirection === "asc" ? "Tăng dần" : "Giảm dần"}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-gray-400 uppercase tracking-widest text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Booking</th>
                <th className="px-6 py-4 text-left font-semibold">Khách hàng</th>
                <th className="px-6 py-4 text-left font-semibold">Nhiếp ảnh gia</th>
                <th className="px-6 py-4 text-left font-semibold">Lịch chụp</th>
                <th className="px-6 py-4 text-left font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Agreed price</th>
                <th className="px-6 py-4 text-right font-semibold">Commission</th>
                <th className="px-6 py-4 text-left font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy booking phù hợp.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const customer = customerMap.get(booking.customerId);
                  const photographer = photographerMap.get(booking.photographerId);
                  const statusLabel = normalizeBookingStatus(booking.status);
                  return (
                    <tr key={booking.id} className="bg-white hover:shadow-md transition-shadow rounded-2xl group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{booking.id}</div>
                        <div className="text-xs text-slate-500 mt-1">Tạo: {formatDateTime(booking.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{customer?.displayName ?? booking.customerId}</div>
                        <div className="text-xs text-slate-500 mt-1">{customer?.email ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">
                          {photographer?.displayName ?? booking.photographerId}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{photographer?.email ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDateTime(booking.scheduledAt)}</td>
                      <td className="px-6 py-4">
                        <Badge className={getBookingStatusTone(booking.status)}>{statusLabel}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">
                        {formatCurrency(booking.agreedPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">
                        {formatCurrency(booking.commission)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {booking.cancellationReason
                          ? booking.cancellationReason
                          : booking.completedAt
                            ? "Đã hoàn thành"
                            : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
