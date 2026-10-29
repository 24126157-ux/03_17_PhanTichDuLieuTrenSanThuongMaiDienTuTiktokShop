"use client";


import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";


interface ProtectionProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // ví dụ: ["ADMIN"], ["ADMIN", "STAFF"], ["ADMIN", "STAFF", "VIEWER"]
  fallback?: React.ReactNode;
}


export default function Protection({
  children,
  allowedRoles,
  fallback,
}: ProtectionProps) {
  const { data: session, status } = useSession();


  // 1. Đang tải phiên đăng nhập
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 text-sm font-medium">Đang xác thực quyền truy cập...</p>
      </div>
    );
  }


  // 2. Chưa đăng nhập
  if (status === "unauthenticated" || !session?.user) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          Yêu cầu đăng nhập
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
          Bạn cần đăng nhập vào hệ thống để truy cập vào chức năng này.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }


  // 3. Đã đăng nhập - Lấy vai trò hiện tại (mặc định là VIEWER nếu không tìm thấy)
  const currentRole = ((session.user as any)?.role || "VIEWER").toUpperCase();


  // Kiểm tra nếu allowedRoles được truyền vào và có phần tử
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
    const hasPermission = normalizedAllowed.includes(currentRole);


    if (!hasPermission) {
      if (fallback) return <>{fallback}</>;
      return (
        <div className="max-w-lg mx-auto my-16 p-8 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            Không đủ quyền truy cập
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
            Trang này chỉ dành cho vai trò:{" "}
            <strong className="text-indigo-600 dark:text-indigo-400">
              {normalizedAllowed.join(", ")}
            </strong>
            . Vai trò hiện tại của bạn là:{" "}
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-semibold text-zinc-800 dark:text-zinc-200">
              {currentRole}
            </span>
            .
          </p>
          <p className="text-xs text-zinc-500 mb-6">
            Hệ thống phân quyền Role-Based Access Control (RBAC)
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay về Trang Đơn hàng
          </Link>
        </div>
      );
    }
  }


  return <>{children}</>;
}


// Hook tiện ích để kiểm tra quyền trong các nút bấm (Thêm/Sửa/Xóa/Xuất file)
export function useHasPermission(allowedRoles: string[]) {
  const { data: session } = useSession();
  if (!session?.user) return false;
  const currentRole = ((session.user as any)?.role || "VIEWER").toUpperCase();
  const normalized = allowedRoles.map((r) => r.toUpperCase());
  return normalized.includes(currentRole);
}
