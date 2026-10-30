'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';

interface DataTableProps {
  orders: any[];
  userRole: string;
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
  const canEditOrDelete = userRole !== 'VIEWER';

  // State quản lý Modal xác nhận xóa ở giữa màn hình
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; orderIdText: string } | null>(null);

  const confirmDeleteClick = (id: string, orderIdText: string) => {
    setOrderToDelete({ id, orderIdText });
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = () => {
    if (orderToDelete) {
      onDelete(orderToDelete.id);
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <th className="py-4 px-5">Mã Đơn / Ngày</th>
              <th className="py-4 px-5">Khách Hàng / Thành Phố</th>
              <th className="py-4 px-5">Sản Phẩm & Danh Mục</th>
              <th className="py-4 px-5">Tài Chính (VNĐ)</th>
              <th className="py-4 px-5">Trạng Thái & Rủi Ro</th>
              <th className="py-4 px-5 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  Không tìm thấy đơn hàng nào phù hợp với điều kiện truy vấn.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isAnomaly = order.Is_Anomaly === 1;
                return (
                  <tr key={order._id} className={`hover:bg-slate-800/40 transition ${isAnomaly ? 'bg-rose-950/20' : ''}`}>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white block">{order.Order_ID || 'N/A'}</span>
                        {isAnomaly && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0 animate-pulse" title="Đơn hàng có dấu hiệu nghi ngờ gian lận / bất thường">
                            <AlertTriangle className="w-3 h-3" /> Nghi ngờ gian lận
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{order.Order_Date}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-200 block">{order.Customer_Name}</span>
                      <span className="text-xs text-slate-400">{order.Shipping_City} • <span className="font-mono">{order.Customer_ID}</span></span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-slate-200 block max-w-xs truncate" title={order.Product_Name}>
                        {order.Product_Name}
                      </span>
                      <span className="text-xs text-indigo-400">{order.Main_Category} &gt; {order.Sub_Category}</span>
                    </td>
                    <td className="py-4 px-5 font-bold font-mono text-emerald-400">
                      {Number(order.Total_Amount || 0).toLocaleString('vi-VN')} đ
                      <div className="text-[11px] text-slate-400 font-normal">SL: {order.Quantity} | Ship: {Number(order.Shipping_Fee || 0).toLocaleString('vi-VN')}đ</div>
                    </td>
                    <td className="py-4 px-5 space-y-1.5">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        order.Order_Status === 'Hoàn thành' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        order.Order_Status === 'Đang vận chuyển' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {order.Order_Status}
                      </span>
                      <div className="text-[11px] text-slate-400">Kênh: {order.Traffic_Source || 'N/A'} ({order.Creator_Name || 'N/A'})</div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/orders/${order._id}`}
                          className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-xl transition"
                          title="Xem chi tiết đầy đủ & Chỉnh sửa"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canEditOrDelete && (
                          <button
                            onClick={() => confirmDeleteClick(order._id, order.Order_ID)}
                            className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-xl transition cursor-pointer"
                            title="Xóa đơn hàng"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MODAL XÁC NHẬN XÓA */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-white space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Xác Nhận Xóa Đơn Hàng</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng <strong className="text-indigo-400">{orderToDelete?.orderIdText}</strong> này khỏi hệ thống không?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg transition cursor-pointer"
              >
                Đồng ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thanh phân trang */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-950/60 border-t border-slate-800">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Hiển thị mỗi trang:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            ⬅️ Trang Trước
          </button>
          
          <span className="text-xs font-semibold text-white font-mono px-3 py-1 bg-slate-900 border border-slate-700 rounded-xl">
            Trang {currentPage} / {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            Trang Sau ➡️
          </button>
        </div>
      </div>
    </div>
  );
}