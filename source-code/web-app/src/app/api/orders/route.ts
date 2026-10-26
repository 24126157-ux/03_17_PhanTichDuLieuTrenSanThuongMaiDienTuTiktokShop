import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

// GET: Lấy danh sách đơn hàng có phân trang và tìm kiếm cơ bản
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { Order_ID: { $regex: search, $options: 'i' } },
        { Customer_Name: { $regex: search, $options: 'i' } },
        { Product_Name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

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