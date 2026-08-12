import { useEffect, useState } from "react";
import { CreditCard, Search, RefreshCw, CheckCircle, AlertCircle, XCircle, ArrowUpRight, DollarSign, Activity } from "lucide-react";
import { api } from "../../lib/api";
import { downloadAdminReport } from "./adminExports";

interface MembershipTransaction {
  orderCode: number;
  userId: string;
  userRole: "customer" | "photographer";
  userName: string;
  planId: string;
  cycle: string;
  amount: number;
  status: "Paid" | "Pending" | "Cancelled";
  createdAt: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
}

export default function AdminMemberships() {
  const [transactions, setTransactions] = useState<MembershipTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [checkingOrderId, setCheckingOrderId] = useState<number | null>(null);
  const [exportingFormat, setExportingFormat] = useState<"excel" | null>(null);

  const exportMembershipsReport = async () => {
    try {
      setExportingFormat("excel");
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("statusFilter", statusFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const response = await api.get<Blob>(`/admin/reports/memberships/excel`, {
        params,
        responseType: "blob",
      });

      downloadAdminReport(response, `admin-memberships-report.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Không thể xuất file excel giao dịch hội viên.");
    } finally {
      setExportingFormat(null);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/payments/membership/transactions");
      setTransactions(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách giao dịch hội viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const checkStatusWithPayOS = async (orderCode: number) => {
    try {
      setCheckingOrderId(orderCode);
      const response = await api.get(`/payments/membership/status/${orderCode}`);
      // Refresh transactions list
      await fetchTransactions();
      alert(`Trạng thái hiện tại từ PayOS: ${response.data.status}`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi kiểm tra trạng thái với PayOS.");
    } finally {
      setCheckingOrderId(null);
    }
  };

  // Calculations for stats
  const paidTxns = transactions.filter((t) => t.status === "Paid");
  const pendingTxns = transactions.filter((t) => t.status === "Pending");
  const totalRevenue = paidTxns.reduce((sum, t) => sum + t.amount, 0);
  const successRate = transactions.length > 0 ? (paidTxns.length / transactions.length) * 100 : 0;

  // Plan ID mapper
  const formatPlanName = (planId: string) => {
    switch (planId) {
      case "chon_xinh": return "Chọn Xinh (Customer)";
      case "chot_xin": return "Chốt Xịn (Customer)";
      case "pro": return "Pro (Photographer)";
      case "studio_plus": return "Studio+ (Photographer)";
      case "basic": return "Basic (Photographer)";
      case "luot_nhe": return "Lướt Nhẹ (Customer)";
      default: return planId;
    }
  };

  // Cycle mapper
  const formatCycle = (cycle: string) => {
    switch (cycle) {
      case "month": return "1 Tháng";
      case "6months": return "6 Tháng";
      case "year": return "1 Năm";
      default: return cycle;
    }
  };

  // Filter and search logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.orderCode.toString().includes(searchTerm) ||
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.counterAccountName && t.counterAccountName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.counterAccountNumber && t.counterAccountNumber.includes(searchTerm));
    
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500 p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#e65a28] font-bold">Giao Dịch</p>
          <h1 className="font-display text-[42px] uppercase leading-none tracking-wider text-[#1c1917] mt-2 drop-shadow-sm">
            HỘI VIÊN
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={exportMembershipsReport}
            disabled={exportingFormat !== null}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-750 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.1)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <ArrowUpRight size={14} className={exportingFormat === "excel" ? "animate-spin" : ""} strokeWidth={3} />
            {exportingFormat === "excel" ? "ĐANG XUẤT..." : "XUẤT EXCEL"}
          </button>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 bg-white/80 backdrop-blur-md px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-750 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.1)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={3} />
            LÀM MỚI
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-200/50">
        <div className="flex flex-col gap-2 relative group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign size={14} strokeWidth={3} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tổng Doanh Thu</div>
          </div>
          <div className="text-2xl font-display tracking-wide text-gray-800">{totalRevenue.toLocaleString("vi-VN")} ₫</div>
          <div className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gray-200/50 group-last:hidden" />
        </div>

        <div className="flex flex-col gap-2 relative group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <CheckCircle size={14} strokeWidth={3} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Thành Công (Paid)</div>
          </div>
          <div className="text-2xl font-display tracking-wide text-gray-800">{paidTxns.length}</div>
          <div className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gray-200/50 group-last:hidden" />
        </div>

        <div className="flex flex-col gap-2 relative group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Activity size={14} strokeWidth={3} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Đang Chờ (Pending)</div>
          </div>
          <div className="text-2xl font-display tracking-wide text-gray-800">{pendingTxns.length}</div>
          <div className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gray-200/50 group-last:hidden" />
        </div>

        <div className="flex flex-col gap-2 relative group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <ArrowUpRight size={14} strokeWidth={3} />
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tỉ Lệ Chuyển Đổi</div>
          </div>
          <div className="text-2xl font-display tracking-wide text-gray-800">{successRate.toFixed(1)}%</div>
          <div className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gray-200/50 group-last:hidden" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên, số tài khoản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-5 py-3 bg-white/50 border border-gray-200 rounded-full text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#e65a28] transition-all text-sm focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["all", "Paid", "Pending", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
                statusFilter === status
                  ? "border-[#e65a28] bg-[#e65a28] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {status === "all" ? "Tất Cả" : status === "Paid" ? "Đã Thanh Toán" : status === "Pending" ? "Đang Chờ" : "Đã Hủy"}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-slate-400" size={32} />
            <span>Đang tải danh sách giao dịch...</span>
          </div>
        ) : error ? (
          <div className="p-20 text-center text-rose-500 flex flex-col items-center gap-3">
            <AlertCircle size={32} />
            <span>{error}</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-2">
            <CreditCard size={32} className="text-slate-350" />
            <span>Không tìm thấy giao dịch nào phù hợp.</span>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-full text-sm border-separate border-spacing-y-2 text-left">
              <thead className="text-gray-400 uppercase tracking-widest text-xs font-semibold">
                <tr>
                  <th className="py-4 px-6">Mã đơn hàng</th>
                  <th className="py-4 px-6">Người mua</th>
                  <th className="py-4 px-6">Gói / Chu kỳ</th>
                  <th className="py-4 px-6">Số tiền</th>
                  <th className="py-4 px-6">Ngân hàng</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-transparent text-sm">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.orderCode} className="bg-white hover:shadow-md transition-shadow rounded-2xl group">
                    {/* Order Code */}
                    <td className="py-4 px-6 font-bold text-slate-800 rounded-l-2xl border-y border-l border-transparent group-hover:border-gray-100">
                      {tx.orderCode}
                    </td>

                    {/* User */}
                    <td className="py-4 px-6 border-y border-transparent group-hover:border-gray-100">
                      <div className="font-semibold text-slate-800">{tx.userName}</div>
                      <span className={`inline-block text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 mt-1 rounded-md ${
                        tx.userRole === "customer" 
                          ? "bg-sky-50 text-sky-600 border border-sky-100" 
                          : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      }`}>
                        {tx.userRole === "customer" ? "Khách hàng" : "Thợ ảnh"}
                      </span>
                    </td>

                    {/* Plan & Cycle */}
                    <td className="py-4 px-6 border-y border-transparent group-hover:border-gray-100">
                      <div className="font-medium text-slate-700">{formatPlanName(tx.planId)}</div>
                      <span className="text-xs text-slate-400 block mt-0.5">Chu kỳ: {formatCycle(tx.cycle)}</span>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-bold text-slate-850 border-y border-transparent group-hover:border-gray-100">
                      {tx.amount.toLocaleString("vi-VN")} ₫
                    </td>

                    {/* Transfer Bank Details */}
                    <td className="py-4 px-6 border-y border-transparent group-hover:border-gray-100">
                      {tx.counterAccountNumber ? (
                        <div className="space-y-0.5">
                          {tx.counterAccountBankName === "MOMO" || !tx.counterAccountName ? (
                            <>
                              <div className="font-semibold text-slate-750">Ví MOMO</div>
                              <div className="text-xs text-slate-600 font-mono">Mã GD/SĐT: {tx.counterAccountNumber}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-semibold text-slate-750">{tx.counterAccountName}</div>
                              <div className="text-xs text-slate-600 font-mono">STK: {tx.counterAccountNumber}</div>
                              {tx.counterAccountBankName && (
                                <span className="inline-block text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                                  {tx.counterAccountBankName}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Chưa có thông tin chuyển khoản</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-center border-y border-transparent group-hover:border-gray-100">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest leading-none ${
                        tx.status === "Paid"
                          ? "bg-emerald-50 text-emerald-600"
                          : tx.status === "Pending"
                          ? "bg-amber-50 text-amber-600 animate-pulse"
                          : "bg-rose-50 text-rose-600"
                      }`}>
                        {tx.status === "Paid" ? (
                          <>
                            <CheckCircle size={12} />
                            <span>Đã thanh toán</span>
                          </>
                        ) : tx.status === "Pending" ? (
                          <>
                            <Activity size={12} />
                            <span>Đang chờ</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>Đã huỷ</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right rounded-r-2xl border-y border-r border-transparent group-hover:border-gray-100">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => checkStatusWithPayOS(tx.orderCode)}
                          disabled={checkingOrderId === tx.orderCode}
                          className="px-3 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200/60 text-gray-700 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(230,90,40,0.1)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Check PayOS Status"
                        >
                          {checkingOrderId === tx.orderCode ? (
                            <RefreshCw size={14} className="animate-spin text-slate-400" />
                          ) : (
                            <Search size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
