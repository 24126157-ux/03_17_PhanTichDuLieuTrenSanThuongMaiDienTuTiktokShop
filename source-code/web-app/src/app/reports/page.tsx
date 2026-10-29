'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  BarChart3,
  TrendingUp,
  Package,
  ShieldAlert,
  Eye,
  FileSpreadsheet,
  FileText,
  DollarSign,
  PieChart as PieIcon,
  ShoppingBag,
  RefreshCw,
  Sparkles,
  Lock,
  LineChart as LineIcon,
  Filter,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import Protection from '@/components/Protection';

// Import Chart.js & react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  totalAnomalies: number;
  avgVideoViews: number;
  trafficSourceBreakdown: { _id: string; count: number }[];
  orderStatusBreakdown: { _id: string; count: number }[];
  topProducts: { _id: string; totalQuantity: number; totalRevenue: number }[];
  monthlyRevenueTrend?: { month: string; revenue: number }[];
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || 'VIEWER').toUpperCase();

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  // Đọc toàn bộ tham số bộ lọc từ URL Query String
  const searchFilter = searchParams.get('search');
  const statusFilter = searchParams.get('status');
  const paymentFilter = searchParams.get('paymentMethod');
  const categoryFilter = searchParams.get('category');
  const creatorFilter = searchParams.get('creator');
  const cityFilter = searchParams.get('city');
  const shopFilter = searchParams.get('shop');
  const isAnomalyFilter = searchParams.get('isAnomaly');
  const minAmountFilter = searchParams.get('minAmount');
  const maxAmountFilter = searchParams.get('maxAmount');
  const startDateFilter = searchParams.get('startDate');
  const endDateFilter = searchParams.get('endDate');

  const hasFilter = searchParams.toString().length > 0;

  // Hàm định dạng ngày dạng YYYY-MM-DD sang DD/MM/YYYY
  const formatDateVN = (dateStr: string | null) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Hàm xóa trắng toàn bộ bộ lọc, đưa trang về trạng thái ban đầu
  const handleResetFilters = () => {
    try {
      sessionStorage.removeItem('tiktokshop_orders_filters');
      sessionStorage.removeItem('tiktokshop_orders_filter_query');
    } catch (e) {}
    router.push('/reports');
  };

  // Lấy dữ liệu báo cáo từ API kết hợp toàn bộ query parameters
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const queryString = searchParams.toString();
      const res = await fetch(`/api/reports?${queryString}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tự động re-fetch mỗi khi URL searchParams có sự thay đổi
  useEffect(() => {
    fetchReportData();
  }, [searchParams]);

  // Kết xuất file Excel/CSV đồng bộ điều kiện lọc và đọc đúng Tên file từ Header API
  const handleExport = async (format: 'xlsx' | 'csv') => {
    if (role === 'VIEWER') {
      alert('Tài khoản VIEWER không có quyền kết xuất tệp báo cáo!');
      return;
    }

    try {
      setExporting(format);
      const queryString = searchParams.toString();
      const res = await fetch(`/api/export?type=${format}${queryString ? `&${queryString}` : ''}`);
      if (!res.ok) throw new Error('Xuất file thất bại');

      // Lấy tên file động 
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = '';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Dự phòng nếu trình duyệt không lấy được header
      if (!filename) {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        filename = `tiktok_shop_sales_report_${d}-${m}-${y}.${format}`;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename; // Ép tên file đúng định dạng dd-mm-yyyy
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Lỗi trong quá trình kết xuất file báo cáo!');
      console.error(err);
    } finally {
      setExporting(null);
    }
  };

  // Cấu hình Base Theme cho Chart.js
  const chartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'sans-serif', size: 12, weight: 600 as const },
          usePointStyle: false,
          boxWidth: 40,
          boxHeight: 12,
          padding: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: false,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
    },
  };

  // 1. BIỂU ĐỒ TRÒN (Doughnut Chart)
  const filteredTraffic = data?.trafficSourceBreakdown.filter(
    (i) => i._id && !['Khác', 'khac', 'Other', 'other', ''].includes(i._id.trim())
  ) || [];

  const trafficChartData = {
    labels: filteredTraffic.map((i) => i._id),
    datasets: [
      {
        label: 'Số đơn hàng',
        data: filteredTraffic.map((i) => i.count),
        backgroundColor: [
          '#10b981',
          '#6366f1',
          '#f43f5e',
          '#f59e0b',
          '#06b6d4',
        ],
        borderColor: '#0f172a',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...chartOptionsBase.plugins,
      legend: {
        ...chartOptionsBase.plugins.legend,
        padding: 8,
      },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  // 2. BIỂU ĐỒ CỘT (Bar Chart)
  const statusLabels = data?.orderStatusBreakdown.map((i) => i._id || 'Khác') || [];
  const statusCounts = data?.orderStatusBreakdown.map((i) => i.count) || [];

  const colorPalette = ['#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#94a3b8'];

  const statusChartData = {
    labels: ['Trạng thái đơn hàng'],
    datasets: statusLabels.map((statusName, index) => ({
      label: statusName,
      data: [statusCounts[index] || 0],
      backgroundColor: colorPalette[index % colorPalette.length],
      borderRadius: 8,
      borderWidth: 0,
    })),
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'sans-serif', size: 12, weight: 600 as const },
          usePointStyle: false,
          boxWidth: 40,
          boxHeight: 12,
          padding: 8,
        },
      },
      tooltip: chartOptionsBase.plugins.tooltip,
    },
    scales: {
      x: { display: false },
      y: {
        display: true,
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
    },
  };

  // 3. BIỂU ĐỒ ĐƯỜNG (Line Chart)
  const lineChartLabels = data?.monthlyRevenueTrend?.map((i) => i.month) || [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05',
    '2024-06', '2024-07', '2024-08', '2024-09', '2024-10',
  ];

  const lineChartData = {
    labels: lineChartLabels,
    datasets: [
      {
        label: 'Doanh Thu Theo Tháng (VNĐ)',
        data: data?.monthlyRevenueTrend?.map((i) => i.revenue) || [],
        borderColor: '#009990',
        borderWidth: 3,
        backgroundColor: 'rgba(0, 153, 144, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#E66C37',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 2,
      },
    ],
  };

  return (
    <Protection allowedRoles={['ADMIN', 'STAFF', 'VIEWER']}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
         
          {/* HEADER & EXPORT ACTIONS */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/orders?${searchParams.toString()}`)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition"
                title="Quay lại danh sách đơn hàng"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="p-3.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <BarChart3 className="w-7 h-7" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Thống Kê & Kết Xuất Báo Cáo
                  </h1>
                </div>
                <p className="text-xs text-indigo-400 font-mono mt-1">
                  Đang đăng nhập với vai trò: <strong className="uppercase">{role}</strong>
                </p>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Trung tâm phân tích chỉ số kinh doanh, trực quan hóa biểu đồ đa chiều & kết xuất tệp bảng tính từ MongoDB Atlas.
                </p>
              </div>
            </div>

            {/* Nút Xuất File */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={fetchReportData}
                disabled={loading}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {role !== 'VIEWER' ? (
                <>
                  <button
                    onClick={() => handleExport('xlsx')}
                    disabled={exporting !== null}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-emerald-600/20 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>
                      {exporting === 'xlsx' ? 'Đang xuất Excel...' : '📥 Xuất Báo cáo Excel (.xlsx)'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting !== null}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/20 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>
                      {exporting === 'csv' ? 'Đang xuất CSV...' : '📄 Xuất Báo cáo CSV'}
                    </span>
                  </button>
                </>
              ) : (
                <div className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Quyền VIEWER: Chỉ xem thống kê (Không xuất file)</span>
                </div>
              )}
            </div>
          </div>

          {/* BANNER HIỂN THỊ CHI TIẾT CÁC BỘ LỌC ĐANG ÁP DỤNG */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Filter className="w-4 h-4 text-amber-400" />
                <span>Tiêu chí đang áp dụng tính toán số liệu Báo cáo:</span>
              </div>

              {/* NÚT RESET BỘ LỌC TOÀN TRANG */}
              {hasFilter && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
                  title="Xóa toàn bộ bộ lọc, đưa trang báo cáo về trạng thái ban đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!hasFilter ? (
                <span className="text-xs text-slate-500 italic">
                  Hiển thị dữ liệu toàn bộ CSDL (Chưa chọn bộ lọc nào từ Quản lý Đơn hàng)
                </span>
              ) : (
                <>
                  {searchFilter && (
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                      Từ khóa: "{searchFilter}"
                    </span>
                  )}
                  {statusFilter && statusFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                      Trạng thái: {statusFilter}
                    </span>
                  )}
                  {paymentFilter && paymentFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono">
                      Thanh toán: {paymentFilter}
                    </span>
                  )}
                  {categoryFilter && categoryFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono">
                      Ngành hàng: {categoryFilter}
                    </span>
                  )}
                  {creatorFilter && creatorFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-mono">
                      KOC: {creatorFilter}
                    </span>
                  )}
                  {cityFilter && cityFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono">
                      Khu vực: {cityFilter}
                    </span>
                  )}
                  {shopFilter && shopFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
                      Shop: {shopFilter}
                    </span>
                  )}
                  {isAnomalyFilter && isAnomalyFilter !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                      Bất thường: {isAnomalyFilter === '1' ? 'Đơn hàng bất thường (Nghi ngờ gian lận)' : 'Đơn hàng bình thường'}
                    </span>
                  )}
                  {(minAmountFilter || maxAmountFilter) && (
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                      Giá: {minAmountFilter ? `${Number(minAmountFilter).toLocaleString('vi-VN')}đ` : '0đ'} - {maxAmountFilter ? `${Number(maxAmountFilter).toLocaleString('vi-VN')}đ` : '∞'}
                    </span>
                  )}

                  {/* THỜI GIAN THEO ĐỊNH DẠNG DD/MM/YYYY */}
                  {(startDateFilter || endDateFilter) && (
                    <span className="px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-mono">
                      Thời gian: {formatDateVN(startDateFilter) || 'Đầu'} đến {formatDateVN(endDateFilter) || 'Hiện tại'}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {loading || !data ? (
            <div className="text-center py-20 text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold">Đang tổng hợp số liệu Aggregation từ MongoDB Atlas...</p>
            </div>
          ) : (
            <>
              {/* 1. THẺ KPI TỔNG QUAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <DollarSign className="w-20 h-20 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <TrendingUp className="w-5 h-5" />
                    </span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Tổng Doanh Thu
                    </p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                    {data.totalRevenue.toLocaleString('vi-VN')} ₫
                  </p>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <Package className="w-20 h-20 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Package className="w-5 h-5" />
                    </span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Tổng Số Đơn Hàng
                    </p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-indigo-400 tracking-tight">
                    {data.totalOrders.toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-rose-500/40 transition">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <ShieldAlert className="w-20 h-20 text-rose-400" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ca Bất Thường
                    </p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
                    {data.totalAnomalies.toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                    <Eye className="w-20 h-20 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Eye className="w-5 h-5" />
                    </span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Lượt Xem Video TB
                    </p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-purple-300 tracking-tight">
                    {data.avgVideoViews.toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* 2. KHU VỰC BIỂU ĐỒ TRÒN VÀ CỘT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Biểu đồ tròn: Nguồn Traffic */}
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-start">
                  <div className="flex items-center gap-2.5 mb-2">
                    <PieIcon className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      Tỷ Lệ Nguồn Traffic (Traffic Source)
                    </h3>
                  </div>

                  <div className="h-72 relative flex items-center justify-center mt-1">
                    <Doughnut data={trafficChartData} options={doughnutOptions} />
                  </div>
                </div>

                {/* Biểu đồ cột: Trạng thái đơn hàng */}
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-start">
                  <div className="flex items-center gap-2.5 mb-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      Phân Bố Trạng Thái Đơn Hàng (Order Status)
                    </h3>
                  </div>

                  <div className="h-72 relative mt-1">
                    <Bar data={statusChartData} options={barChartOptions} />
                  </div>
                </div>
              </div>

              {/* 3. BIỂU ĐỒ ĐƯỜNG DOANH THU THỰC TẾ THEO THÁNG */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2.5 mb-2">
                  <LineIcon className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Doanh Thu Theo Tháng (by Year-Month)
                  </h3>
                </div>

                <div className="h-72 relative mt-1">
                  <Line data={lineChartData} options={chartOptionsBase} />
                </div>
              </div>

              {/* 4. BẢNG TOP SẢN PHẨM BÁN CHẠY NHẤT */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">
                      Top 5 Sản Phẩm Bán Chạy Nhất (Product Name)
                    </h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800 font-mono">
                      <tr>
                        <th className="px-5 py-3.5">Hạng</th>
                        <th className="px-5 py-3.5">Tên Sản Phẩm</th>
                        <th className="px-5 py-3.5 text-right">Tổng Sản Lượng Bán</th>
                        <th className="px-5 py-3.5 text-right">Tổng Doanh Thu Thu Được</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.topProducts.map((prod, index) => (
                        <tr key={index} className="hover:bg-slate-800/40 transition">
                          <td className="px-5 py-4 font-black">
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : index === 1
                                  ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                                  : index === 2
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-white">
                            {prod._id || 'Sản phẩm khác'}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-indigo-400 font-mono">
                            {prod.totalQuantity.toLocaleString('vi-VN')} món
                          </td>
                          <td className="px-5 py-4 text-right font-black text-emerald-400 font-mono text-base">
                            {prod.totalRevenue.toLocaleString('vi-VN')} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </Protection>
  );
}

export default function ReportsPage() {
  return (
    <Protection allowedRoles={['ADMIN', 'STAFF', 'VIEWER']}>
      <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading...</div>}>
        <ReportContent />
      </Suspense>
    </Protection>
  );
}