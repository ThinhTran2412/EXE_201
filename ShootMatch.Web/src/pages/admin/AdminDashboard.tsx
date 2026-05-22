import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CalendarCheck, Camera, Clock3, RefreshCw, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../../lib/api";
import {
  buildBookingStatusSeries,
  buildMonthlyRevenueSeries,
  buildVerificationStatusSeries,
  formatCurrency,
  formatDateTime,
  getBookingStatusTone,
  normalizeBookingStatus,
  normalizeVerificationStatus,
  parseDashboardStats,
  buildWeeklyBookingSeries,
} from "./adminData";
import type {
  AdminBooking,
  AdminCustomer,
  AdminDashboardStats,
  AdminPhotographer,
  AdminVerificationRequest,
} from "./adminData";

const COLORS = ["#e65a28", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

type DashboardPayload = {
  stats: AdminDashboardStats;
  customers: AdminCustomer[];
  photographers: AdminPhotographer[];
  bookings: AdminBooking[];
  verificationRequests: AdminVerificationRequest[];
};

function normalizeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export default function AdminDashboard() {
  const [payload, setPayload] = useState<DashboardPayload>({
    stats: {
      totalCustomers: 0,
      totalPhotographers: 0,
      totalBookings: 0,
      totalRevenue: 0,
    },
    customers: [],
    photographers: [],
    bookings: [],
    verificationRequests: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setError(null);
      setRefreshing(true);
      const [statsResponse, customersResponse, photographersResponse, bookingsResponse, verificationResponse] =
        await Promise.all([
          api.get("/admin/dashboard-stats"),
          api.get("/admin/customers"),
          api.get("/admin/photographers"),
          api.get("/admin/bookings"),
          api.get("/admin/verification-requests"),
        ]);

      setPayload({
        stats: parseDashboardStats(statsResponse.data),
        customers: normalizeList<AdminCustomer>(customersResponse.data),
        photographers: normalizeList<AdminPhotographer>(photographersResponse.data),
        bookings: normalizeList<AdminBooking>(bookingsResponse.data),
        verificationRequests: normalizeList<AdminVerificationRequest>(verificationResponse.data),
      });
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được dữ liệu admin. Vui lòng kiểm tra kết nối API hoặc token đăng nhập.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [statsResponse, customersResponse, photographersResponse, bookingsResponse, verificationResponse] =
          await Promise.all([
            api.get("/admin/dashboard-stats"),
            api.get("/admin/customers"),
            api.get("/admin/photographers"),
            api.get("/admin/bookings"),
            api.get("/admin/verification-requests"),
          ]);

        if (active) {
          setPayload({
            stats: parseDashboardStats(statsResponse.data),
            customers: normalizeList<AdminCustomer>(customersResponse.data),
            photographers: normalizeList<AdminPhotographer>(photographersResponse.data),
            bookings: normalizeList<AdminBooking>(bookingsResponse.data),
            verificationRequests: normalizeList<AdminVerificationRequest>(verificationResponse.data),
          });
        }
      } catch (loadError) {
        if (active) {
          console.error(loadError);
          setError("Không tải được dữ liệu admin. Vui lòng kiểm tra kết nối API hoặc token đăng nhập.");
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

  const stats = useMemo(() => {
    const revenueFromData = payload.bookings.reduce((sum, booking) => {
      return normalizeBookingStatus(booking.status) === "Completed" ? sum + (booking.commission ?? 0) : sum;
    }, 0);

    return {
      totalCustomers: payload.stats.totalCustomers || payload.customers.length,
      totalPhotographers: payload.stats.totalPhotographers || payload.photographers.length,
      totalBookings: payload.stats.totalBookings || payload.bookings.length,
      totalRevenue: payload.stats.totalRevenue || revenueFromData,
      pendingVerifications: payload.verificationRequests.length,
      verifiedPhotographers: payload.photographers.filter(
        (photographer) => normalizeVerificationStatus(photographer.verificationStatus) === "Verified",
      ).length,
    };
  }, [payload]);

  const revenueSeries = useMemo(() => buildMonthlyRevenueSeries(payload.bookings, 6), [payload.bookings]);
  const bookingWeekSeries = useMemo(() => buildWeeklyBookingSeries(payload.bookings), [payload.bookings]);
  const bookingStatusSeries = useMemo(() => buildBookingStatusSeries(payload.bookings), [payload.bookings]);
  const verificationSeries = useMemo(
    () => buildVerificationStatusSeries(payload.photographers),
    [payload.photographers],
  );

  const recentBookings = useMemo(
    () => [...payload.bookings].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 8),
    [payload.bookings],
  );

  const customerMap = useMemo(
    () => new Map(payload.customers.map((customer) => [customer.id, customer])),
    [payload.customers],
  );
  const photographerMap = useMemo(
    () => new Map(payload.photographers.map((photographer) => [photographer.id, photographer])),
    [payload.photographers],
  );

  const cards = [
    { title: "Khách hàng", value: stats.totalCustomers, icon: Users, color: "bg-blue-500" },
    { title: "Nhiếp ảnh gia", value: stats.totalPhotographers, icon: Camera, color: "bg-indigo-500" },
    { title: "Lượt booking", value: stats.totalBookings, icon: CalendarCheck, color: "bg-emerald-500" },
    {
      title: "Doanh thu thực nhận",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "bg-[#e65a28]",
    },
    { title: "Chờ xác minh", value: stats.pendingVerifications, icon: Clock3, color: "bg-amber-500" },
    { title: "Đã xác minh", value: stats.verifiedPhotographers, icon: BadgeCheck, color: "bg-slate-700" },
  ];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-72 rounded-lg bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 font-semibold">Admin overview</p>
          <h1 className="font-sans text-3xl font-bold leading-[1.15] tracking-normal text-gray-800">
            Tổng quan hệ thống
          </h1>
        </div>
        <button
          onClick={() => void loadDashboard()}
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800 mb-2">
            Doanh thu theo tháng
          </h2>
          <p className="text-sm text-slate-500 mb-6">Chỉ tính các booking đã hoàn thành.</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => formatCurrency(Number(value)).replace(" ₫", "")} />
              <Tooltip
                contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                labelStyle={{ color: "#1f2937" }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#e65a28"
                strokeWidth={3}
                dot={{ fill: "#e65a28", r: 5 }}
                activeDot={{ r: 7 }}
                name="Doanh thu (₫)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800 mb-2">
            Booking theo ngày trong tuần
          </h2>
          <p className="text-sm text-slate-500 mb-6">Dựa trên thời điểm tạo booking thực tế.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingWeekSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                labelStyle={{ color: "#1f2937" }}
              />
              <Legend />
              <Bar dataKey="bookings" fill="#3b82f6" name="Lượt booking" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800 mb-2">
            Trạng thái booking
          </h2>
          <p className="text-sm text-slate-500 mb-6">Phân bổ toàn bộ booking hiện có trong hệ thống.</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingStatusSeries}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={90}
                dataKey="value"
              >
                {bookingStatusSeries.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                labelStyle={{ color: "#1f2937" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800 mb-2">
            Trạng thái xác minh nhiếp ảnh gia
          </h2>
          <p className="text-sm text-slate-500 mb-6">Lấy từ dữ liệu thực của photographers.</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={verificationSeries}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={90}
                dataKey="value"
              >
                {verificationSeries.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                labelStyle={{ color: "#1f2937" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-sans text-xl font-bold leading-[1.2] tracking-normal text-gray-800">
              Booking gần nhất
            </h2>
            <p className="text-sm text-slate-500 mt-1">8 booking mới nhất để theo dõi hoạt động thực tế.</p>
          </div>
          <div className="text-sm text-slate-500">Tổng số: {payload.bookings.length}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Khách hàng</th>
                <th className="px-6 py-4 text-left font-semibold">Nhiếp ảnh gia</th>
                <th className="px-6 py-4 text-left font-semibold">Ngày tạo</th>
                <th className="px-6 py-4 text-left font-semibold">Lịch chụp</th>
                <th className="px-6 py-4 text-left font-semibold">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold">Tiền booking</th>
                <th className="px-6 py-4 text-right font-semibold">Phí nền tảng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Chưa có booking nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => {
                  const customer = customerMap.get(booking.customerId);
                  const photographer = photographerMap.get(booking.photographerId);

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-slate-700">
                        <div className="font-semibold text-gray-800">{customer?.displayName ?? booking.customerId}</div>
                        <div className="text-xs text-slate-500 mt-1">{customer?.email ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="font-semibold text-gray-800">
                          {photographer?.displayName ?? booking.photographerId}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{photographer?.email ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDateTime(booking.createdAt)}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDateTime(booking.scheduledAt)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${getBookingStatusTone(booking.status)}`}
                        >
                          {normalizeBookingStatus(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">
                        {formatCurrency(booking.agreedPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">
                        {formatCurrency(booking.commission)}
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
