'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';
import {
  Package, Search, Filter, RotateCcw, ChevronDown, ChevronUp, Plus, X, SlidersHorizontal,
  MapPin, Store, BarChart3
} from 'lucide-react';
import Protection from '@/components/Protection';
import DataTable from '@/components/DataTable';

const VIETNAM_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh",
  "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau",
  "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai",
  "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương",
  "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang",
  "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La",
  "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang",
  "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const MAIN_CATEGORIES = [
  "Thời trang nữ",
  "Thời trang nam",
  "Làm Đẹp & Chăm Sóc Cá Nhân",
  "Phụ Kiện Công Nghệ",
  "Đồ Gia Dụng & Đời Sống",
  "Đồ Ăn Vặt & Thực Phẩm"
];

export default function OrdersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || 'VIEWER').toUpperCase();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [creatorFilter, setCreatorFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [shopFilter, setShopFilter] = useState('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [newOrder, setNewOrder] = useState({
    Order_ID: '',
    Order_Date: '',
    Customer_ID: '',
    Customer_Name: '',
    Customer_Age: '',
    Customer_Gender: 'Nam',
    Shipping_City: '',
    Device_Type: 'Android',
    Product_ID: '',
    Product_Name: '',
    Main_Category: '',
    Sub_Category: '',
    Unit_Price: '',
    Quantity: '',
    Discount_Amount: '0',
    Shipping_Fee: '0',
    Total_Amount: '',
    Payment_Method: 'Cod (Thanh Toán Khi Nhận Hàng)',
    Order_Status: 'Đang vận chuyển',
    Product_Rating: '5',
    Review_Count: '0',
    Shop_ID: '',
    Shop_Name: '',
    Traffic_Source: 'Livestream TikTok',
    Creator_Name: '',
    Video_Views: '0',
    Is_Anomaly: 0,
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('tiktokshop_orders_filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.statusFilter !== undefined) setStatusFilter(parsed.statusFilter);
        if (parsed.paymentFilter !== undefined) setPaymentFilter(parsed.paymentFilter);
        if (parsed.categoryFilter !== undefined) setCategoryFilter(parsed.categoryFilter);
        if (parsed.creatorFilter !== undefined) setCreatorFilter(parsed.creatorFilter);
        if (parsed.cityFilter !== undefined) setCityFilter(parsed.cityFilter);
        if (parsed.shopFilter !== undefined) setShopFilter(parsed.shopFilter);
        if (parsed.anomalyFilter !== undefined) setAnomalyFilter(parsed.anomalyFilter);
        if (parsed.minAmount !== undefined) setMinAmount(parsed.minAmount);
        if (parsed.maxAmount !== undefined) setMaxAmount(parsed.maxAmount);
        if (parsed.startDate !== undefined) setStartDate(parsed.startDate);
        if (parsed.endDate !== undefined) setEndDate(parsed.endDate);
        if (parsed.currentPage !== undefined) setCurrentPage(parsed.currentPage);
        if (parsed.showAdvanced !== undefined) setShowAdvanced(parsed.showAdvanced);
      }
    } catch (err) {
      console.error('Lỗi phục hồi bộ lọc:', err);
    }
    setIsReady(true);
  }, []);

  const buildFilterQueryParams = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    if (paymentFilter !== 'ALL') params.append('paymentMethod', paymentFilter);
    if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
    if (creatorFilter !== 'ALL') params.append('creator', creatorFilter);
    if (cityFilter !== 'ALL') params.append('city', cityFilter);
    if (shopFilter !== 'ALL') params.append('shop', shopFilter);
    if (anomalyFilter !== 'ALL') params.append('isAnomaly', anomalyFilter);
    if (minAmount) params.append('minAmount', minAmount);
    if (maxAmount) params.append('maxAmount', maxAmount);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return params;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = buildFilterQueryParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());

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
    if (!isReady) return;
    fetchOrders();

    try {
      const filterState = {
        search, statusFilter, paymentFilter, categoryFilter, creatorFilter,
        cityFilter, shopFilter, anomalyFilter, minAmount, maxAmount,
        startDate, endDate, currentPage, showAdvanced,
      };
      sessionStorage.setItem('tiktokshop_orders_filters', JSON.stringify(filterState));
    } catch (err) {
      console.error('Lỗi lưu bộ lọc:', err);
    }
  }, [isReady, currentPage, limit, search, statusFilter, paymentFilter, categoryFilter, creatorFilter, cityFilter, shopFilter, anomalyFilter, minAmount, maxAmount, startDate, endDate, showAdvanced]);

  const handleResetFilters = () => {
    try {
      sessionStorage.removeItem('tiktokshop_orders_filters');
    } catch (e) {}
    setSearch('');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setCategoryFilter('ALL');
    setCreatorFilter('ALL');
    setCityFilter('ALL');
    setShopFilter('ALL');
    setAnomalyFilter('ALL');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    toast.success('Đã đặt lại tất cả bộ lọc!');
  };

  const handleGoToReports = () => {
    const filterQueryParams = buildFilterQueryParams().toString();
    router.push(filterQueryParams ? `/reports?${filterQueryParams}` : '/reports');
  };

  const activeFiltersCount = [
    statusFilter !== 'ALL', paymentFilter !== 'ALL', categoryFilter !== 'ALL',
    creatorFilter !== 'ALL', cityFilter !== 'ALL', shopFilter !== 'ALL',
    anomalyFilter !== 'ALL', !!minAmount, !!maxAmount, !!startDate, !!endDate, !!search.trim(),
  ].filter(Boolean).length;

  const handleDelete = async (id: string) => {
    toast.loading('Đang tiến hành xóa đơn hàng...', { id: 'deleteOrder' });
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã xóa thành công đơn hàng!`, { id: 'deleteOrder' });
        fetchOrders();
      } else {
        toast.error(`Xóa thất bại: ${data.message}`, { id: 'deleteOrder' });
      }
    } catch (err: any) {
      toast.error(`Lỗi kết nối: ${err.message}`, { id: 'deleteOrder' });
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const orderIdRegex = /^TTS-2024-\d{6}$/;
    if (!orderIdRegex.test(newOrder.Order_ID)) {
      setFormError('Mã đơn hàng không đúng định dạng! Yêu cầu: TTS-2024- kèm theo đúng 6 chữ số (VD: TTS-2024-123456).');
      return;
    }
    const customerIdRegex = /^CUST-\d{5}$/;
    if (!customerIdRegex.test(newOrder.Customer_ID)) {
      setFormError('Mã khách hàng không đúng định dạng! Yêu cầu: CUST- kèm đúng 5 chữ số (VD: CUST-01234).');
      return;
    }
    const productIdRegex = /^PROD-[A-Z]\d{2}$/;
    if (!productIdRegex.test(newOrder.Product_ID)) {
      setFormError('Mã sản phẩm không đúng định dạng! Yêu cầu: PROD-[Chữ cái viết hoa][2 chữ số] (VD: PROD-T01).');
      return;
    }
    if (!newOrder.Customer_Name.trim()) {
      setFormError('Tên khách hàng không được để trống!');
      return;
    }
    if (Number(newOrder.Customer_Age) <= 0) {
      setFormError('Tuổi khách hàng phải là số lớn hơn 0!');
      return;
    }
    if (!newOrder.Shipping_City.trim()) {
      setFormError('Thành phố giao hàng không được để trống!');
      return;
    }
    if (!newOrder.Product_Name.trim()) {
      setFormError('Tên sản phẩm không được để trống!');
      return;
    }
    if (!newOrder.Main_Category.trim()) {
      setFormError('Danh mục chính không được để trống!');
      return;
    }
    if (Number(newOrder.Quantity) <= 0) {
      setFormError('Số lượng sản phẩm phải lớn hơn 0!');
      return;
    }
    if (Number(newOrder.Unit_Price) < 0 || Number(newOrder.Total_Amount) < 0) {
      setFormError('Đơn giá và tổng tiền không được nhỏ hơn 0!');
      return;
    }

    try {
      const formattedDate = newOrder.Order_Date ? newOrder.Order_Date.replace('T', ' ') + ':00' : '';
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOrder,
          Order_Date: formattedDate,
          Customer_Age: Number(newOrder.Customer_Age),
          Unit_Price: Number(newOrder.Unit_Price),
          Quantity: Number(newOrder.Quantity),
          Discount_Amount: Number(newOrder.Discount_Amount),
          Shipping_Fee: Number(newOrder.Shipping_Fee),
          Total_Amount: Number(newOrder.Total_Amount),
          Product_Rating: Number(newOrder.Product_Rating),
          Review_Count: Number(newOrder.Review_Count),
          Video_Views: Number(newOrder.Video_Views),
          Is_Anomaly: Number(newOrder.Is_Anomaly),
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setIsModalOpen(false);
        fetchOrders();
        toast.success('Đã lưu thành công đơn hàng mới!');
        setNewOrder({
          Order_ID: '', Order_Date: '', Customer_ID: '', Customer_Name: '', Customer_Age: '',
          Customer_Gender: 'Nam', Shipping_City: '', Device_Type: 'Android', Product_ID: '', Product_Name: '',
          Main_Category: '', Sub_Category: '', Unit_Price: '', Quantity: '', Discount_Amount: '0',
          Shipping_Fee: '0', Total_Amount: '', Payment_Method: 'Cod (Thanh Toán Khi Nhận Hàng)',
          Order_Status: 'Đang vận chuyển', Product_Rating: '5', Review_Count: '0', Shop_ID: '',
          Shop_Name: '', Traffic_Source: 'Livestream TikTok', Creator_Name: '', Video_Views: '0', Is_Anomaly: 0,
        });
      } else {
        setFormError(data.error || 'Dữ liệu không hợp lệ hoặc bị trùng lặp.');
      }
    } catch (err: any) {
      setFormError(`Lỗi kết nối máy chủ (${err.message}).`);
    }
  };

  return (
    <Protection allowedRoles={['ADMIN', 'STAFF', 'VIEWER']}>
      <Toaster position="top-right" reverseOrder={false} />
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
                  Đang đăng nhập với vai trò: <strong className="uppercase">{role}</strong> • Tổng số: <span className="font-bold text-white">{totalOrdersCount}</span> đơn hàng
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleGoToReports}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-emerald-600/20 transition-all transform active:scale-95 shrink-0 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Xem Báo Cáo Thống Kê</span>
              </button>

              {role !== 'VIEWER' && (
                <button
                  onClick={() => { setFormError(''); setIsModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/20 transition-all transform active:scale-95 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm đơn hàng mới</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">Bộ Lọc & Truy Vấn Đơn Hàng Nâng Cao</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Hỗ trợ lọc kết hợp đa điều kiện trực tiếp trên cơ sở dữ liệu MongoDB Atlas</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại ({activeFiltersCount})</span>
                  </button>
                )}

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showAdvanced ? 'Thu gọn nâng cao' : 'Mở rộng nâng cao'}</span>
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm theo Mã đơn (Order_ID), Tên khách hàng, Mã khách hàng hoặc Tên sản phẩm..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-400 pl-12 pr-10 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
              />
              {search && (
                <button onClick={() => { setSearch(''); setCurrentPage(1); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trạng Thái Đơn Hàng</label>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200">
                  <option value="ALL">-- Tất cả trạng thái --</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Đang vận chuyển">Đang vận chuyển</option>
                  <option value="Đã hủy">Đã hủy</option>
                  <option value="Giao không thành công">Giao không thành công</option>
                  <option value="Hoàn trả / Khiếu nại">Hoàn trả / Khiếu nại</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phương Thức Thanh Toán</label>
                <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200">
                  <option value="ALL">-- Tất cả phương thức --</option>
                  <option value="Cod (Thanh Toán Khi Nhận Hàng)">Cod (Thanh Toán Khi Nhận Hàng)</option>
                  <option value="Chuyển khoản QR">Chuyển khoản QR</option>
                  <option value="Ví điện tử (ZaloPay/Momo)">Ví điện tử (ZaloPay/Momo)</option>
                  <option value="Thẻ tín dụng / Ghi nợ">Thẻ tín dụng / Ghi nợ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Danh Mục Sản Phẩm</label>
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200">
                  <option value="ALL">-- Tất cả danh mục --</option>
                  {MAIN_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nghi Ngờ Gian Lận (Is_Anomaly)</label>
                <select value={anomalyFilter} onChange={(e) => { setAnomalyFilter(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200">
                  <option value="ALL">-- Tất cả trạng thái rủi ro --</option>
                  <option value="0">0 - Bình thường</option>
                  <option value="1">1 - Nghi ngờ gian lận 🚨</option>
                </select>
              </div>
            </div>

            {showAdvanced && (
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Khu Vực / Tỉnh Thành
                  </label>
                  <input
                    type="text"
                    list="provinces-list-filter"
                    value={cityFilter === 'ALL' ? '' : cityFilter}
                    onChange={(e) => { setCityFilter(e.target.value || 'ALL'); setCurrentPage(1); }}
                    placeholder="Gõ hoặc chọn tỉnh/thành..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <datalist id="provinces-list-filter">
                    {VIETNAM_PROVINCES.map((prov) => <option key={prov} value={prov} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-indigo-400" /> Gian Hàng / Cửa Hàng
                  </label>
                  <select value={shopFilter} onChange={(e) => { setShopFilter(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200">
                    <option value="ALL">-- Tất cả gian hàng --</option>
                    <option value="Audio SoundMaster Mall">Audio SoundMaster Mall</option>
                    <option value="Beauty Queen Official Store">Beauty Queen Official Store</option>
                    <option value="TikTok Mall Official">TikTok Mall Official</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1.5">Khoảng Tổng Tiền (VNĐ)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min="0" placeholder="Min" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
                    <input type="number" min="0" placeholder="Max" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">Đang tải dữ liệu đơn hàng...</div>
          ) : (
            <DataTable
              orders={orders}
              userRole={role}
              currentPage={currentPage}
              totalPages={totalPages}
              limit={limit}
              onPageChange={(page) => setCurrentPage(page)}
              onLimitChange={(newLimit) => { setLimit(newLimit); setCurrentPage(1); }}
              onDelete={handleDelete}
            />
          )}

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl text-white my-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-400" /> Thêm Đơn Hàng Mới</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-medium cursor-pointer">✕ Đóng</button>
                </div>

                {formError && (
                  <div className="p-4 bg-red-950/90 text-red-200 rounded-2xl border-2 border-red-500 text-sm font-bold flex items-center gap-3 shadow-lg">
                    <span>⚠️ {formError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateOrder} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">1. Giao dịch & Vận hành</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Đơn Hàng (*)</label>
                        <input type="text" required value={newOrder.Order_ID} onChange={(e) => setNewOrder({ ...newOrder, Order_ID: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="TTS-2024-123456" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày Đặt Hàng (*)</label>
                        <input type="datetime-local" required value={newOrder.Order_Date} onChange={(e) => setNewOrder({ ...newOrder, Order_Date: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Trạng Thái Đơn Hàng</label>
                        <select value={newOrder.Order_Status} onChange={(e) => setNewOrder({ ...newOrder, Order_Status: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                          <option value="Hoàn thành">Hoàn thành</option>
                          <option value="Đang vận chuyển">Đang vận chuyển</option>
                          <option value="Đã hủy">Đã hủy</option>
                          <option value="Hoàn trả / Khiếu nại">Hoàn trả / Khiếu nại</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">2. Thông tin Khách Hàng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Khách Hàng (CUST-XXXXX) (*)</label>
                        <input type="text" required value={newOrder.Customer_ID} onChange={(e) => setNewOrder({ ...newOrder, Customer_ID: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="CUST-01234" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Khách Hàng (*)</label>
                        <input type="text" required value={newOrder.Customer_Name} onChange={(e) => setNewOrder({ ...newOrder, Customer_Name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="Nhập tên khách hàng..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tuổi (*)</label>
                        <input type="number" min="1" required value={newOrder.Customer_Age} onChange={(e) => setNewOrder({ ...newOrder, Customer_Age: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="VD: 25" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Giới Tính</label>
                        <select value={newOrder.Customer_Gender} onChange={(e) => setNewOrder({ ...newOrder, Customer_Gender: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Thành Phố (Chọn hoặc Tự gõ tìm) (*)</label>
                        <input
                          type="text"
                          list="provinces-list-modal"
                          required
                          value={newOrder.Shipping_City}
                          onChange={(e) => setNewOrder({ ...newOrder, Shipping_City: e.target.value })}
                          placeholder="Gõ hoặc chọn tỉnh/thành..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        />
                        <datalist id="provinces-list-modal">
                          {VIETNAM_PROVINCES.map(prov => <option key={prov} value={prov} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Thiết Bị</label>
                        <select value={newOrder.Device_Type} onChange={(e) => setNewOrder({ ...newOrder, Device_Type: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                          <option value="Android">Android</option>
                          <option value="iOS (iPhone)">iOS (iPhone)</option>
                          <option value="Desktop">Desktop</option>
                          <option value="Tablet">Tablet</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">3. Sản Phẩm & Tài Chính</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Sản Phẩm (PROD-X00) (*)</label>
                        <input type="text" required value={newOrder.Product_ID} onChange={(e) => setNewOrder({ ...newOrder, Product_ID: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="PROD-T01" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Sản Phẩm (*)</label>
                        <input type="text" required value={newOrder.Product_Name} onChange={(e) => setNewOrder({ ...newOrder, Product_Name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="Nhập tên sản phẩm..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Danh Mục Chính (*)</label>
                        <select
                          required
                          value={newOrder.Main_Category}
                          onChange={(e) => setNewOrder({ ...newOrder, Main_Category: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                        >
                          <option value="">-- Chọn danh mục chính --</option>
                          {MAIN_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Danh Mục Phụ</label>
                        <input type="text" value={newOrder.Sub_Category} onChange={(e) => setNewOrder({ ...newOrder, Sub_Category: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="Áo thun, Cáp sạc..." />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Thanh Toán</label>
                        <select value={newOrder.Payment_Method} onChange={(e) => setNewOrder({ ...newOrder, Payment_Method: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                          <option value="Cod (Thanh Toán Khi Nhận Hàng)">Cod (Thanh Toán Khi Nhận Hàng)</option>
                          <option value="Chuyển khoản QR">Chuyển khoản QR</option>
                          <option value="Ví điện tử (ZaloPay/Momo)">Ví điện tử (ZaloPay/Momo)</option>
                          <option value="Thẻ tín dụng / Ghi nợ">Thẻ tín dụng / Ghi nợ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Đơn Giá</label>
                        <input type="number" min="0" value={newOrder.Unit_Price} onChange={(e) => setNewOrder({ ...newOrder, Unit_Price: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Số Lượng (*)</label>
                        <input type="number" min="1" required value={newOrder.Quantity} onChange={(e) => setNewOrder({ ...newOrder, Quantity: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" placeholder="1" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-300 mb-1 font-bold">Tổng Tiền (*)</label>
                        <input type="number" min="0" required value={newOrder.Total_Amount} onChange={(e) => setNewOrder({ ...newOrder, Total_Amount: e.target.value })} className="w-full bg-slate-950 border border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-bold" placeholder="0" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium cursor-pointer">Hủy</button>
                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg cursor-pointer">Xác Nhận Thêm Mới</button>
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