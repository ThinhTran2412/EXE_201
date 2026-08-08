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
import { downloadAdminReport } from "./adminExports.ts";
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
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "excel" | null>(null);
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

  const exportDashboardReport = async (format: "pdf" | "excel") => {
    try {
      setError(null);
      setExportingFormat(format);
      const response = await api.get(`/admin/reports/dashboard/${format}`, { responseType: "blob" });
      downloadAdminReport(response, `admin-dashboard-report.${format === "excel" ? "xlsx" : "pdf"}`);
    } catch (exportError) {
      console.error(exportError);
      setError("Không xuất được báo cáo dashboard. Vui lòng thử lại.");
    } finally {
      setExportingFormat(null);
    }
  };

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
    { title: "Khách Hàng", value: stats.totalCustomers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Nhiếp Ảnh Gia", value: stats.totalPhotographers, icon: Camera, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Lượt Booking", value: stats.totalBookings, icon: CalendarCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    {
      title: "Doanh Thu",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "text-[#e65a28]",
      bg: "bg-[#e65a28]/10"
    },
    { title: "Chờ Xác Minh", value: stats.pendingVerifications, icon: Clock3, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Đã Xác Minh", value: stats.verifiedPhotographers, icon: BadgeCheck, color: "text-slate-700", bg: "bg-slate-700/10" },
  ];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <div className="h-10 w-72 rounded-full bg-[#1c1917]/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 rounded-[2rem] bg-white/50 shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#e65a28] font-bold">
            Bảng Điều Khiển
          </p>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-wider text-[#1c1917] mt-2 drop-shadow-sm">
            TỔNG QUAN
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 self-start">
          <button
            onClick={() => void exportDashboardReport("pdf")}
            disabled={Boolean(exportingFormat) || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.1)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            Xuất PDF
          </button>
          <button
            onClick={() => void exportDashboardReport("excel")}
            disabled={Boolean(exportingFormat) || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.1)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            Xuất Excel
          </button>
          <button
            onClick={() => void loadDashboard()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full bg-[#e65a28] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest shadow-[0_8px_30px_rgb(230,90,40,0.3)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} strokeWidth={3} />
            LÀM MỚI
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm font-medium text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 py-6 border-y border-gray-200/50">
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
            <div className="hidden xl:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gray-200/50 group-last:hidden" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917] mb-1">
            Doanh thu theo tháng
          </h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-8">Chỉ tính booking hoàn thành</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => formatCurrency(Number(value)).replace(" ₫", "")} tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "none", borderRadius: "1rem", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                labelStyle={{ color: "#9ca3af", fontSize: "12px", textTransform: "uppercase" }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#e65a28"
                strokeWidth={4}
                dot={{ fill: "#ffffff", r: 5, strokeWidth: 2, stroke: "#e65a28" }}
                activeDot={{ r: 7, stroke: "#e65a28", strokeWidth: 2 }}
                name="Doanh thu (₫)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917] mb-1">
            Booking theo ngày
          </h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-8">Số lượng trong tuần</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingWeekSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "none", borderRadius: "1rem", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                labelStyle={{ color: "#9ca3af", fontSize: "12px", textTransform: "uppercase" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }} />
              <Bar dataKey="bookings" fill="#3b82f6" name="Lượt booking" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917] mb-1">
            Trạng thái booking
          </h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-8">Tỷ lệ toàn hệ thống</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingStatusSeries}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
                stroke="none"
              >
                {bookingStatusSeries.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "none", borderRadius: "1rem", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                itemStyle={{ fontWeight: "600" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917] mb-1">
            Xác minh nhiếp ảnh gia
          </h2>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-8">Tình trạng hồ sơ</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={verificationSeries}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
                stroke="none"
              >
                {verificationSeries.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "none", borderRadius: "1rem", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                itemStyle={{ fontWeight: "600" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "500", color: "#6b7280" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-8 py-7 border-b border-gray-100">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917]">
              Booking gần nhất
            </h2>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">8 giao dịch mới nhất</p>
          </div>
          <div className="text-xs font-bold bg-[#e65a28]/10 text-[#e65a28] px-4 py-1.5 rounded-full">
            TỔNG SỐ: {payload.bookings.length}
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-gray-400 uppercase tracking-widest text-xs font-semibold">
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
            <tbody className="bg-transparent">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                    Chưa có booking nào.
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => {
                  const customer = customerMap.get(booking.customerId);
                  const photographer = photographerMap.get(booking.photographerId);

                  return (
                    <tr key={booking.id} className="bg-white hover:shadow-md transition-shadow rounded-2xl group">
                      <td className="px-6 py-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-gray-100">
                        <div className="font-semibold text-gray-800">{customer?.displayName ?? booking.customerId}</div>
                        <div className="text-xs text-gray-400 mt-1">{customer?.email ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-y border-transparent group-hover:border-gray-100">
                        <div className="font-semibold text-gray-800">
                          {photographer?.displayName ?? booking.photographerId}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{photographer?.email ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium border-y border-transparent group-hover:border-gray-100">{formatDateTime(booking.createdAt)}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium border-y border-transparent group-hover:border-gray-100">{formatDateTime(booking.scheduledAt)}</td>
                      <td className="px-6 py-4 border-y border-transparent group-hover:border-gray-100">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${getBookingStatusTone(booking.status).replace("border", "border-none")}`}
                        >
                          {normalizeBookingStatus(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800 border-y border-transparent group-hover:border-gray-100">
                        {formatCurrency(booking.agreedPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#e65a28] rounded-r-2xl border-y border-r border-transparent group-hover:border-gray-100">
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
