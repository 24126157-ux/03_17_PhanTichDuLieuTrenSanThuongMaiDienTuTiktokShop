import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request: NextRequest) {
  try {
    // 1. Kết nối cơ sở dữ liệu MongoDB Atlas
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    // 2. Trích xuất tất cả thông số bộ lọc từ URL Query Params
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

    // 3. Xây dựng $match Filter động khớp 100% với Schema MongoDB
    const matchFilter: any = {};

    // Tìm kiếm từ khóa không phân biệt hoa thường theo Mã đơn, Tên khách hàng hoặc Tên sản phẩm
    if (search.trim()) {
      const keyword = search.trim();
      matchFilter.$or = [
        { Order_ID: { $regex: keyword, $options: 'i' } },
        { Customer_Name: { $regex: keyword, $options: 'i' } },
        { Product_Name: { $regex: keyword, $options: 'i' } },
      ];
    }

    // Lọc theo các trường danh mục / thông tin drop-down
    if (status && status !== 'ALL' && status !== 'undefined') {
      matchFilter.Order_Status = status;
    }
    if (paymentMethod && paymentMethod !== 'ALL' && paymentMethod !== 'undefined') {
      matchFilter.Payment_Method = paymentMethod;
    }
    if (category && category !== 'ALL' && category !== 'undefined') {
      matchFilter.Main_Category = category;
    }
    if (creator && creator !== 'ALL' && creator !== 'undefined') {
      matchFilter.Creator_Name = creator;
    }
    if (city && city !== 'ALL' && city !== 'undefined') {
      matchFilter.Shipping_City = city;
    }
    if (shop && shop !== 'ALL' && shop !== 'undefined') {
      matchFilter.Shop_Name = shop;
    }

    // Lọc cờ đơn hàng bất thường (Is_Anomaly: 0 hoặc 1)
    if (isAnomaly !== '' && isAnomaly !== 'ALL' && isAnomaly !== 'undefined') {
      const parsedAnomaly = parseInt(isAnomaly, 10);
      if (!isNaN(parsedAnomaly)) {
        matchFilter.Is_Anomaly = parsedAnomaly;
      }
    }

    // Lọc khoảng tiền đơn hàng (Total_Amount)
    if (minAmount || maxAmount) {
      matchFilter.Total_Amount = {};
      if (minAmount) matchFilter.Total_Amount.$gte = parseFloat(minAmount);
      if (maxAmount) matchFilter.Total_Amount.$lte = parseFloat(maxAmount);
    }

    // Lọc khoảng ngày đặt hàng (Order_Date)
    if (startDate || endDate) {
      matchFilter.Order_Date = {};
      if (startDate) matchFilter.Order_Date.$gte = startDate;
      if (endDate) matchFilter.Order_Date.$lte = endDate + ' 23:59:59';
    }

    // 4. Thực thi MongoDB Aggregation Pipeline với $facet
    const results = await Order.aggregate([
      // Lọc toàn bộ tập dữ liệu thỏa mãn bộ lọc trước khi đi vào các nhánh Facet
      { $match: matchFilter },
      {
        $facet: {
          // Thẻ KPI 1: Doanh thu (chỉ tính đơn hoàn thành) & Tổng số đơn hàng trong tệp lọc
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

          // Thẻ KPI 2: Đếm số ca đơn hàng bất thường trong tệp lọc
          anomalyCount: [
            { $match: { Is_Anomaly: 1 } },
            { $count: 'count' },
          ],

          // Thẻ KPI 3: Tính lượt xem Video trung bình
          avgViews: [
            {
              $group: {
                _id: null,
                avgVideoViews: { $avg: '$Video_Views' },
              },
            },
          ],

          // Biểu đồ Tròn: Phân bổ tỷ lệ nguồn Traffic
          trafficSourceBreakdown: [
            {
              $match: {
                Traffic_Source: {
                  $exists: true,
                  $ne: null,
                  $nin: ['Khác', 'khac', 'Other', 'other', ''],
                },
              },
            },
            {
              $group: {
                _id: '$Traffic_Source',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Biểu đồ Cột: Phân bố Trạng thái đơn hàng
          orderStatusBreakdown: [
            {
              $match: {
                Order_Status: { $exists: true, $ne: null, $nin: [''] },
              },
            },
            {
              $group: {
                _id: '$Order_Status',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Bảng Top 5 Sản phẩm bán chạy nhất
          topProducts: [
            {
              $group: {
                _id: '$Product_Name',
                totalQuantity: { $sum: '$Quantity' },
                totalRevenue: { $sum: '$Total_Amount' },
              },
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
          ],

          // Biểu đồ Đường: Doanh thu theo thời gian (Tháng)
          monthlyRevenueTrend: [
            {
              $match: {
                Order_Date: { $exists: true, $ne: null, $nin: [''] },
              },
            },
            {
              $group: {
                _id: {
                  $substr: ['$Order_Date', 0, 7],
                },
                revenue: {
                  $sum: {
                    $cond: [
                      { $regexMatch: { input: '$Order_Status', regex: /Hoàn thành|Completed/i } },
                      '$Total_Amount',
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                month: '$_id',
                revenue: '$revenue',
              },
            },
          ],
        },
      },
    ]);

    const data = results[0];

    // 5. Trả kết quả JSON chuẩn hóa về Client
    return NextResponse.json(
      {
        success: true,
        data: {
          totalRevenue: data.kpiMetrics[0]?.totalRevenue || 0,
          totalOrders: data.kpiMetrics[0]?.totalOrders || 0,
          totalAnomalies: data.anomalyCount[0]?.count || 0,
          avgVideoViews: Math.round(data.avgViews[0]?.avgVideoViews || 0),
          trafficSourceBreakdown: data.trafficSourceBreakdown || [],
          orderStatusBreakdown: data.orderStatusBreakdown || [],
          topProducts: data.topProducts || [],
          monthlyRevenueTrend: data.monthlyRevenueTrend || [],
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Lỗi API Reports Aggregation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}