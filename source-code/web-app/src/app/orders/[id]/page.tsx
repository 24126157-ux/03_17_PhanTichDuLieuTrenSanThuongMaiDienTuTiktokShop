'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Package, User, ShoppingBag, DollarSign, Activity, ArrowLeft, Save, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || 'VIEWER').toUpperCase();
  const isViewer = role === 'VIEWER';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(''); // Thành công: "Đã lưu thành công!"
  const [errorMsg, setErrorMsg] = useState<string>(''); // Lỗi nổi bật: "Chưa lưu được..."

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrder(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMsg('Chưa lưu được: Tài khoản Khách xem (Viewer) không có quyền chỉnh sửa dữ liệu!');
      setMessage('');
      return;
    }

    setErrorMsg('');
    setMessage('');

    // Kiểm tra định dạng Order_ID: TTS-2024- đúng 6 chữ số
    const orderIdRegex = /^TTS-2024-\d{6}$/;
    if (order.Order_ID && !orderIdRegex.test(order.Order_ID)) {
      setErrorMsg('Chưa lưu được: Mã đơn hàng không đúng định dạng! Yêu cầu: TTS-2024- kèm theo đúng 6 chữ số (Ví dụ: TTS-2024-123456).');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Đã lưu thành công!');
        setErrorMsg('');
        setOrder(data.data);
      } else {
        setErrorMsg(`Chưa lưu được: ${data.message || data.error || 'Dữ liệu không hợp lệ.'}`);
      }
    } catch (err: any) {
      setErrorMsg(`Chưa lưu được: Lỗi kết nối máy chủ (${err.message}).`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400 font-sans">
        <div className="animate-pulse text-lg font-semibold">Đang tải dữ liệu đơn hàng...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-sans space-y-4">
        <p className="text-red-400 font-bold text-xl">Không tìm thấy thông tin đơn hàng!</p>
        <Link href="/orders" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Package className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Chi tiết Đơn hàng: <span className="text-indigo-400">{order.Order_ID || 'N/A'}</span>
                </h1>
                {isViewer && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Lock className="w-3.5 h-3.5" /> Chế độ chỉ xem (Read-only)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">MongoDB ID: {order._id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/orders');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition border border-slate-700/60 shadow cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </button>
        </div>

        {/* Thông báo Thành công ("Đã lưu thành công") */}
        {message && (
          <div className="p-4 bg-emerald-950/80 text-emerald-300 rounded-2xl border border-emerald-500/50 text-sm font-semibold flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Thông báo Lỗi Nổi Bật ("Chưa lưu được") */}
        {errorMsg && (
          <div className="p-4 bg-red-950/90 text-red-200 rounded-2xl border-2 border-red-500 text-sm font-bold flex items-center gap-3 shadow-2xl">
            <AlertCircle className="w-6 h-6 shrink-0 text-red-400 animate-pulse" />
            <div className="space-y-0.5">
              <p className="text-red-400 uppercase tracking-wide text-xs font-extrabold">⚠️ Trạng thái thao tác: Chưa lưu được</p>
              <p className="text-base text-white">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-8">
          
          {/* Nhóm 1: Thông tin Chung & Vận Hành */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-inner">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4" /> 1. Thông tin Giao dịch & Vận hành
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Đơn Hàng (Order_ID)</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Order_ID || ''}
                  onChange={(e) => setOrder({ ...order, Order_ID: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ngày Đặt Hàng (Order_Date)</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Order_Date || ''}
                  onChange={(e) => setOrder({ ...order, Order_Date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trạng Thái Đơn Hàng</label>
                <select
                  disabled={isViewer}
                  value={order.Order_Status || ''}
                  onChange={(e) => setOrder({ ...order, Order_Status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Đang vận chuyển">Đang vận chuyển</option>
                  <option value="Đã hủy">Đã hủy</option>
                  <option value="Hoàn trả / Khiếu nại">Hoàn trả / Khiếu nại</option>
                  <option value="Giao không thành công">Giao không thành công</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cảnh Báo Bất Thường (Is_Anomaly)</label>
                <select
                  disabled={isViewer}
                  value={order.Is_Anomaly ?? 0}
                  onChange={(e) => setOrder({ ...order, Is_Anomaly: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={0}>0 - Bình thường</option>
                  <option value={1}>1 - Bất thường / Nghi ngờ gian lận</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phương Thức Thanh Toán</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Payment_Method || ''}
                  onChange={(e) => setOrder({ ...order, Payment_Method: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Thông tin Khách Hàng */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-inner">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <User className="w-4 h-4" /> 2. Thông tin Khách Hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã KH (Customer_ID)</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Customer_ID || ''}
                  onChange={(e) => setOrder({ ...order, Customer_ID: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Khách Hàng</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Customer_Name || ''}
                  onChange={(e) => setOrder({ ...order, Customer_Name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tuổi & Giới Tính</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    disabled={isViewer}
                    value={order.Customer_Age || ''}
                    onChange={(e) => setOrder({ ...order, Customer_Age: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Tuổi"
                  />
                  <input
                    type="text"
                    disabled={isViewer}
                    value={order.Customer_Gender || ''}
                    onChange={(e) => setOrder({ ...order, Customer_Gender: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Giới tính"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thành Phố Giao Hàng (Shipping_City)</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Shipping_City || ''}
                  onChange={(e) => setOrder({ ...order, Shipping_City: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Loại Thiết Bị (Device_Type)</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Device_Type || ''}
                  onChange={(e) => setOrder({ ...order, Device_Type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 3: Sản Phẩm & Tài Chính */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-inner">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" /> 3. Sản Phẩm & Tài Chính
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Sản Phẩm</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Product_Name || ''}
                  onChange={(e) => setOrder({ ...order, Product_Name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Danh Mục (Main / Sub)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled={isViewer}
                    value={order.Main_Category || ''}
                    onChange={(e) => setOrder({ ...order, Main_Category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Danh mục chính"
                  />
                  <input
                    type="text"
                    disabled={isViewer}
                    value={order.Sub_Category || ''}
                    onChange={(e) => setOrder({ ...order, Sub_Category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Danh mục phụ"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Đơn Giá & Số Lượng</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    disabled={isViewer}
                    value={order.Unit_Price || 0}
                    onChange={(e) => setOrder({ ...order, Unit_Price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Đơn giá"
                  />
                  <input
                    type="number"
                    disabled={isViewer}
                    value={order.Quantity || 0}
                    onChange={(e) => setOrder({ ...order, Quantity: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Số lượng"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Giảm Giá & Phí Ship</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    disabled={isViewer}
                    value={order.Discount_Amount || 0}
                    onChange={(e) => setOrder({ ...order, Discount_Amount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Giảm giá"
                  />
                  <input
                    type="number"
                    disabled={isViewer}
                    value={order.Shipping_Fee || 0}
                    onChange={(e) => setOrder({ ...order, Shipping_Fee: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Phí ship"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-300 mb-1.5 font-bold">Tổng Tiền (Total_Amount)</label>
                <input
                  type="number"
                  disabled={isViewer}
                  value={order.Total_Amount || 0}
                  onChange={(e) => setOrder({ ...order, Total_Amount: Number(e.target.value) })}
                  className="w-full bg-indigo-950/40 border border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 4: Marketing, KOL & Shop */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-inner">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <DollarSign className="w-4 h-4" /> 4. Marketing, KOL & Cửa Hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nguồn Traffic (Traffic_Source)</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Traffic_Source || ''}
                  onChange={(e) => setOrder({ ...order, Traffic_Source: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Creator / KOL</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Creator_Name || ''}
                  onChange={(e) => setOrder({ ...order, Creator_Name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lượt Xem Video (Video_Views)</label>
                <input
                  type="number"
                  disabled={isViewer}
                  value={order.Video_Views || 0}
                  onChange={(e) => setOrder({ ...order, Video_Views: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Shop (Shop_Name)</label>
                <input
                  type="text"
                  disabled={isViewer}
                  value={order.Shop_Name || ''}
                  onChange={(e) => setOrder({ ...order, Shop_Name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Đánh Giá Sản Phẩm (Rating / Reviews)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    disabled={isViewer}
                    value={order.Product_Rating || 0}
                    onChange={(e) => setOrder({ ...order, Product_Rating: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Rating"
                  />
                  <input
                    type="number"
                    disabled={isViewer}
                    value={order.Review_Count || 0}
                    onChange={(e) => setOrder({ ...order, Review_Count: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Reviews"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nút Lưu */}
          {!isViewer && (
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/20 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Đang lưu...' : 'Lưu Tất Cả Thay Đổi'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}