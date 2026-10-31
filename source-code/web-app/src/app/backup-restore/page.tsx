"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Download,
  Upload,
  ShieldCheck,
  FileJson,
  AlertTriangle,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Protection from "@/components/Protection";

export default function BackupRestorePage() {
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // SAO LƯU DỮ LIỆU
  async function handleBackup() {
    setLoadingBackup(true);
    const toastId = toast.loading("Đang khởi tạo file sao lưu JSON...");

    try {
      const response = await fetch("/api/backup");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Không thể sao lưu dữ liệu.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `tiktok_orders_backup_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      toast.success("Đã tải file backup JSON thành công.", { id: toastId });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi sao lưu dữ liệu.",
        { id: toastId }
      );
    } finally {
      setLoadingBackup(false);
    }
  }

  // MỞ MODAL XÁC NHẬN PHỤC HỒI
  function handleRestore() {
    if (!file) {
      toast.error("Vui lòng chọn file JSON trước.");
      return;
    }

    setShowConfirm(true);
  }

  // THỰC HIỆN PHỤC HỒI (ĐÃ TỐI ƯU HIỂN THỊ TOAST TỨC THỜI & ĐÓNG MODAL NGAY)
  async function confirmRestore() {
    if (!file) {
      toast.error("Vui lòng chọn file JSON trước.");
      setShowConfirm(false);
      return;
    }

    // Đóng Modal xác nhận ngay lập tức để giải phóng giao diện
    setShowConfirm(false);
    setLoadingRestore(true);

    // Kích hoạt thông báo Loading tức thì
    const toastId = toast.loading("Đang tải dữ liệu và phục hồi vào MongoDB Atlas...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/backup", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể phục hồi dữ liệu.");
      }

      // Cập nhật thông báo Toast Loading thành Thành công tức thì
      toast.success(
        `Phục hồi hoàn tất! Đã nhận ${data.received} bản ghi, thêm ${data.inserted}, cập nhật ${data.updated}.`,
        { id: toastId, duration: 5000 }
      );

      setFile(null);

      const input = document.getElementById(
        "backup-file"
      ) as HTMLInputElement | null;

      if (input) input.value = "";
    } catch (err) {
      // Nếu có lỗi, cập nhật Toast Loading thành Báo lỗi tức thì
      toast.error(
        err instanceof Error ? err.message : "Lỗi phục hồi dữ liệu.",
        { id: toastId, duration: 5000 }
      );
    } finally {
      setLoadingRestore(false);
    }
  }

  return (
    <Protection allowedRoles={["ADMIN"]}>
      <main className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased py-10 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* TIÊU ĐỀ TRANG */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <Database className="w-8 h-8 text-indigo-400" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold tracking-wider text-indigo-400">
                    ADMIN ONLY
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Sao lưu & Phục hồi dữ liệu
                </h1>

                <p className="text-sm text-slate-400 mt-1">
                  Quản lý bản sao lưu dữ liệu giao dịch MongoDB Atlas.
                </p>
              </div>
            </div>

            <Link
              href="/orders"
              onClick={() => toast.dismiss()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay về đơn hàng
            </Link>
          </div>

          {/* GIỚI THIỆU */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white">
                Quản lý an toàn dữ liệu
              </h2>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              Chức năng cho phép quản trị viên sao lưu toàn bộ dữ liệu
              giao dịch từ MongoDB Atlas thành file JSON và phục hồi dữ
              liệu từ file backup đã lưu trước đó.
            </p>
          </section>

          {/* KHU VỰC BACKUP VÀ RESTORE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* SAO LƯU */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <Download className="w-7 h-7 text-indigo-400" />
                </div>

                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
                  BACKUP
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  1. Sao lưu dữ liệu
                </h2>

                <p className="text-sm text-slate-400 leading-6">
                  Xuất toàn bộ bản ghi giao dịch hiện có từ MongoDB
                  Atlas thành một file JSON để lưu trữ và sử dụng
                  khi cần phục hồi.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex items-center gap-3">
                <FileJson className="w-8 h-8 text-indigo-400 shrink-0" />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200">
                    Định dạng JSON
                  </p>
                  <p className="text-xs text-slate-500">
                    tiktok_orders_backup_YYYY-MM-DD.json
                  </p>
                </div>
              </div>

              <button
                onClick={handleBackup}
                disabled={loadingBackup || loadingRestore}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />

                {loadingBackup
                  ? "Đang sao lưu..."
                  : "Tải file Backup JSON"}
              </button>
            </section>

            {/* PHỤC HỒI */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                  <Upload className="w-7 h-7 text-violet-400" />
                </div>

                <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
                  RESTORE
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  2. Phục hồi dữ liệu
                </h2>

                <p className="text-sm text-slate-400 leading-6">
                  Tải lên file JSON backup đã lưu để thêm mới hoặc
                  cập nhật các bản ghi tương ứng trong MongoDB Atlas.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                <label
                  htmlFor="backup-file"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Chọn file backup JSON
                </label>

                <input
                  id="backup-file"
                  type="file"
                  accept=".json,application/json"
                  disabled={loadingRestore}
                  onChange={(event) =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-indigo-500 file:cursor-pointer disabled:opacity-50"
                />

                {file && (
                  <div className="flex items-start gap-2 text-xs text-emerald-400">
                    <FileJson className="w-4 h-4 shrink-0" />

                    <div className="min-w-0 break-all">
                      <p>{file.name}</p>
                      <p className="text-slate-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleRestore}
                disabled={loadingRestore || loadingBackup || !file}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />

                {loadingRestore
                  ? "Đang phục hồi..."
                  : "Phục hồi từ JSON"}
              </button>
            </section>
          </div>

          {/* LƯU Ý */}
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />

            <div>
              <h3 className="text-sm font-bold text-amber-300 mb-1">
                Lưu ý khi phục hồi dữ liệu
              </h3>

              <p className="text-sm text-slate-400 leading-6">
                Hãy kiểm tra file JSON và lưu một bản backup hiện tại
                trước khi thực hiện phục hồi. Quá trình phục hồi có
                thể cập nhật các bản ghi đã tồn tại trong cơ sở dữ liệu.
              </p>
            </div>
          </section>
        </div>

        {/* MODAL XÁC NHẬN PHỤC HỒI */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-500/10 p-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Xác nhận phục hồi
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                      Thao tác với MongoDB Atlas
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm text-slate-300 leading-6">
                  Bạn đang chuẩn bị phục hồi dữ liệu từ file:
                </p>

                <p className="text-sm font-semibold text-amber-300 mt-2 break-all">
                  {file?.name}
                </p>

                <p className="text-sm text-slate-400 mt-3 leading-6">
                  Các bản ghi có cùng MongoDB ObjectId sẽ được cập
                  nhật. Hãy chắc chắn bạn đã có bản backup hiện tại
                  trước khi tiếp tục.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition"
                >
                  Hủy
                </button>

                <button
                  onClick={confirmRestore}
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition"
                >
                  Xác nhận phục hồi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CẤU HÌNH TOASTER */}
        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid #334155",
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />
      </main>
    </Protection>
  );
}