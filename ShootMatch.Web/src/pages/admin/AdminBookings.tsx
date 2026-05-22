import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpDown, CalendarCheck, Clock3, RefreshCw, Search, TrendingUp, Users } from "lucide-react";
import { api } from "../../lib/api";
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
    { title: "Tổng booking", value: stats.totalBookings, icon: CalendarCheck, color: "bg-blue-500" },
    { title: "Hoàn thành", value: stats.completedBookings, icon: Users, color: "bg-emerald-500" },
    { title: "Đã huỷ", value: stats.cancelledBookings, icon: Clock3, color: "bg-rose-500" },
    {
      title: "Doanh thu thực nhận",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "bg-[#e65a28]",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 font-semibold">Admin bookings</p>
          <h1 className="font-sans text-3xl font-bold leading-[1.15] tracking-normal text-gray-800">
            Booking & Giao dịch
          </h1>
        </div>
        <button
          onClick={() => void loadBookings({ showRefreshing: true })}
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col gap-4 px-6 py-5 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800">Toàn bộ booking</h2>
            <p className="text-sm text-slate-500 mt-1">
              Lọc theo trạng thái, thời gian tạo và tìm theo tên, email, booking id.
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider text-xs">
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
            <tbody className="divide-y divide-gray-100 bg-white">
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
                    <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
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
