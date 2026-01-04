import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // مسیر به db.ts شما
import { z } from "zod";

// --- Schema اعتبارسنجی داده‌ها ---
const createOrderSchema = z.object({
  user_id: z.string().uuid(),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().min(1),
      unit_price: z.number().min(0),
    })
  ),
  total_amount: z.number().min(0),
  shipping_address: z.string().min(1),
  payment_method: z.enum(["stripe", "cash"]),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // --- اعتبارسنجی داده‌ها ---
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { user_id, items, total_amount, shipping_address, payment_method, notes } = parsed.data;

    if (items.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
    }

    // --- ایجاد سفارش با db.ts ---
    const order = await db.orders.create({
      user_id,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
      })),
      total_amount,
      shipping_address,
      payment_method,
      payment_status: payment_method === "cash" ? "pending" : "pending",
      notes,
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order", stack: error.stack },
      { status: 500 }
    );
  }
}
