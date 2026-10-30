'use client';
// web-app/src/app/orders/[id]/page.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { Package, User, ShoppingBag, DollarSign, Activity, ArrowLeft, Save, AlertCircle, Lock, Store } from 'lucide-react';

const VIETNAM_CITIES = [
  'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai', 'Cần Thơ', 'Hải Phòng',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre',
  'Bình Định', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắc Lắk', 'Đắc Nông',
  'Điện Biên', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương',
  'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình',
  'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh',
  'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa',
  'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

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
          let rawDate = data.data.Order_Date || '';
          if (rawDate.includes(' ')) {
            rawDate = rawDate.replace(' ', 'T').slice(0, 16);
          }
          setOrder({ ...data.data, Order_Date: rawDate });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleFinancialChange = (field: string, value: number) => {
    if (!order) return;
    const updated = { ...order, [field]: value };
    const price = Number(updated.Unit_Price) || 0;
    const qty = Number(updated.Quantity) || 0;
    const discount = Number(updated.Discount_Amount) || 0;
    const ship = Number(updated.Shipping_Fee) || 0;
    const total = price * qty - discount + ship;
    updated.Total_Amount = total >= 0 ? total : 0;
    setOrder(updated);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!order.Customer_ID?.trim()) return setErrorMsg('Mã khách hàng là bắt buộc nhập!');
    const customerIdRegex = /^CUST-\d{5}$/;
    if (!customerIdRegex.test(order.Customer_ID.trim())) {
      return setErrorMsg('Mã khách hàng không đúng định dạng! Yêu cầu: CUST- kèm đúng 5 chữ số (Ví dụ: CUST-01053).');
    }

    if (!order.Customer_Name?.trim()) return setErrorMsg('Tên khách hàng không được để trống.');

    if (!order.Product_ID?.trim()) return setErrorMsg('Mã sản phẩm là bắt buộc nhập!');
    const productIdRegex = /^PROD-[A-Za-z0-9_-]+$/;
    if (!productIdRegex.test(order.Product_ID.trim())) {
      return setErrorMsg('Mã sản phẩm không đúng định dạng! Yêu cầu dạng PROD-xxx (Ví dụ: PROD-T02).');
    }

    if (!order.Product_Name?.trim()) return setErrorMsg('Tên sản phẩm không được để trống.');

    if (!order.Shipping_City?.trim()) {
      return setErrorMsg('Thành phố giao hàng là bắt buộc, vui lòng chọn tỉnh/thành phố!');
    }

    const priceNum = Number(order.Unit_Price);
    if (!order.Unit_Price || isNaN(priceNum) || priceNum <= 0) {
      return setErrorMsg('Đơn giá sản phẩm là bắt buộc và phải lớn hơn 0.');
    }

    const ageNum = Number(order.Customer_Age);
    if (!order.Customer_Age || isNaN(ageNum) || ageNum <= 0) {
      return setErrorMsg('Tuổi khách hàng phải là số nguyên dương lớn hơn 0.');
    }

    if (Number(order.Quantity) <= 0) return setErrorMsg('Số lượng phải lớn hơn 0.');

    setSaving(true);

    try {
      const formattedDate = order.Order_Date ? order.Order_Date.replace('T', ' ') + ':00' : '';
      const payload = {
        ...order,
        Order_Date: formattedDate,
        Customer_Age: Number(order.Customer_Age),
        Unit_Price: priceNum,
        Quantity: Number(order.Quantity) || 1,
        Discount_Amount: Number(order.Discount_Amount) || 0,
        Shipping_Fee: Number(order.Shipping_Fee) || 0,
        Total_Amount: Number(order.Total_Amount) || 0,
        Product_Rating: Number(order.Product_Rating) || 5,
        Review_Count: Number(order.Review_Count) || 0,
        Video_Views: Number(order.Video_Views) || 0,
      };

      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã lưu cập nhật đơn hàng ${order.Order_ID} thành công!`, { duration: 4000 });
        setOrder({
          ...data.data,
          Order_Date: data.data.Order_Date ? data.data.Order_Date.replace(' ', 'T').slice(0, 16) : ''
        });
      } else {
        setErrorMsg(data.message || 'Dữ liệu không hợp lệ.');
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối máy chủ (${err.message}).`);
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
        <p className="text-rose-400 font-bold text-xl">Không tìm thấy thông tin đơn hàng!</p>
        <button onClick={() => router.push('/orders')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg">
          Quay lại danh sách đơn hàng
        </button>
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
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Chi tiết Đơn hàng: <span className="text-indigo-400 font-mono">{order.Order_ID}</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">MongoDB ID: {order._id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/orders')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition border border-slate-700/60 shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/90 text-red-200 rounded-2xl border-2 border-red-500 text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4" /> 1. Thông tin Giao dịch & Vận hành
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  Mã Đơn Hàng (Order_ID) <Lock className="w-3 h-3 text-amber-400 inline" />
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={order.Order_ID || ''}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thời Gian Đặt Hàng</label>
                <input
                  type="datetime-local"
                  value={order.Order_Date || ''}
                  onChange={(e) => setOrder({ ...order, Order_Date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trạng Thái Đơn Hàng</label>
                <select
                  value={order.Order_Status || ''}
                  onChange={(e) => setOrder({ ...order, Order_Status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Đang vận chuyển">Đang vận chuyển</option>
                  <option value="Đã hủy">Đã hủy</option>
                  <option value="Hoàn trả / Khiếu nại">Hoàn trả / Khiếu nại</option>
                  <option value="Giao không thành công">Giao không thành công</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cảnh Báo Bất Thường</label>
                <select
                  value={order.Is_Anomaly ?? 0}
                  onChange={(e) => setOrder({ ...order, Is_Anomaly: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>0 - Bình thường</option>
                  <option value={1}>1 - Bất thường / Nghi ngờ gian lận</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phương Thức Thanh Toán</label>
                <select
                  value={order.Payment_Method || ''}
                  onChange={(e) => setOrder({ ...order, Payment_Method: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="COD (Thanh toán khi nhận hàng)">COD (Thanh toán khi nhận hàng)</option>
                  <option value="Ví điện tử (ZaloPay/Momo)">Ví điện tử (ZaloPay/Momo)</option>
                  <option value="Chuyển khoản QR">Chuyển khoản QR</option>
                  <option value="Thẻ tín dụng / Ghi nợ">Thẻ tín dụng / Ghi nợ</option>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mã KH (Customer_ID) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={order.Customer_ID || ''}
                  onChange={(e) => setOrder({ ...order, Customer_ID: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                  placeholder="Ví dụ: CUST-01053"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên Khách Hàng <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={order.Customer_Name || ''}
                  onChange={(e) => setOrder({ ...order, Customer_Name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tuổi Khách Hàng</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    value={order.Customer_Age || ''}
                    onChange={(e) => setOrder({ ...order, Customer_Age: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    placeholder="Tuổi"
                  />
                  <select
                    value={order.Customer_Gender || 'Khác'}
                    onChange={(e) => setOrder({ ...order, Customer_Gender: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Thành Phố Giao Hàng <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={order.Shipping_City || ''}
                  onChange={(e) => setOrder({ ...order, Shipping_City: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn Tỉnh / Thành phố --</option>
                  {VIETNAM_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Loại Thiết Bị</label>
                <select
                  value={order.Device_Type || 'Mobile (Android)'}
                  onChange={(e) => setOrder({ ...order, Device_Type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="Mobile (Android)">Mobile (Android)</option>
                  <option value="Mobile (iOS)">Mobile (iOS)</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Desktop/PC">Desktop/PC</option>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mã Sản Phẩm (Product_ID) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={order.Product_ID || ''}
                  onChange={(e) => setOrder({ ...order, Product_ID: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                  placeholder="Ví dụ: PROD-T02"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên Sản Phẩm <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={order.Product_Name || ''}
                  onChange={(e) => setOrder({ ...order, Product_Name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Danh Mục Chính & Phụ</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={order.Main_Category || 'Thời trang nữ'}
                    onChange={(e) => setOrder({ ...order, Main_Category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white"
                  >
                    <option value="Thời trang nữ">Thời trang nữ</option>
                    <option value="Thời trang nam">Thời trang nam</option>
                    <option value="Làm đẹp & Chăm sóc cá nhân">Làm đẹp & Chăm sóc cá nhân</option>
                    <option value="Phụ kiện công nghệ">Phụ kiện công nghệ</option>
                    <option value="Đồ gia dụng & Đời sống">Đồ gia dụng & Đời sống</option>
                    <option value="Đồ ăn vặt & Thực phẩm">Đồ ăn vặt & Thực phẩm</option>
                  </select>
                  <input
                    type="text"
                    value={order.Sub_Category || ''}
                    onChange={(e) => setOrder({ ...order, Sub_Category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                    placeholder="Danh mục phụ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Đơn Giá<span className="text-rose-400">*</span> & Số Lượng
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={order.Unit_Price || ''}
                    onChange={(e) => handleFinancialChange('Unit_Price', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                  <input
                    type="number"
                    min="1"
                    value={order.Quantity || 1}
                    onChange={(e) => handleFinancialChange('Quantity', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Giảm Giá & Phí Ship</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    value={order.Discount_Amount || 0}
                    onChange={(e) => handleFinancialChange('Discount_Amount', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                  <input
                    type="number"
                    min="0"
                    value={order.Shipping_Fee || 0}
                    onChange={(e) => handleFinancialChange('Shipping_Fee', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-1.5">Tổng Tiền (Total_Amount)</label>
                <input
                  type="number"
                  min="0"
                  readOnly
                  value={order.Total_Amount || 0}
                  className="w-full bg-indigo-950/40 border border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-sm text-indigo-300 font-bold font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
              <Store className="w-4 h-4" /> 4. Cửa Hàng, Marketing & Đánh Giá
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Shop & Tên Shop</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={order.Shop_ID || ''}
                    onChange={(e) => setOrder({ ...order, Shop_ID: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white font-mono"
                    placeholder="SHOP-001"
                  />
                  <input
                    type="text"
                    value={order.Shop_Name || ''}
                    onChange={(e) => setOrder({ ...order, Shop_Name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white"
                    placeholder="Tên Shop"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nguồn Traffic & Creator</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={order.Traffic_Source || ''}
                    onChange={(e) => setOrder({ ...order, Traffic_Source: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white"
                    placeholder="Traffic Source"
                  />
                  <input
                    type="text"
                    value={order.Creator_Name || ''}
                    onChange={(e) => setOrder({ ...order, Creator_Name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white"
                    placeholder="Tên KOL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rating / Review / Video Views</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={order.Product_Rating ?? 5}
                    onChange={(e) => setOrder({ ...order, Product_Rating: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2.5 text-xs text-white"
                    placeholder="Rating"
                  />
                  <input
                    type="number"
                    min="0"
                    value={order.Review_Count ?? 0}
                    onChange={(e) => setOrder({ ...order, Review_Count: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2.5 text-xs text-white"
                    placeholder="Reviews"
                  />
                  <input
                    type="number"
                    min="0"
                    value={order.Video_Views ?? 0}
                    onChange={(e) => setOrder({ ...order, Video_Views: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2.5 text-xs text-white"
                    placeholder="Views"
                  />
                </div>
              </div>
            </div>
          </div>

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
        </form>
      </div>
    </div>
  );
}