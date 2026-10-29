import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // 1. Kết nối cơ sở dữ liệu MongoDB Atlas
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    // 2. Trích xuất thông số bộ lọc từ URL Query Params & Kiểu xuất (xlsx hoặc csv)
    const exportType = (searchParams.get('type') || searchParams.get('format') || 'xlsx').toLowerCase();
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const category = searchParams.get('category') || searchParams.get('mainCategory') || '';
    const creator = searchParams.get('creator') || '';
    const city = searchParams.get('city') || '';
    const shop = searchParams.get('shop') || '';
    const isAnomaly = searchParams.get('isAnomaly') || '';
    const minAmount = searchParams.get('minAmount') || '';
    const maxAmount = searchParams.get('maxAmount') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // 3. Xây dựng $match Filter động
    const matchFilter: any = {};
    const activeFiltersList: string[] = [];

    if (search.trim()) {
      const keyword = search.trim();
      matchFilter.$or = [
        { Order_ID: { $regex: keyword, $options: 'i' } },
        { Customer_Name: { $regex: keyword, $options: 'i' } },
        { Product_Name: { $regex: keyword, $options: 'i' } },
      ];
      activeFiltersList.push(`Từ khóa search: "${keyword}"`);
    }

    if (status && status !== 'ALL' && status !== 'undefined') {
      matchFilter.Order_Status = status;
      activeFiltersList.push(`Trạng thái: ${status}`);
    }
    if (paymentMethod && paymentMethod !== 'ALL' && paymentMethod !== 'undefined') {
      matchFilter.Payment_Method = paymentMethod;
      activeFiltersList.push(`Thanh toán: ${paymentMethod}`);
    }
    if (category && category !== 'ALL' && category !== 'undefined') {
      matchFilter.Main_Category = category;
      activeFiltersList.push(`Ngành hàng: ${category}`);
    }
    if (creator && creator !== 'ALL' && creator !== 'undefined') {
      matchFilter.Creator_Name = creator;
      activeFiltersList.push(`KOC/Creator: ${creator}`);
    }
    if (city && city !== 'ALL' && city !== 'undefined') {
      matchFilter.Shipping_City = city;
      activeFiltersList.push(`Khu vực: ${city}`);
    }
    if (shop && shop !== 'ALL' && shop !== 'undefined') {
      matchFilter.Shop_Name = shop;
      activeFiltersList.push(`Gian hàng: ${shop}`);
    }

    if (isAnomaly !== '' && isAnomaly !== 'ALL' && isAnomaly !== 'undefined') {
      const parsedAnomaly = parseInt(isAnomaly, 10);
      if (!isNaN(parsedAnomaly)) {
        matchFilter.Is_Anomaly = parsedAnomaly;
        activeFiltersList.push(`Phân loại bất thường: ${parsedAnomaly === 1 ? 'Đơn bất thường (1)' : 'Đơn hợp lệ (0)'}`);
      }
    }

    if (minAmount || maxAmount) {
      matchFilter.Total_Amount = {};
      if (minAmount) matchFilter.Total_Amount.$gte = parseFloat(minAmount);
      if (maxAmount) matchFilter.Total_Amount.$lte = parseFloat(maxAmount);
      activeFiltersList.push(`Khoảng tiền: ${minAmount || '0'} - ${maxAmount || 'Vô cùng'} VNĐ`);
    }

    if (startDate || endDate) {
      matchFilter.Order_Date = {};
      if (startDate) matchFilter.Order_Date.$gte = startDate;
      if (endDate) matchFilter.Order_Date.$lte = endDate + ' 23:59:59';
      const formatDateVN = (dateStr: string) => dateStr ? dateStr.split('-').reverse().join('/') : '';
      activeFiltersList.push(`Thời gian: ${formatDateVN(startDate) || 'Từ trước'} đến ${formatDateVN(endDate) || 'Hiện tại'}`);
    }

    // Kiểm tra trạng thái lọc
    const isFiltered = activeFiltersList.length > 0;
    const filterSuffix = isFiltered ? ' (ĐÃ LỌC)' : '';
    const filterDescriptionText = isFiltered 
      ? activeFiltersList.join(' | ') 
      : 'Không có (Toàn bộ dữ liệu)';

    // 4. Truy vấn tính toán 4 giá trị Thẻ KPI trên tập dữ liệu đã lọc qua Aggregation Pipeline
    const kpiAggregation = await Order.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          kpiMetrics: [
            {
              $group: {
                _id: null,
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $regexMatch: { input: '$Order_Status', regex: /Hoàn thành|Completed/i } },
                      '$Total_Amount',
                      0,
                    ],
                  },
                },
                totalOrders: { $sum: 1 },
              },
            },
          ],
          anomalyMetrics: [
            { $match: { Is_Anomaly: 1 } },
            { $count: 'count' },
          ],
          viewsMetrics: [
            {
              $group: {
                _id: null,
                avgVideoViews: { $avg: '$Video_Views' },
              },
            },
          ],
        },
      },
    ]);

    const kpiResult = kpiAggregation[0];
    const totalRevenueVal = kpiResult?.kpiMetrics[0]?.totalRevenue || 0;
    const totalOrdersVal = kpiResult?.kpiMetrics[0]?.totalOrders || 0;
    const totalAnomaliesVal = kpiResult?.anomalyMetrics[0]?.count || 0;
    const avgVideoViewsVal = Math.round(kpiResult?.viewsMetrics[0]?.avgVideoViews || 0);

    // 5. Truy vấn danh sách toàn bộ các đơn hàng thỏa mãn bộ lọc
    const rawOrders = await Order.find(matchFilter).sort({ Order_Date: -1 }).lean();

    // 6. Xây dựng cấu trúc Bảng báo cáo Excel / CSV
    const reportData: any[] = [];

    // --- DÒNG 1: TIÊU ĐỀ BÁO CÁO ---
    reportData.push(['BÁO CÁO THỐNG KÊ DOANH THU & ĐƠN HÀNG TIKTOK SHOP']);
    reportData.push(['Ngày xuất báo cáo:', new Date().toLocaleString('vi-VN')]);
    reportData.push(['Bộ lọc áp dụng:', filterDescriptionText]);
    reportData.push([]); // Dòng trống

    // --- DÒNG 2: MỤC KPI TỔNG QUAN ---
    reportData.push([`THỐNG KÊ CHỈ SỐ KPI TỔNG QUAN${filterSuffix}`]);
    reportData.push(['1. Tổng doanh thu (Đơn hoàn thành):', `${totalRevenueVal.toLocaleString('vi-VN')} VNĐ`]);
    reportData.push(['2. Tổng số đơn hàng trong tệp:', `${totalOrdersVal.toLocaleString('vi-VN')} đơn`]);
    reportData.push(['3. Số đơn hàng bất thường:', `${totalAnomaliesVal.toLocaleString('vi-VN')} đơn`]);
    reportData.push(['4. Lượt xem Video trung bình:', `${avgVideoViewsVal.toLocaleString('vi-VN')} lượt`]);
    reportData.push([]); // Dòng trống

    // --- DÒNG 3: MỤC DANH SÁCH CHI TIẾT ---
    reportData.push([`DANH SÁCH CHI TIẾT CÁC ĐƠN HÀNG${filterSuffix}`]);
    reportData.push([
      'Mã Đơn Hàng',
      'Ngày Đặt Hàng',
      'Mã Khách Hàng',
      'Tên Khách Hàng',
      'Tuổi',
      'Giới Tính',
      'Thành Phố Giao Hàng',
      'Thiết Bị',
      'Mã Sản Phẩm',
      'Tên Sản Phẩm',
      'Danh Mục Chính',
      'Danh Mục Phụ',
      'Đơn Giá (VNĐ)',
      'Số Lượng',
      'Giảm Giá (VNĐ)',
      'Phí Ship (VNĐ)',
      'Tổng Tiền (VNĐ)',
      'Phương Thức Thanh Toán',
      'Trạng Thái Đơn Hàng',
      'Đánh Giá',
      'Số Đánh Giá',
      'Mã Shop',
      'Tên Shop',
      'Nguồn Traffic',
      'Tên Creator/KOL',
      'Lượt Xem Video',
      'Đơn Bất Thường',
    ]);

    // Map từng dòng dữ liệu từ MongoDB Atlas
    const formatDateVN = (dateStr: string) => {
      if (!dateStr) return '';
      const parts = dateStr.split(' ');
      const datePart = parts[0].split('-').reverse().join('/');
      return parts[1] ? `${datePart} ${parts[1]}` : datePart;
    };

    rawOrders.forEach((item: any) => {
      reportData.push([
        item.Order_ID || '',
        formatDateVN(item.Order_Date || ''),
        item.Customer_ID || '',
        item.Customer_Name || '',
        item.Customer_Age ?? '',
        item.Customer_Gender || '',
        item.Shipping_City || '',
        item.Device_Type || '',
        item.Product_ID || '',
        item.Product_Name || '',
        item.Main_Category || '',
        item.Sub_Category || '',
        item.Unit_Price ?? 0,
        item.Quantity ?? 0,
        item.Discount_Amount ?? 0,
        item.Shipping_Fee ?? 0,
        item.Total_Amount ?? 0,
        item.Payment_Method || '',
        item.Order_Status || '',
        item.Product_Rating ?? 0,
        item.Review_Count ?? 0,
        item.Shop_ID || '',
        item.Shop_Name || '',
        item.Traffic_Source || '',
        item.Creator_Name || '',
        item.Video_Views ?? 0,
        item.Is_Anomaly ?? 0,
      ]);
    });

    // 7. Tạo Workbook và Worksheet bằng thư viện XLSX
    const worksheet = XLSX.utils.aoa_to_sheet(reportData);

    // Tự động căn chỉnh độ rộng các cột
    worksheet['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 22 }, { wch: 8 }, { wch: 10 },
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 35 }, { wch: 25 }, { wch: 20 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 30 },
      { wch: 22 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 22 },
      { wch: 22 }, { wch: 15 }, { wch: 25 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo TikTok Shop');

    // 8. ĐỊNH DẠNG TÊN FILE MỚI
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const fileName = `tiktok_shop_sales_report_${day}-${month}-${year}.${exportType === 'csv' ? 'csv' : 'xlsx'}`;

    // 9. Đóng gói Buffer và trả về tệp tải xuống cho trình duyệt
    if (exportType === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      // Thêm UTF-8 BOM (\uFEFF) để hiển thị đúng tiếng Việt có dấu
      const csvBuffer = Buffer.from('\uFEFF' + csvOutput, 'utf-8');

      return new NextResponse(csvBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Access-Control-Expose-Headers': 'Content-Disposition',
        },
      });
    } else {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer', cellStyles: true });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Access-Control-Expose-Headers': 'Content-Disposition',
        },
      });
    }
  } catch (error: any) {
    console.error('Lỗi Export API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}