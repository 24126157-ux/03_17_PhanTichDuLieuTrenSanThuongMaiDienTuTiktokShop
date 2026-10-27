'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Package, ShieldAlert, ArrowRight, Database, Plus, AlertCircle, CheckCircle2, 
  Search, Filter, RotateCcw, ChevronDown, ChevronUp, Calendar, DollarSign, Tag, Sparkles, X, SlidersHorizontal 
} from 'lucide-react';
import Protection from '@/components/Protection';
import DataTable from '@/components/DataTable';

export default function OrdersPage() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || 'VIEWER').toUpperCase();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // === CÁC STATE BỘ LỌC VÀ TÌM KIẾM (NHIỆM VỤ 2B - LƯU THỊ THƠ) ===
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [creatorFilter, setCreatorFilter] = useState('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newOrder, setNewOrder] = useState({
    Order_ID: '',
    Order_Date: '',
    Customer_ID: '',
    Customer_Name: '',
    Customer_Age: '',
    Customer_Gender: '',
    Shipping_City: '',
    Device_Type: '',
    Product_ID: '',
    Product_Name: '',
    Main_Category: '',
    Sub_Category: '',
    Unit_Price: '',
    Quantity: '',
    Discount_Amount: '',
    Shipping_Fee: '',
    Total_Amount: '',
    Payment_Method: 'Cod (Thanh Toán Khi Nhận Hàng)',
    Order_Status: 'Đang vận chuyển',
    Product_Rating: '',
    Review_Count: '',
    Shop_ID: '',
    Shop_Name: '',
    Traffic_Source: '',
    Creator_Name: '',
    Video_Views: '',
    Is_Anomaly: 0,
  });

  // Hàm gọi API truy vấn MongoDB động kết hợp đa điều kiện (Nhiệm vụ 2B)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (paymentFilter !== 'ALL') params.append('paymentMethod', paymentFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (creatorFilter !== 'ALL') params.append('creator', creatorFilter);
      if (anomalyFilter !== 'ALL') params.append('isAnomaly', anomalyFilter);
      if (minAmount) params.append('minAmount', minAmount);
      if (maxAmount) params.append('maxAmount', maxAmount);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalOrdersCount(data.pagination.totalOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, limit, search, statusFilter, paymentFilter, categoryFilter, creatorFilter, anomalyFilter, minAmount, maxAmount, startDate, endDate]);

  // Hàm xóa trắng toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setCategoryFilter('ALL');
    setCreatorFilter('ALL');
    setAnomalyFilter('ALL');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Đếm số lượng tiêu chí lọc đang được kích hoạt
  const activeFiltersCount = [
    statusFilter !== 'ALL',
    paymentFilter !== 'ALL',
    categoryFilter !== 'ALL',
    creatorFilter !== 'ALL',
    anomalyFilter !== 'ALL',
    !!minAmount,
    !!maxAmount,
    !!startDate,
    !!endDate,
    !!search.trim(),
  ].filter(Boolean).length;

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng này khỏi hệ thống không?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const orderIdRegex = /^TTS-2024-\d{6}$/;
    if (!orderIdRegex.test(newOrder.Order_ID)) {
      setFormError('Chưa lưu được: Mã đơn hàng không đúng định dạng! Yêu cầu: TTS-2024- kèm theo đúng 6 chữ số (Ví dụ: TTS-2024-123456).');
      return;
    }

    if (!newOrder.Customer_Name.trim()) {
      setFormError('Chưa lưu được: Tên khách hàng không được để trống.');
      return;
    }
    if (!newOrder.Product_Name.trim()) {
      setFormError('Chưa lưu được: Tên sản phẩm không được để trống.');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });
      const data = await res.json();
      
      if (data.success) {
        setIsModalOpen(false);
        fetchOrders();
        setSuccessMsg('Đã lưu thành công đơn hàng mới!');
        setNewOrder({
          Order_ID: '',
          Order_Date: '',
          Customer_ID: '',
          Customer_Name: '',
          Customer_Age: '',
          Customer_Gender: '',
          Shipping_City: '',
          Device_Type: '',
          Product_ID: '',
          Product_Name: '',
          Main_Category: '',
          Sub_Category: '',
          Unit_Price: '',
          Quantity: '',
          Discount_Amount: '',
          Shipping_Fee: '',
          Total_Amount: '',
          Payment_Method: 'Cod (Thanh Toán Khi Nhận Hàng)',
          Order_Status: 'Đang vận chuyển',
          Product_Rating: '',
          Review_Count: '',
          Shop_ID: '',
          Shop_Name: '',
          Traffic_Source: '',
          Creator_Name: '',
          Video_Views: '',
          Is_Anomaly: 0,
        });
      } else {
        setFormError(`Chưa lưu được: ${data.error || 'Dữ liệu không hợp lệ hoặc bị trùng lặp.'}`);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(`Chưa lưu được: Lỗi kết nối máy chủ (${err.message}).`);
    }
  };

  return (
    <Protection allowedRoles={['ADMIN', 'STAFF', 'VIEWER']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="p-3.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Package className="w-7 h-7" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Quản Lý Đơn Hàng TikTok Shop
                </h1>
                <p className="text-xs text-indigo-400 font-mono mt-1">
                  Đang đăng nhập với vai trò: <strong className="uppercase">{role}</strong>
                </p>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Trung tâm giám sát giao dịch, tìm kiếm nâng cao và thao tác CRUD đơn hàng tích hợp phân quyền RBAC.
                </p>
              </div>
            </div>

            {role !== 'VIEWER' && (
              <button
                onClick={() => {
                  setFormError('');
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/20 transition-all transform active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm đơn hàng mới</span>
              </button>
            )}
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-950/80 text-emerald-300 rounded-2xl border border-emerald-500/50 text-sm font-semibold flex items-center gap-3 shadow-lg">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* KHU VỰC BỘ LỌC VÀ TRUY VẤN DỮ LIỆU ĐA TIÊU CHÍ (NHIỆM VỤ 2B - LƯU THỊ THƠ) */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Thanh tiêu đề của Bộ lọc */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Bộ Lọc & Truy Vấn Đơn Hàng Nâng Cao
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      Nhiệm vụ 2B
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hỗ trợ lọc kết hợp đa điều kiện trực tiếp trên cơ sở dữ liệu MongoDB Atlas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                    title="Xóa toàn bộ các bộ lọc đang chọn"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại ({activeFiltersCount})</span>
                  </button>
                )}

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
                >
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showAdvanced ? 'Thu gọn nâng cao' : 'Mở rộng nâng cao'}</span>
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Ô Tìm kiếm Từ khóa Chính */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm theo Mã đơn (Order_ID), Tên khách hàng, Tên sản phẩm, Tên Shop, KOC hoặc Tỉnh thành..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-400 pl-12 pr-10 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hàng Các Bộ Lọc Phân Loại Cốt Lõi (Dropdown Filters) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Lọc theo Trạng thái đơn */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Trạng Thái Đơn Hàng
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="ALL">-- Tất cả trạng thái --</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Đang vận chuyển">Đang vận chuyển</option>
                  <option value="Đã hủy">Đã hủy</option>
                  <option value="Giao không thành công">Giao không thành công</option>
                  <option value="Hoàn trả / Khiếu nại">Hoàn trả / Khiếu nại</option>
                </select>
              </div>

              {/* Lọc theo Phương thức thanh toán */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phương Thức Thanh Toán
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="ALL">-- Tất cả phương thức --</option>
                  <option value="COD (Thanh toán khi nhận hàng)">COD (Thanh toán khi nhận hàng)</option>
                  <option value="Chuyển khoản QR">Chuyển khoản QR</option>
                  <option value="Ví điện tử (ZaloPay/Momo)">Ví điện tử (ZaloPay/Momo)</option>
                  <option value="Thẻ tín dụng/Ghi nợ">Thẻ tín dụng / Ghi nợ</option>
                </select>
              </div>

              {/* Lọc theo Danh mục ngành hàng */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Danh Mục Sản Phẩm
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="ALL">-- Tất cả danh mục --</option>
                  <option value="Thời trang nữ">Thời trang nữ</option>
                  <option value="Thời trang nam">Thời trang nam</option>
                  <option value="Làm đẹp & Chăm sóc cá nhân">Làm đẹp & Chăm sóc cá nhân</option>
                  <option value="Phụ kiện công nghệ">Phụ kiện công nghệ</option>
                  <option value="Đồ gia dụng & Đời sống">Đồ gia dụng & Đời sống</option>
                  <option value="Đồ ăn vặt & Thực phẩm">Đồ ăn vặt & Thực phẩm</option>
                </select>
              </div>

              {/* Lọc theo Creator / Kênh bán */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  KOC / Kênh Bán Hàng
                </label>
                <select
                  value={creatorFilter}
                  onChange={(e) => {
                    setCreatorFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="ALL">-- Tất cả Creator / Kênh --</option>
                  <option value="None (Gian hàng trực tiếp)">Bán trực tiếp (Gian hàng)</option>
                  <option value="None (Tìm kiếm tự nhiên)">Tìm kiếm tự nhiên (Organic)</option>
                  <option value="Võ Hà Linh">Võ Hà Linh</option>
                  <option value="Phạm Thoại">Phạm Thoại</option>
                  <option value="Call Me Duy">Call Me Duy</option>
                  <option value="Lê Dương Bảo Lâm">Lê Dương Bảo Lâm</option>
                  <option value="Diệp Lê">Diệp Lê</option>
                  <option value="Trinh Phạm">Trinh Phạm</option>
                  <option value="Tun Phạm">Tun Phạm</option>
                  <option value="Quyền Leo Daily">Quyền Leo Daily</option>
                  <option value="Duy Muối">Duy Muối</option>
                  <option value="Đào Bá Lộc">Đào Bá Lộc</option>
                  <option value="Gian hàng tự Live (Shop Direct)">Gian hàng tự Live</option>
                  <option value="KOL Không tên (Affiliate)">KOL Không tên (Affiliate)</option>
                </select>
              </div>
            </div>

            {/* Bảng Mở Rộng Bộ Lọc Nâng Cao (Khoảng tiền, Khoảng ngày, Bất thường) */}
            {showAdvanced && (
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-2xl border">
                {/* Lọc Khoảng Tổng Tiền */}
                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Khoảng Tổng Tiền (VNĐ)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Tối thiểu (Min)"
                      value={minAmount}
                      onChange={(e) => {
                        setMinAmount(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                    <input
                      type="number"
                      placeholder="Tối đa (Max)"
                      value={maxAmount}
                      onChange={(e) => {
                        setMaxAmount(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Lọc Khoảng Ngày Đặt Hàng */}
                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Khoảng Ngày Đặt Hàng
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Lọc Đơn Hàng Bất Thường / Machine Learning */}
                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Phân Loại Đơn Hàng (Is_Anomaly)
                  </label>
                  <select
                    value={anomalyFilter}
                    onChange={(e) => {
                      setAnomalyFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">-- Tất cả (Bình thường & Bất thường) --</option>
                    <option value="0">Đơn hàng bình thường (Hợp lệ)</option>
                    <option value="1">⚠️ Đơn hàng bất thường (Nghi ngờ gian lận)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Thanh hiển thị kết quả và các chip bộ lọc đang hoạt động */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-semibold text-white">Kết quả truy vấn:</span>
                <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 font-mono font-bold rounded-lg border border-indigo-500/20">
                  {loading ? 'Đang tải...' : `${totalOrdersCount.toLocaleString('vi-VN')} đơn hàng`}
                </span>
                <span className="text-slate-500 hidden sm:inline">|</span>
                <span className="text-slate-400 hidden sm:inline">Trang {currentPage} / {totalPages || 1}</span>
              </div>

              {/* Các chip hiển thị tiêu chí đang lọc */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {statusFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      Trạng thái: <strong>{statusFilter}</strong>
                      <button onClick={() => setStatusFilter('ALL')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {paymentFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      Thanh toán: <strong>{paymentFilter}</strong>
                      <button onClick={() => setPaymentFilter('ALL')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {categoryFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      Ngành hàng: <strong>{categoryFilter}</strong>
                      <button onClick={() => setCategoryFilter('ALL')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {creatorFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      KOC: <strong>{creatorFilter}</strong>
                      <button onClick={() => setCreatorFilter('ALL')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {anomalyFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs">
                      {anomalyFilter === '1' ? '⚠️ Đơn bất thường' : 'Đơn hợp lệ'}
                      <button onClick={() => setAnomalyFilter('ALL')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {minAmount && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      Min: {Number(minAmount).toLocaleString('vi-VN')} đ
                      <button onClick={() => setMinAmount('')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {maxAmount && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                      Max: {Number(maxAmount).toLocaleString('vi-VN')} đ
                      <button onClick={() => setMaxAmount('')} className="hover:text-rose-400 ml-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
              Đang tải dữ liệu đơn hàng từ cơ sở dữ liệu...
            </div>
          ) : (
            <DataTable
              orders={orders}
              userRole={role}
              currentPage={currentPage}
              totalPages={totalPages}
              limit={limit}
              onPageChange={(page) => setCurrentPage(page)}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setCurrentPage(1);
              }}
              onDelete={handleDelete}
            />
          )}

          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Khu vực kiểm thử Role Guard (RBAC):
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Nếu tài khoản <strong>không phải ADMIN</strong> (ví dụ: đang đăng nhập là <strong>{role}</strong>) mà bấm vào trang <code>/backup-restore</code> thì hệ thống sẽ tự động chặn quyền truy cập.
            </p>

            <Link
              href="/backup-restore"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition shadow"
            >
              <Database className="w-4 h-4" />
              <span>Thử truy cập trang /backup-restore (Để kiểm tra chặn quyền)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl text-white my-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-400" />
                    Thêm Đơn Hàng Mới
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 hover:text-white text-sm font-medium"
                  >
                    ✕ Đóng
                  </button>
                </div>

                {formError && (
                  <div className="p-4 bg-red-950/90 text-red-200 rounded-2xl border-2 border-red-500 text-sm font-bold flex items-center gap-3 shadow-lg">
                    <AlertCircle className="w-6 h-6 shrink-0 text-red-400 animate-pulse" />
                    <div className="space-y-0.5">
                      <p className="text-red-400 uppercase tracking-wide text-xs font-extrabold">Trạng thái thao tác: Chưa lưu được</p>
                      <p className="text-base text-white">{formError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateOrder} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                  
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">1. Giao dịch & Vận hành</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Đơn Hàng (Order_ID)</label>
                        <input
                          type="text"
                          required
                          value={newOrder.Order_ID}
                          onChange={(e) => setNewOrder({ ...newOrder, Order_ID: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: TTS-2024-123456"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày Đặt (Order_Date)</label>
                        <input
                          type="text"
                          required
                          value={newOrder.Order_Date}
                          onChange={(e) => setNewOrder({ ...newOrder, Order_Date: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: 2024-09-13 12:23:58"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Trạng Thái Đơn Hàng</label>
                        <select
                          value={newOrder.Order_Status}
                          onChange={(e) => setNewOrder({ ...newOrder, Order_Status: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        >
                          <option value="Hoàn thành">Hoàn thành</option>
                          <option value="Đang vận chuyển">Đang vận chuyển</option>
                          <option value="Đã hủy">Đã hủy</option>
                          <option value="Hoàn trả / Khiếu nại">Hoàn trả / Khiếu nại</option>
                          <option value="Giao không thành công">Giao không thành công</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Cảnh Báo Bất Thường (Is_Anomaly)</label>
                        <select
                          value={newOrder.Is_Anomaly}
                          onChange={(e) => setNewOrder({ ...newOrder, Is_Anomaly: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        >
                          <option value={0}>0 - Bình thường</option>
                          <option value={1}>1 - Bất thường / Gian lận</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Phương Thức Thanh Toán</label>
                        <select
                          value={newOrder.Payment_Method}
                          onChange={(e) => setNewOrder({ ...newOrder, Payment_Method: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        >
                          <option value="Cod (Thanh Toán Khi Nhận Hàng)">Cod (Thanh Toán Khi Nhận Hàng)</option>
                          <option value="Ví Điện Tử (Zalopay/Momo)">Ví Điện Tử (Zalopay/Momo)</option>
                          <option value="Chuyển Khoản Qr">Chuyển Khoản Qr</option>
                          <option value="Thẻ Tín Dụng/Ghi Nợ">Thẻ Tín Dụng/Ghi Nợ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">2. Thông tin Khách Hàng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Mã KH (Customer_ID)</label>
                        <input
                          type="text"
                          value={newOrder.Customer_ID}
                          onChange={(e) => setNewOrder({ ...newOrder, Customer_ID: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: CUST-01234"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Khách Hàng</label>
                        <input
                          type="text"
                          required
                          value={newOrder.Customer_Name}
                          onChange={(e) => setNewOrder({ ...newOrder, Customer_Name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: Nguyễn Văn A"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tuổi & Giới Tính</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={newOrder.Customer_Age}
                            onChange={(e) => setNewOrder({ ...newOrder, Customer_Age: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Tuổi"
                          />
                          <input
                            type="text"
                            value={newOrder.Customer_Gender}
                            onChange={(e) => setNewOrder({ ...newOrder, Customer_Gender: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Giới tính"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Thành Phố Giao Hàng</label>
                        <input
                          type="text"
                          value={newOrder.Shipping_City}
                          onChange={(e) => setNewOrder({ ...newOrder, Shipping_City: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: Hà Nội"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Loại Thiết Bị (Device_Type)</label>
                        <input
                          type="text"
                          value={newOrder.Device_Type}
                          onChange={(e) => setNewOrder({ ...newOrder, Device_Type: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: Android / iOS"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">3. Sản Phẩm & Tài Chính</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Sản Phẩm</label>
                        <input
                          type="text"
                          required
                          value={newOrder.Product_Name}
                          onChange={(e) => setNewOrder({ ...newOrder, Product_Name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: Áo thun Oversize"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Danh Mục (Main / Sub)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newOrder.Main_Category}
                            onChange={(e) => setNewOrder({ ...newOrder, Main_Category: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Danh mục chính"
                          />
                          <input
                            type="text"
                            value={newOrder.Sub_Category}
                            onChange={(e) => setNewOrder({ ...newOrder, Sub_Category: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Danh mục phụ"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Đơn Giá & Số Lượng</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={newOrder.Unit_Price}
                            onChange={(e) => setNewOrder({ ...newOrder, Unit_Price: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Đơn giá"
                          />
                          <input
                            type="number"
                            value={newOrder.Quantity}
                            onChange={(e) => setNewOrder({ ...newOrder, Quantity: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Số lượng"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Giảm Giá & Phí Ship</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={newOrder.Discount_Amount}
                            onChange={(e) => setNewOrder({ ...newOrder, Discount_Amount: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Giảm giá"
                          />
                          <input
                            type="number"
                            value={newOrder.Shipping_Fee}
                            onChange={(e) => setNewOrder({ ...newOrder, Shipping_Fee: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Phí ship"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-300 mb-1 font-bold">Tổng Tiền (Total_Amount)</label>
                        <input
                          type="number"
                          value={newOrder.Total_Amount}
                          onChange={(e) => setNewOrder({ ...newOrder, Total_Amount: e.target.value })}
                          className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-3 py-2 text-sm text-white font-bold"
                          placeholder="Ví dụ: 115000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">4. Marketing, KOL & Cửa hàng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Nguồn Traffic</label>
                        <input
                          type="text"
                          value={newOrder.Traffic_Source}
                          onChange={(e) => setNewOrder({ ...newOrder, Traffic_Source: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: Livestream TikTok"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Creator / KOL</label>
                        <input
                          type="text"
                          value={newOrder.Creator_Name}
                          onChange={(e) => setNewOrder({ ...newOrder, Creator_Name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: Võ Hà Linh"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Lượt Xem Video</label>
                        <input
                          type="number"
                          value={newOrder.Video_Views}
                          onChange={(e) => setNewOrder({ ...newOrder, Video_Views: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: 50000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Shop</label>
                        <input
                          type="text"
                          value={newOrder.Shop_Name}
                          onChange={(e) => setNewOrder({ ...newOrder, Shop_Name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                          placeholder="Ví dụ: TikTok Mall"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Đánh Giá (Rating / Reviews)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={newOrder.Product_Rating}
                            onChange={(e) => setNewOrder({ ...newOrder, Product_Rating: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Rating"
                          />
                          <input
                            type="number"
                            value={newOrder.Review_Count}
                            onChange={(e) => setNewOrder({ ...newOrder, Review_Count: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                            placeholder="Reviews"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg transition"
                    >
                      Xác Nhận Thêm Mới
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </Protection>
  );
}