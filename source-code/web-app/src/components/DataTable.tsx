'use client';

import React from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Eye, Trash2, AlertTriangle } from 'lucide-react';

interface Order {
  _id: string;
  Order_ID: string;
  Order_Date: string;
  Customer_Name: string;
  Product_Name: string;
  Quantity: number;
  Total_Amount: number;
  Payment_Method: string;
  Order_Status: string;
  Is_Anomaly: number;
}

interface DataTableProps {
  orders: Order[];
  userRole?: string;
  currentPage: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onDelete: (id: string) => void;
}

export default function DataTable({
  orders,
  userRole,
  currentPage,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
  onDelete,
}: DataTableProps) {

  const confirmAndDelete = (order: Order) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-800">Cảnh báo xóa đơn hàng</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng <strong className="text-indigo-600 font-mono">{order.Order_ID}</strong>?
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Hủy
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await onDelete(order._id);
              toast.success(`Đã xóa đơn hàng ${order.Order_ID} thành công!`, {
                duration: 4000,
                style: { background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' },
                icon: '🗑️',
              });
            }}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md transition"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px' },
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
      <Toaster position="top-right" />
      
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead className="bg-slate-950/90 text-slate-300 border-b border-slate-800">
            <tr>
              <th className="px-3 py-3 font-bold uppercase tracking-wider text-left">Mã Đơn</th>
              <th className="px-2.5 py-3 font-bold uppercase tracking-wider text-left">Ngày Đặt</th>
              <th className="px-2.5 py-3 font-bold uppercase tracking-wider text-left">Khách Hàng</th>
              <th className="px-2.5 py-3 font-bold uppercase tracking-wider text-left max-w-[200px]">Sản Phẩm</th>
              <th className="px-2 py-3 font-bold uppercase tracking-wider text-center">SL</th>
              <th className="px-2.5 py-3 font-bold uppercase tracking-wider text-right">Tổng Tiền</th>
              <th className="px-2.5 py-3 font-bold uppercase tracking-wider text-center">Thanh Toán</th>
              <th className="px-2.5 py-3 font-bold uppercase tracking-wider text-center">Trạng Thái</th>
              <th className="px-3 py-3 font-bold uppercase tracking-wider text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-medium">
                  Không tìm thấy dữ liệu đơn hàng phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isAnomaly = order.Is_Anomaly === 1;
                return (
                  <tr
                    key={order._id}
                    className={`transition-colors ${
                      isAnomaly ? 'bg-amber-950/20 hover:bg-amber-900/30' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-3 py-3 font-bold font-mono text-indigo-400 whitespace-nowrap">
                      <Link href={`/orders/${order._id}`} className="hover:underline">
                        {order.Order_ID}
                      </Link>
                      {isAnomaly && (
                        <span className="block mt-0.5 text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-sans font-bold w-fit">
                          ⚠️ Bất thường
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-3 text-slate-300 whitespace-nowrap text-xs">
                      {order.Order_Date ? order.Order_Date.slice(0, 10) : 'N/A'}
                    </td>
                    <td className="px-2.5 py-3 text-slate-100 font-medium whitespace-nowrap max-w-[130px] truncate">
                      {order.Customer_Name}
                    </td>
                    <td className="px-2.5 py-3 text-slate-300 truncate max-w-[180px]" title={order.Product_Name}>
                      {order.Product_Name}
                    </td>
                    <td className="px-2 py-3 text-center text-white font-mono font-bold">{order.Quantity}</td>
                    <td className="px-2.5 py-3 text-right font-bold text-emerald-400 font-mono whitespace-nowrap">
                      {(order.Total_Amount || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-2.5 py-3 text-center text-slate-300 text-xs whitespace-nowrap max-w-[140px] truncate" title={order.Payment_Method}>
                      {order.Payment_Method}
                    </td>
                    <td className="px-2.5 py-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border inline-block ${
                          order.Order_Status === 'Hoàn thành'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : order.Order_Status === 'Đã hủy'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : order.Order_Status === 'Đang vận chuyển'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {order.Order_Status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/orders/${order._id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
                          title="Xem & Chỉnh sửa chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </Link>
                        {userRole !== 'VIEWER' && (
                          <button
                            onClick={() => confirmAndDelete(order)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
                            title="Xóa đơn hàng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 gap-4">
        <div className="flex items-center space-x-3 text-xs text-slate-300">
          <span>Hiển thị:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={10}>10 dòng/trang</option>
            <option value={20}>20 dòng/trang</option>
            <option value={50}>50 dòng/trang</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trang Trước</span>
          </button>

          <span className="text-xs text-slate-200 font-medium px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg">
            Trang <strong className="text-indigo-400 font-mono text-sm">{currentPage}</strong> / {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
          >
            <span>Trang Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}