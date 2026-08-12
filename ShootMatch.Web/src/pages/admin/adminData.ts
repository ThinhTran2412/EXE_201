export interface AdminDashboardStats {
  totalCustomers: number;
  totalPhotographers: number;
  totalBookings: number;
  totalRevenue: number;
}

export interface AdminCustomer {
  id: string;
  displayName: string;
  phone: string;
  email: string;
  region: string;
  avatarUrl?: string | null;
  coverPhotoUrl?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastSeenAt?: string | null;
}

export interface AdminPhotographer {
  id: string;
  displayName: string;
  phone: string;
  email: string;
  region: string;
  avatarUrl?: string | null;
  coverPhotoUrl?: string | null;
  rating: number;
  isPremium: boolean;
  isAvailable: boolean;
  acceptsInstantBooking: boolean;
  verificationStatus: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBooking {
  id: string;
  customerId: string;
  photographerId: string;
  matchId: string;
  servicePackageId?: string | null;
  status: string | number;
  escrowStatus?: string | number;
  agreedPrice: number;
  commission: number;
  scheduledAt: string;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export interface AdminVerificationRequest {
  id: string;
  photographerId: string;
  documentType: string;
  documentImageUrl: string;
  selfieUrl: string;
  status: string;
  reviewedBy?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export type SortDirection = "asc" | "desc";

export type DateRangePreset = "all" | "7d" | "30d" | "90d";

const bookingStatusOrder = ["Pending", "Confirmed", "Completed", "Cancelled", "Disputed"] as const;
const verificationStatusOrder = ["Verified", "Pending", "Rejected", "Unverified"] as const;
const weekdayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function titleCase(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseTime(value?: string | null) {
  if (!value) return Number.NaN;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Number.NaN : date.getTime();
}

function directionFactor(direction: SortDirection) {
  return direction === "asc" ? 1 : -1;
}

export function includesKeyword(values: Array<string | number | boolean | null | undefined>, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;

  return values.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(normalizedKeyword),
  );
}

export function compareText(left: string, right: string, direction: SortDirection = "asc") {
  return left.localeCompare(right, "vi", { sensitivity: "base" }) * directionFactor(direction);
}

export function compareNumber(left: number, right: number, direction: SortDirection = "asc") {
  return (left - right) * directionFactor(direction);
}

export function compareDate(left?: string | null, right?: string | null, direction: SortDirection = "asc") {
  return (parseTime(left) - parseTime(right)) * directionFactor(direction);
}

export function isWithinDateRange(value: string | null | undefined, preset: DateRangePreset) {
  if (preset === "all") return true;

  const time = parseTime(value);
  if (Number.isNaN(time)) return false;

  const now = Date.now();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  return now - time <= days * 24 * 60 * 60 * 1000;
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateOnly(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

export function normalizeBookingStatus(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return bookingStatusOrder[value] ?? `Unknown ${value}`;
  }

  if (typeof value === "string") {
    const normalized = titleCase(value);
    return normalized || "Unknown";
  }

  return "Unknown";
}

export function normalizeVerificationStatus(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return verificationStatusOrder[value] ?? `Unknown ${value}`;
  }

  if (typeof value === "string") {
    const normalized = titleCase(value);
    return normalized || "Unknown";
  }

  return "Unknown";
}

export function getBookingStatusTone(status: string | number | null | undefined) {
  switch (normalizeBookingStatus(status)) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Confirmed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Cancelled":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Disputed":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getVerificationTone(status: string | number | null | undefined) {
  switch (normalizeVerificationStatus(status)) {
    case "Verified":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Unverified":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value ?? 0) || 0;
}

export function parseDashboardStats(data: any): AdminDashboardStats {
  return {
    totalCustomers: readNumber(data?.totalCustomers ?? data?.TotalCustomers),
    totalPhotographers: readNumber(data?.totalPhotographers ?? data?.TotalPhotographers),
    totalBookings: readNumber(data?.totalBookings ?? data?.TotalBookings),
    totalRevenue: readNumber(data?.totalRevenue ?? data?.TotalRevenue),
  };
}

export function buildMonthlyRevenueSeries(memberships: any[], months = 6) {
  const now = new Date();
  const buckets = new Map<string, number>();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const month = now.getMonth() - offset;
    const date = new Date(now.getFullYear(), month, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }

  memberships.forEach((membership) => {
    if (membership.status !== "Paid") return;
    const completedAt = membership.createdAt ? new Date(membership.createdAt) : null;
    if (!completedAt || Number.isNaN(completedAt.getTime())) return;

    const key = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, "0")}`;
    if (!buckets.has(key)) return;

    buckets.set(key, (buckets.get(key) ?? 0) + (membership.amount || 0));
  });

  return Array.from(buckets.entries()).map(([key, revenue]) => {
    const [year, month] = key.split("-");
    return {
      month: `${month}/${year.slice(-2)}`,
      revenue,
    };
  });
}

export function buildWeeklyBookingSeries(bookings: AdminBooking[]) {
  const counts = [0, 0, 0, 0, 0, 0, 0];

  bookings.forEach((booking) => {
    const createdAt = new Date(booking.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;
    const mondayFirstIndex = (createdAt.getDay() + 6) % 7;
    counts[mondayFirstIndex] += 1;
  });

  return weekdayLabels.map((date, index) => ({ date, bookings: counts[index] }));
}

export function buildBookingStatusSeries(bookings: AdminBooking[]) {
  const statusCounts = new Map<string, number>();

  bookings.forEach((booking) => {
    const status = normalizeBookingStatus(booking.status);
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  });

  const orderedStatuses = [
    ...bookingStatusOrder,
    ...Array.from(statusCounts.keys())
      .filter((status) => !bookingStatusOrder.includes(status as (typeof bookingStatusOrder)[number]))
      .sort(),
  ];

  return orderedStatuses
    .filter((status) => statusCounts.has(status))
    .map((status) => ({ name: status, value: statusCounts.get(status) ?? 0 }));
}

export function buildVerificationStatusSeries(photographers: AdminPhotographer[]) {
  const statusCounts = new Map<string, number>();

  photographers.forEach((photographer) => {
    const status = normalizeVerificationStatus(photographer.verificationStatus);
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  });

  const orderedStatuses = [
    ...verificationStatusOrder,
    ...Array.from(statusCounts.keys())
      .filter((status) => !verificationStatusOrder.includes(status as (typeof verificationStatusOrder)[number]))
      .sort(),
  ];

  return orderedStatuses
    .filter((status) => statusCounts.has(status))
    .map((status) => ({ name: status, value: statusCounts.get(status) ?? 0 }));
}
