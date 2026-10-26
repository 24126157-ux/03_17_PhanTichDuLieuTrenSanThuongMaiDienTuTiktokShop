'use client';

import React from 'react';
import Link from 'next/link';

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
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã Đơn</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Ngày Đặt</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Khách Hàng</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Sản Phẩm</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">SL</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Tổng Tiền</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Thanh Toán</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Trạng Thái</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  Không tìm thấy dữ liệu đơn hàng phù hợp.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isAnomaly = order.Is_Anomaly === 1;
                return (
                  <tr
                    key={order._id}
                    className={`transition-colors ${
                      isAnomaly ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link href={`/orders/${order._id}`} className="text-blue-600 hover:underline">
                        {order.Order_ID}
                      </Link>
                      {isAnomaly && (
                        <span className="block mt-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold w-fit">
                          ⚠️ Nghi ngờ gian lận
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(order.Order_Date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 text-gray-900">{order.Customer_Name}</td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{order.Product_Name}</td>
                    <td className="px-4 py-3 text-center text-gray-900">{order.Quantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {order.Total_Amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{order.Payment_Method}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.Order_Status === 'Hoàn thành'
                            ? 'bg-green-100 text-green-800'
                            : order.Order_Status === 'Đã hủy'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.Order_Status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <Link
                        href={`/orders/${order._id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                      >
                        Xem
                      </Link>
                      {userRole !== 'VIEWER' && (
                        <button
                          onClick={() => onDelete(order._id)}
                          className="text-red-600 hover:text-red-800 text-xs font-semibold"
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh Phân trang & Tùy chọn số dòng */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Hiển thị:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>dòng / trang</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 border rounded text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Trước
          </button>
          <span className="text-sm text-gray-700">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border rounded text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}