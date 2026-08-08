import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpDown, BadgeCheck, Pencil, RefreshCw, Search, Users } from "lucide-react";
import { api } from "../../lib/api";
import {
  compareDate,
  compareText,
  formatDateTime,
  includesKeyword,
  type SortDirection,
} from "./adminData";
import type { AdminCustomer } from "./adminData";
import EditUserModal, { type EditUserTarget } from "./EditUserModal";

function normalizeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

type CustomerSortField = "createdAt" | "lastSeenAt" | "name";

const customerFilterOptions = ["All", "Verified", "Active", "Inactive"] as const;
const customerSortOptions: Array<{ label: string; value: CustomerSortField }> = [
  { label: "Ngày tạo", value: "createdAt" },
  { label: "Tên A-Z", value: "name" },
  { label: "Hoạt động gần đây", value: "lastSeenAt" },
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

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTarget, setEditingTarget] = useState<EditUserTarget | null>(null);
  const [query, setQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState<(typeof customerFilterOptions)[number]>("All");
  const [customerSortField, setCustomerSortField] = useState<CustomerSortField>("createdAt");
  const [customerSortDirection, setCustomerSortDirection] = useState<SortDirection>("desc");
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async (options?: { showRefreshing?: boolean }) => {
    try {
      if (options?.showRefreshing) {
        setError(null);
        setRefreshing(true);
      }
      const response = await api.get("/admin/customers");
      setError(null);
      setCustomers(normalizeList<AdminCustomer>(response.data));
    } catch (loadError) {
      console.error(loadError);
      setError("Không tải được dữ liệu khách hàng. Hãy kiểm tra API hoặc token admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return [...customers]
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
  }, [customerFilter, customerSortDirection, customerSortField, customers, query]);

  const verifiedCustomers = customers.filter((customer) => customer.isVerified).length;
  const activeCustomers = customers.filter((customer) => customer.isActive).length;

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
    { title: "Tổng Khách Hàng", value: customers.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Đã Xác Minh", value: verifiedCustomers, icon: BadgeCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Đang Hoạt Động", value: activeCustomers, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#e65a28] font-bold">Quản Lý Người Dùng</p>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-wider text-[#1c1917] mt-2 drop-shadow-sm">
            KHÁCH HÀNG
          </h1>
        </div>
        <button
          onClick={() => void loadUsers({ showRefreshing: true })}
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
            <h2 className="font-display text-2xl uppercase tracking-wider text-[#1c1917]">Danh Sách Khách Hàng</h2>
            <p className="text-sm text-slate-500 mt-1">
              Tổng: {customers.length} • Đang hoạt động: {activeCustomers}
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
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-gray-400 uppercase tracking-widest text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Người dùng</th>
                <th className="px-6 py-4 text-left font-semibold">Khu vực</th>
                <th className="px-6 py-4 text-left font-semibold">Xác minh</th>
                <th className="px-6 py-4 text-left font-semibold">Hoạt động</th>
                <th className="px-6 py-4 text-left font-semibold">Cập nhật lần cuối</th>
                <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy khách hàng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="bg-white hover:shadow-md transition-shadow rounded-2xl group">
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
