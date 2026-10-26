'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Package, ShieldAlert, ArrowRight, Database, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import Protection from '@/components/Protection';
import DataTable from '@/components/DataTable';

export default function OrdersPage() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || 'VIEWER').toUpperCase();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?page=${currentPage}&limit=${limit}&search=${search}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, limit, search]);

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

          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-sm">
            <input
              type="text"
              placeholder="Tìm kiếm theo Mã đơn (Order_ID), Tên khách hàng hoặc Tên sản phẩm..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-400 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
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