"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Crown,
  Briefcase,
  Eye,
  LogOut,
  LogIn,
  Package,
  Database,
  BarChart3,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Không hiển thị Navbar trên trang login
  if (pathname === "/login") {
    return null;
  }

  const role = ((session?.user as any)?.role || "VIEWER").toUpperCase();

  // Xử lý chuyển hướng sang trang Report kèm thông số bộ lọc đã lưu từ sessionStorage
  const handleReportsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      const savedFilters = sessionStorage.getItem("tiktokshop_orders_filter_query");
      if (savedFilters) {
        router.push(`/reports?${savedFilters}`);
      } else {
        router.push("/reports");
      }
    } catch (err) {
      router.push("/reports");
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3 text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-6">
          <Link href="/orders" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              TT
            </div>
            <div>
              <div className="font-black text-sm tracking-wide uppercase flex items-center gap-1.5">
                <span>TikTok Shop Portal</span>
              </div>
              <p className="text-[10px] text-indigo-400 font-mono">
                ABDA433708 • Nhóm 17
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            {/* Đơn hàng */}
            <Link
              href="/orders"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                pathname === "/orders"
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Đơn hàng (/orders)</span>
            </Link>

            {/* Thống kê - Cho phép mở báo cáo theo bộ lọc đã lưu */}
            <a
              href="/reports"
              onClick={handleReportsClick}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition cursor-pointer ${
                pathname === "/reports"
                  ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thống kê (/reports)</span>
            </a>

            {/* Sao lưu (Chỉ Admin) */}
            <Link
              href="/backup-restore"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                pathname === "/backup-restore"
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Sao lưu (/backup-restore)</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                Admin
              </span>
            </Link>
          </nav>
        </div>

        {/* User Status / Role Badge / Logout */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="flex items-center gap-3">
              {/* User Name & Email */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white">
                  {session.user.name || (session.user as any).username}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(session.user as any).email}
                </span>
              </div>

              {/* ROLE BADGE */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${
                  role === "ADMIN"
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                    : role === "STAFF"
                    ? "bg-blue-500/20 text-blue-300 border-blue-400/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                }`}
                title={`Vai trò người dùng: ${role}`}
              >
                {role === "ADMIN" && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                {role === "STAFF" && <Briefcase className="w-3.5 h-3.5 text-blue-400" />}
                {role === "VIEWER" && <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{role}</span>
              </span>

              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 transition text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}