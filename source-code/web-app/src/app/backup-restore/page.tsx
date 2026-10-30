
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Download, Upload, CheckCircle2 } from "lucide-react";
import Protection from "@/components/Protection";

export default function BackupRestorePage() {
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleBackup() {
    setLoadingBackup(true);
    setMessage("");
    setError("");

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
      link.download = `tiktok_orders_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage("Đã tải file backup JSON thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi sao lưu.");
    } finally {
      setLoadingBackup(false);
    }
  }

  async function handleRestore() {
    if (!file) {
      setError("Vui lòng chọn file JSON trước.");
      return;
    }

    const confirmed = window.confirm(
      "Bạn sắp phục hồi dữ liệu vào MongoDB Atlas. Hãy chắc chắn đã có bản backup hiện tại. Tiếp tục?"
    );

    if (!confirmed) return;

    setLoadingRestore(true);
    setMessage("");
    setError("");

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

      setMessage(
        `Phục hồi hoàn tất. Đã nhận ${data.received} bản ghi, thêm ${data.inserted}, cập nhật ${data.updated}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi phục hồi.");
    } finally {
      setLoadingRestore(false);
    }
  }

  return (
    <Protection allowedRoles={["ADMIN"]}>
      <main className="max-w-4xl mx-auto py-10 px-4">
        <section className="rounded-3xl border border-amber-500/30 bg-slate-950/80 p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Database className="w-10 h-10 text-amber-400" />
            <div>
              <p className="text-xs font-bold text-amber-400">
                ADMIN ONLY
              </p>
              <h1 className="text-2xl font-black text-white">
                Sao lưu & Phục hồi dữ liệu
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-300">
            Sao lưu dữ liệu giao dịch từ MongoDB Atlas thành JSON hoặc phục hồi
            từ file JSON đã lưu.
          </p>

          {message && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-emerald-300">
              <CheckCircle2 className="inline w-5 h-5 mr-2" />
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-300">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-700 p-5 space-y-3">
            <h2 className="text-lg font-bold text-white">1. Sao lưu dữ liệu</h2>
            <p className="text-sm text-slate-400">
              Tải toàn bộ bản ghi hiện có thành file JSON.
            </p>
            <button
              onClick={handleBackup}
              disabled={loadingBackup}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {loadingBackup ? "Đang sao lưu..." : "Tải file Backup JSON"}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-700 p-5 space-y-4">
            <h2 className="text-lg font-bold text-white">2. Phục hồi dữ liệu</h2>
            <p className="text-sm text-slate-400">
              Chọn file JSON backup để thêm hoặc cập nhật bản ghi trong MongoDB.
            </p>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-300"
            />
            {file && (
              <p className="text-xs text-slate-400">
                File đã chọn: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <button
              onClick={handleRestore}
              disabled={loadingRestore || !file}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              {loadingRestore ? "Đang phục hồi..." : "Phục hồi từ JSON"}
            </button>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay về trang đơn hàng
          </Link>
        </section>
      </main>
    </Protection>
  );
}
