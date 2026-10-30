
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Order";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { message: "Bạn cần đăng nhập." },
      { status: 401 }
    );
  }

  const role = (session.user as { role?: string }).role;

  if (role?.toUpperCase() !== "ADMIN") {
    return NextResponse.json(
      { message: "Chỉ ADMIN mới được sử dụng chức năng này." },
      { status: 403 }
    );
  }

  return null;
}

// GET: Tải bản sao lưu JSON
export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectToDatabase();

    const records = await Transaction.find({})
  .sort({ createdAt: -1, _id: -1 })
  .lean();

    const date = new Date().toISOString().slice(0, 10);
    const filename = `tiktok_orders_backup_${date}.json`;

    return new Response(JSON.stringify(records, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { message: "Không thể sao lưu dữ liệu." },
      { status: 500 }
    );
  }
}

// POST: Phục hồi dữ liệu từ JSON, cập nhật hoặc thêm theo _id
export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Vui lòng chọn file JSON." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      return NextResponse.json(
        { message: "Chỉ chấp nhận file .json." },
        { status: 400 }
      );
    }

    const text = await file.text();

    if (text.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File vượt quá giới hạn 20 MB." },
        { status: 413 }
      );
    }

    let records: unknown;

    try {
      records = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { message: "Nội dung file JSON không hợp lệ." },
        { status: 400 }
      );
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { message: "File phải chứa một mảng JSON có ít nhất một bản ghi." },
        { status: 400 }
      );
    }

    const valid = records.every(
      (record) =>
        record !== null &&
        typeof record === "object" &&
        !Array.isArray(record) &&
        typeof record.Order_ID === "string" &&
        typeof record.Order_Date === "string" &&
        typeof record.Customer_Name === "string" &&
        typeof record.Product_Name === "string" &&
        Number.isFinite(record.Quantity) &&
        Number.isFinite(record.Total_Amount) &&
        typeof record.Payment_Method === "string" &&
        typeof record.Order_Status === "string"
    );

    if (!valid) {
      return NextResponse.json(
        { message: "Bản ghi thiếu trường bắt buộc hoặc sai kiểu dữ liệu." },
        { status: 400 }
      );
    }

    
    const operations = [];

    for (const record of records as Record<string, unknown>[]) {
      const { _id, __v, ...data } = record;

      if (
        typeof _id !== "string" ||
        !mongoose.isValidObjectId(_id)
      ) {
        return NextResponse.json(
          {
            message:
              "File backup có bản ghi thiếu _id MongoDB hợp lệ. Đã dừng phục hồi để tránh ghi nhầm dữ liệu.",
          },
          { status: 400 }
        );
      }

      operations.push({
        replaceOne: {
          filter: { _id: new mongoose.Types.ObjectId(_id) },
          replacement: {
            ...data,
            _id: new mongoose.Types.ObjectId(_id),
          },
          upsert: true,
        },
      });
    }


    const result = await Transaction.bulkWrite(operations, {
      ordered: false,
    });

    return NextResponse.json({
      message: "Đã hoàn tất phục hồi dữ liệu.",
      received: records.length,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { message: "Phục hồi thất bại. Hãy kiểm tra file và dữ liệu MongoDB." },
      { status: 500 }
    );
  }
}
