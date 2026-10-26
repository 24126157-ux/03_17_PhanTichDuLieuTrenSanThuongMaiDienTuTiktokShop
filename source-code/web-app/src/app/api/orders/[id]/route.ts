import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ Order_ID: id });
    }
    
    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: order }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const body = await request.json();
    
    // Kiểm tra định dạng và trùng lặp Order_ID khi cập nhật
    if (body.Order_ID) {
      const orderIdRegex = /^TTS-2024-\d{6}$/;
      if (!orderIdRegex.test(body.Order_ID)) {
        return NextResponse.json({ 
          success: false, 
          message: 'Mã đơn hàng không đúng định dạng! Yêu cầu: TTS-2024- kèm theo đúng 6 chữ số (Ví dụ: TTS-2024-123456).' 
        }, { status: 400 });
      }

      let queryCondition: any = { Order_ID: body.Order_ID };
      if (mongoose.Types.ObjectId.isValid(id)) {
        queryCondition._id = { $ne: id };
      } else {
        queryCondition.Order_ID = { $ne: id };
      }

      const duplicate = await Order.findOne(queryCondition);
      if (duplicate) {
        return NextResponse.json({ 
          success: false, 
          message: `Mã đơn hàng "${body.Order_ID}" đã tồn tại trong hệ thống. Vui lòng nhập mã khác!` 
        }, { status: 400 });
      }
    }

    let updatedOrder = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      updatedOrder = await Order.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    }
    if (!updatedOrder) {
      updatedOrder = await Order.findOneAndUpdate({ Order_ID: id }, body, { new: true, runValidators: true });
    }

    if (!updatedOrder) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng để cập nhật' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedOrder }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    
    let deletedOrder = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deletedOrder = await Order.findByIdAndDelete(id);
    }
    if (!deletedOrder) {
      deletedOrder = await Order.findOneAndDelete({ Order_ID: id });
    }

    if (!deletedOrder) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng để xóa' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Xóa đơn hàng thành công' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}