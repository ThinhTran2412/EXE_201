import { useEffect, useState } from "react";
import { CreditCard, Search, RefreshCw, CheckCircle, AlertCircle, XCircle, ArrowUpRight, DollarSign, Activity } from "lucide-react";
import { api } from "../../lib/api";

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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Giao dịch Hội viên (Subscriptions)
          </h1>
          <p className="text-slate-500 mt-1">
            Quản lý và thống kê thông tin nâng cấp gói thành viên qua cổng thanh toán PayOS.
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Tải lại dữ liệu
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-400 block uppercase tracking-wider">Tổng doanh thu</span>
            <span className="text-2xl font-bold text-slate-850 mt-1 block">
              {totalRevenue.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Total Successful Transactions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-400 block uppercase tracking-wider">Thành công (Paid)</span>
            <span className="text-2xl font-bold text-slate-850 mt-1 block">
              {paidTxns.length} giao dịch
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-400 block uppercase tracking-wider">Đang chờ (Pending)</span>
            <span className="text-2xl font-bold text-slate-850 mt-1 block">
              {pendingTxns.length} giao dịch
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Activity size={24} className="animate-pulse" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-400 block uppercase tracking-wider">Tỉ lệ chuyển đổi</span>
            <span className="text-2xl font-bold text-slate-850 mt-1 block">
              {successRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên, số tài khoản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {["all", "Paid", "Pending", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition active:scale-[0.98] ${
                statusFilter === status
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "all" ? "Tất cả" : status === "Paid" ? "Đã thanh toán" : status === "Pending" ? "Đang chờ" : "Đã huỷ"}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase text-xs tracking-wider font-semibold">
                  <th className="py-4 px-6">Mã đơn hàng (PayOS)</th>
                  <th className="py-4 px-6">Người mua</th>
                  <th className="py-4 px-6">Gói / Chu kỳ</th>
                  <th className="py-4 px-6">Số tiền</th>
                  <th className="py-4 px-6">Ngân hàng chuyển khoản thực tế</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.orderCode} className="hover:bg-slate-50/50 transition-colors">
                    {/* Order Code */}
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {tx.orderCode}
                    </td>

                    {/* User */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{tx.userName}</div>
                      <span className={`inline-block text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 mt-1 rounded-md ${
                        tx.userRole === "customer" 
                          ? "bg-sky-50 text-sky-600 border border-sky-100" 
                          : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      }`}>
                        {tx.userRole === "customer" ? "Khách hàng" : "Thợ ảnh"}
                      </span>
                    </td>

                    {/* Plan & Cycle */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-700">{formatPlanName(tx.planId)}</div>
                      <span className="text-xs text-slate-400 block mt-0.5">Chu kỳ: {formatCycle(tx.cycle)}</span>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-bold text-slate-850">
                      {tx.amount.toLocaleString("vi-VN")} ₫
                    </td>

                    {/* Transfer Bank Details */}
                    <td className="py-4 px-6">
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
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold leading-none ${
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

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      {tx.status === "Pending" ? (
                        <button
                          onClick={() => checkStatusWithPayOS(tx.orderCode)}
                          disabled={checkingOrderId === tx.orderCode}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition active:scale-[0.97] disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={checkingOrderId === tx.orderCode ? "animate-spin" : ""} />
                          {checkingOrderId === tx.orderCode ? "Đang check..." : "Check PayOS"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Hoàn tất</span>
                      )}
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
