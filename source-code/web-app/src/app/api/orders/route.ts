import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

// GET: Lấy danh sách đơn hàng có phân trang và hỗ trợ truy vấn lọc nâng cao đa tiêu chí 
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    
    // Các tham số lọc nâng cao
    const status = searchParams.get('status') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const category = searchParams.get('category') || '';
    const creator = searchParams.get('creator') || '';
    const city = searchParams.get('city') || '';
    const shop = searchParams.get('shop') || '';
    const isAnomaly = searchParams.get('isAnomaly') || '';
    const minAmount = searchParams.get('minAmount') || '';
    const maxAmount = searchParams.get('maxAmount') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Xây dựng câu truy vấn MongoDB động (Dynamic Query Builder)
    const query: any = {};

    // 1. Tìm kiếm theo từ khóa: Giới hạn theo Mã đơn (Order_ID), Tên khách hàng, Tên sản phẩm 
    if (search.trim()) {
      const keyword = search.trim();
      query.$or = [
        { Order_ID: { $regex: keyword, $options: 'i' } },
        { Customer_Name: { $regex: keyword, $options: 'i' } },
        { Product_Name: { $regex: keyword, $options: 'i' } },
      ];
    }

    // 2. Lọc theo trạng thái đơn hàng (Order_Status)
    if (status && status !== 'ALL') {
      query.Order_Status = status;
    }

    // 3. Lọc theo phương thức thanh toán (Payment_Method)
    if (paymentMethod && paymentMethod !== 'ALL') {
      query.Payment_Method = paymentMethod;
    }

    // 4. Lọc theo danh mục ngành hàng (Main_Category)
    if (category && category !== 'ALL') {
      query.Main_Category = category;
    }

    // 5. Lọc theo KOC / Kênh bán hàng (Creator_Name)
    if (creator && creator !== 'ALL') {
      query.Creator_Name = creator;
    }

    // 6. Lọc theo Khu vực / Tỉnh thành (Shipping_City)
    if (city && city !== 'ALL') {
      query.Shipping_City = city;
    }

    // 7. Lọc theo Tên gian hàng / Cửa hàng (Shop_Name)
    if (shop && shop !== 'ALL') {
      query.Shop_Name = shop;
    }

    // 8. Lọc đơn hàng bất thường (Is_Anomaly)
    if (isAnomaly !== '' && isAnomaly !== 'ALL') {
      query.Is_Anomaly = parseInt(isAnomaly, 10);
    }

    // 7. Lọc theo khoảng tổng tiền (Total_Amount: min - max)
    if (minAmount || maxAmount) {
      query.Total_Amount = {};
      if (minAmount) {
        query.Total_Amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.Total_Amount.$lte = parseFloat(maxAmount);
      }
    }

    // 8. Lọc theo khoảng ngày đặt hàng (Order_Date: startDate - endDate)
    if (startDate || endDate) {
      query.Order_Date = {};
      if (startDate) {
        query.Order_Date.$gte = startDate;
      }
      if (endDate) {
        query.Order_Date.$lte = endDate + ' 23:59:59';
      }
    }

    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query).skip(skip).limit(limit).sort({ Order_Date: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // 1. Kiểm tra định dạng: TTS-2024- và đúng 6 chữ số
    const orderIdRegex = /^TTS-2024-\d{6}$/;
    if (!orderIdRegex.test(body.Order_ID)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Mã đơn hàng không đúng định dạng! Yêu cầu: TTS-2024- kèm theo đúng 6 chữ số (Ví dụ: TTS-2024-123456).' 
      }, { status: 400 });
    }

    // 2. Kiểm tra xem mã đơn hàng đã tồn tại trong database chưa
    const existingOrder = await Order.findOne({ Order_ID: body.Order_ID });
    if (existingOrder) {
      return NextResponse.json({ 
        success: false, 
        error: `Mã đơn hàng "${body.Order_ID}" đã tồn tại trong hệ thống. Vui lòng nhập mã khác!` 
      }, { status: 400 });
    }

    const newOrder = await Order.create(body);
    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}