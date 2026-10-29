import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    
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

    const query: any = {};

    if (search.trim()) {
      const keyword = search.trim();
      query.$or = [
        { Order_ID: { $regex: keyword, $options: 'i' } },
        { Customer_Name: { $regex: keyword, $options: 'i' } },
        { Product_Name: { $regex: keyword, $options: 'i' } },
        { Customer_ID: { $regex: keyword, $options: 'i' } },
        { Product_ID: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (status && status !== 'ALL') query.Order_Status = status;
    if (paymentMethod && paymentMethod !== 'ALL') query.Payment_Method = paymentMethod;
    if (category && category !== 'ALL') query.Main_Category = category;
    if (creator && creator !== 'ALL') query.Creator_Name = creator;
    if (city && city !== 'ALL') query.Shipping_City = city;
    if (shop && shop !== 'ALL') query.Shop_Name = shop;
    if (isAnomaly !== '' && isAnomaly !== 'ALL') query.Is_Anomaly = parseInt(isAnomaly, 10);

    if (minAmount || maxAmount) {
      query.Total_Amount = {};
      if (minAmount) query.Total_Amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.Total_Amount.$lte = parseFloat(maxAmount);
    }

    if (startDate || endDate) {
      query.Order_Date = {};
      if (startDate) query.Order_Date.$gte = startDate;
      if (endDate) query.Order_Date.$lte = endDate + ' 23:59:59';
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
    console.error("❌ LỖI API GET /api/orders:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const orderIdRegex = /^TTS-2024-\d{6}$/;
    if (!orderIdRegex.test(body.Order_ID)) {
      return NextResponse.json({
        success: false,
        error: 'Mã đơn hàng không đúng định dạng! Yêu cầu: TTS-2024- kèm theo đúng 6 chữ số (VD: TTS-2024-123456).'
      }, { status: 400 });
    }

    const customerIdRegex = /^CUST-\d{5}$/;
    if (!customerIdRegex.test(body.Customer_ID)) {
      return NextResponse.json({
        success: false,
        error: 'Mã khách hàng không đúng định dạng! Yêu cầu: CUST- kèm theo đúng 5 chữ số (VD: CUST-01234).'
      }, { status: 400 });
    }

    const productIdRegex = /^PROD-[A-Z]\d{2}$/;
    if (!productIdRegex.test(body.Product_ID)) {
      return NextResponse.json({
        success: false,
        error: 'Mã sản phẩm không đúng định dạng! Yêu cầu: PROD-[Chữ cái viết hoa][2 chữ số] (VD: PROD-T01).'
      }, { status: 400 });
    }

    if (Number(body.Unit_Price) < 0 || Number(body.Quantity) <= 0 || Number(body.Total_Amount) < 0) {
      return NextResponse.json({
        success: false,
        error: 'Dữ liệu số không hợp lệ (Số lượng phải > 0, đơn giá & tổng tiền không được âm).'
      }, { status: 400 });
    }

    const existingOrder = await Order.findOne({ Order_ID: body.Order_ID });
    if (existingOrder) {
      return NextResponse.json({
        success: false,
        error: `Mã đơn hàng "${body.Order_ID}" đã tồn tại trong hệ thống!`
      }, { status: 400 });
    }

    const newOrder = await Order.create(body);
    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error("❌ LỖI API POST /api/orders:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}