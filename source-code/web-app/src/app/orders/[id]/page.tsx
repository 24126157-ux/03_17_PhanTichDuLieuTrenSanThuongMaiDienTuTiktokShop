'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';
import { Package, User, ShoppingBag, ArrowLeft, Save, Lock, AlertCircle, Megaphone } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          let formattedDate = data.data.Order_Date || '';
          if (formattedDate && formattedDate.includes(' ')) {
            formattedDate = formattedDate.replace(' ', 'T').substring(0, 16);
          }
          setOrder({ ...data.data, Order_Date: formattedDate });
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
      toast.error('Tài khoản Khách xem (Viewer) không có quyền chỉnh sửa!');
      return;
    }

    setErrorMsg('');
    const orderIdRegex = /^TTS-2024-\d{6}$/;
    if (!order.Order_ID || !orderIdRegex.test(order.Order_ID)) {
      setErrorMsg('Mã đơn hàng không đúng định dạng! Yêu cầu: TTS-2024- kèm theo đúng 6 chữ số.');
      return;
    }

    const customerIdRegex = /^CUST-\d{5}$/;
    if (!order.Customer_ID || !customerIdRegex.test(order.Customer_ID)) {
      setErrorMsg('Mã khách hàng không đúng định dạng! Yêu cầu: CUST- kèm đúng 5 chữ số (VD: CUST-01234).');
      return;
    }

    const productIdRegex = /^PROD-[A-Z]\d{2}$/;
    if (!order.Product_ID || !productIdRegex.test(order.Product_ID)) {
      setErrorMsg('Mã sản phẩm không đúng định dạng! Yêu cầu: PROD-[Chữ cái viết hoa][2 chữ số] (VD: PROD-T01).');
      return;
    }

    if (!order.Customer_Name?.trim()) {
      setErrorMsg('Tên khách hàng không được để trống.');
      return;
    }
    if (!order.Shipping_City?.trim()) {
      setErrorMsg('Thành phố giao hàng không được để trống.');
      return;
    }
    if (!order.Product_Name?.trim()) {
      setErrorMsg('Tên sản phẩm không được để trống.');
      return;
    }
    if (!order.Main_Category?.trim()) {
      setErrorMsg('Danh mục chính không được để trống.');
      return;
    }
    if (Number(order.Customer_Age) <= 0) {
      setErrorMsg('Tuổi khách hàng phải là số lớn hơn 0.');
      return;
    }
    if (Number(order.Quantity) <= 0) {
      setErrorMsg('Số lượng sản phẩm phải lớn hơn 0.');
      return;
    }
    if (Number(order.Unit_Price) < 0 || Number(order.Total_Amount) < 0) {
      setErrorMsg('Đơn giá và tổng tiền không được nhỏ hơn 0.');
      return;
    }

    setSaving(true);
    toast.loading('Đang lưu thay đổi...', { id: 'saveOrder' });

    try {
      const payload = {
        ...order,
        Order_Date: order.Order_Date ? order.Order_Date.replace('T', ' ') + ':00' : ''
      };
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã lưu thành công thay đổi đơn hàng!', { id: 'saveOrder' });
        let updatedDate = data.data.Order_Date || '';
        if (updatedDate && updatedDate.includes(' ')) {
          updatedDate = updatedDate.replace(' ', 'T').substring(0, 16);
        }
        setOrder({ ...data.data, Order_Date: updatedDate });
      } else {
        toast.error(`Lưu thất bại: ${data.message || data.error}`, { id: 'saveOrder' });
        setErrorMsg(data.message || data.error);
      }
    } catch (err: any) {
      toast.error(`Lỗi kết nối máy chủ`, { id: 'saveOrder' });
      setErrorMsg(`Lỗi kết nối (${err.message}).`);
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
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8">
        
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
                    <Lock className="w-3.5 h-3.5" /> Chế độ chỉ xem
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">MongoDB ID: {order._id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/orders')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition border border-slate-700/60 shadow cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/90 text-red-200 rounded-2xl border-2 border-red-500 text-sm font-bold flex items-center gap-3 shadow-2xl">
            <AlertCircle className="w-6 h-6 shrink-0 text-red-400 animate-pulse" />
            <p className="text-base text-white">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-8">
          
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              1. Thông tin Giao dịch & Vận hành
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Đơn Hàng (Order_ID) (*)</label>
                <input type="text" disabled value={order.Order_ID || ''} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ngày Đặt Hàng (*)</label>
                <input type="datetime-local" required disabled={isViewer} value={order.Order_Date || ''} onChange={(e) => setOrder({ ...order, Order_Date: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trạng Thái Đơn Hàng</label>
                <select disabled={isViewer} value={order.Order_Status || ''} onChange={(e) => setOrder({ ...order, Order_Status: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50">
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Đang vận chuyển">Đang vận chuyển</option>
                  <option value="Đã hủy">Đã hủy</option>
                  <option value="Giao không thành công">Giao không thành công</option>
                  <option value="Hoàn trả / Khiếu nại">Hoàn trả / Khiếu nại</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cảnh Báo Bất Thường (Is_Anomaly)</label>
                <select disabled={isViewer} value={order.Is_Anomaly ?? 0} onChange={(e) => setOrder({ ...order, Is_Anomaly: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50">
                  <option value={0}>0 - Bình thường</option>
                  <option value={1}>1 - Bất thường / Nghi ngờ gian lận 🚨</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <User className="w-4 h-4" /> 2. Thông tin Khách Hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Khách Hàng (CUST-XXXXX) (*)</label>
                <input type="text" required disabled={isViewer} value={order.Customer_ID || ''} onChange={(e) => setOrder({ ...order, Customer_ID: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" placeholder="VD: CUST-01234" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Khách Hàng (*)</label>
                <input type="text" required disabled={isViewer} value={order.Customer_Name || ''} onChange={(e) => setOrder({ ...order, Customer_Name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tuổi (Bắt buộc &gt; 0) (*)</label>
                <input type="number" min="1" required disabled={isViewer} value={order.Customer_Age || ''} onChange={(e) => setOrder({ ...order, Customer_Age: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Giới Tính</label>
                <select disabled={isViewer} value={order.Customer_Gender || 'Nam'} onChange={(e) => setOrder({ ...order, Customer_Gender: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thành Phố Giao Hàng (*)</label>
                <input
                  type="text"
                  list="provinces-list-detail"
                  required
                  disabled={isViewer}
                  value={order.Shipping_City || ''}
                  onChange={(e) => setOrder({ ...order, Shipping_City: e.target.value })}
                  placeholder="Gõ hoặc chọn tỉnh/thành..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50"
                />
                <datalist id="provinces-list-detail">
                  {VIETNAM_PROVINCES.map((prov) => (
                    <option key={prov} value={prov} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Loại Thiết Bị</label>
                <select disabled={isViewer} value={order.Device_Type || 'Android'} onChange={(e) => setOrder({ ...order, Device_Type: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50">
                  <option value="Android">Android</option>
                  <option value="iOS (iPhone)">iOS (iPhone)</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Tablet">Tablet</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" /> 3. Sản Phẩm & Tài Chính
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Sản Phẩm (PROD-X00) (*)</label>
                <input type="text" required disabled={isViewer} value={order.Product_ID || ''} onChange={(e) => setOrder({ ...order, Product_ID: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" placeholder="VD: PROD-T01" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Sản Phẩm (*)</label>
                <input type="text" required disabled={isViewer} value={order.Product_Name || ''} onChange={(e) => setOrder({ ...order, Product_Name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Danh Mục Chính (*)</label>
                <select
                  required
                  disabled={isViewer}
                  value={order.Main_Category || ''}
                  onChange={(e) => setOrder({ ...order, Main_Category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50"
                >
                  <option value="">-- Chọn danh mục chính --</option>
                  {MAIN_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Danh Mục Phụ</label>
                <input type="text" disabled={isViewer} value={order.Sub_Category || ''} onChange={(e) => setOrder({ ...order, Sub_Category: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phương Thức Thanh Toán</label>
                <select disabled={isViewer} value={order.Payment_Method || ''} onChange={(e) => setOrder({ ...order, Payment_Method: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50">
                  <option value="Cod (Thanh Toán Khi Nhận Hàng)">Cod (Thanh Toán Khi Nhận Hàng)</option>
                  <option value="Chuyển khoản QR">Chuyển khoản QR</option>
                  <option value="Ví điện tử (ZaloPay/Momo)">Ví điện tử (ZaloPay/Momo)</option>
                  <option value="Thẻ tín dụng / Ghi nợ">Thẻ tín dụng / Ghi nợ</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Đơn Giá</label>
                <input type="number" min="0" disabled={isViewer} value={order.Unit_Price || 0} onChange={(e) => setOrder({ ...order, Unit_Price: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số Lượng (*)</label>
                <input type="number" min="1" required disabled={isViewer} value={order.Quantity || 1} onChange={(e) => setOrder({ ...order, Quantity: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Giảm Giá</label>
                <input type="number" min="0" disabled={isViewer} value={order.Discount_Amount || 0} onChange={(e) => setOrder({ ...order, Discount_Amount: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phí Vận Chuyển</label>
                <input type="number" min="0" disabled={isViewer} value={order.Shipping_Fee || 0} onChange={(e) => setOrder({ ...order, Shipping_Fee: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-300 mb-1.5 font-bold">Tổng Tiền (*)</label>
                <input type="number" min="0" required disabled={isViewer} value={order.Total_Amount || 0} onChange={(e) => setOrder({ ...order, Total_Amount: Number(e.target.value) })} className="w-full bg-indigo-950/40 border border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold disabled:opacity-50" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <Megaphone className="w-4 h-4" /> 4. Cửa Hàng & Marketing Big Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Cửa Hàng</label>
                <input type="text" disabled={isViewer} value={order.Shop_ID || ''} onChange={(e) => setOrder({ ...order, Shop_ID: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Cửa Hàng</label>
                <input type="text" disabled={isViewer} value={order.Shop_Name || ''} onChange={(e) => setOrder({ ...order, Shop_Name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Đánh Giá (1-5)</label>
                <input type="number" min="1" max="5" step="0.1" disabled={isViewer} value={order.Product_Rating || 5} onChange={(e) => setOrder({ ...order, Product_Rating: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số Lượng Đánh Giá</label>
                <input type="number" min="0" disabled={isViewer} value={order.Review_Count || 0} onChange={(e) => setOrder({ ...order, Review_Count: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nguồn Traffic</label>
                <input type="text" disabled={isViewer} value={order.Traffic_Source || ''} onChange={(e) => setOrder({ ...order, Traffic_Source: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Creator / KOC</label>
                <input type="text" disabled={isViewer} value={order.Creator_Name || ''} onChange={(e) => setOrder({ ...order, Creator_Name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lượt Xem Video</label>
                <input type="number" min="0" disabled={isViewer} value={order.Video_Views || 0} onChange={(e) => setOrder({ ...order, Video_Views: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50" />
              </div>
            </div>
          </div>

          {!isViewer && (
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold shadow-xl transition-all cursor-pointer">
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