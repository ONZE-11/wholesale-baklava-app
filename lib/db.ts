// lib/db.ts
import { prisma } from "@/lib/prisma";

export const db = {
  users: {
    async create(data: {
      email: string;
      business_name: string;
      cif: string;
      phone: string;
      address: string;
      city: string;
      postal_code: string;
      country: string;
      auth_id: string;
    }) {
      return prisma.user.create({ data });
    },

    async findByEmail(email: string) {
      // از findFirst به جای findUnique استفاده می‌کنیم
      return prisma.user.findFirst({ where: { email } });
    },

    async findByAuthId(authId: string) {
      return prisma.user.findFirst({ where: { auth_id: authId } });
    },

    async findById(id: string) {
      return prisma.user.findUnique({ where: { id } });
    },

    async findPending() {
      return prisma.user.findMany({ where: { approval_status: "pending" } });
    },

    async updateStatus(
      id: string,
      status: "approved" | "rejected",
      notes?: string
    ) {
      return prisma.user.update({
        where: { id },
        data: {
          approval_status: status,
          admin_notes: notes,
        },
      });
    },
  },
  products: {
    async findById(id: string) {
      return prisma.product.findUnique({ where: { id } });
    },

    async findAll() {
      return prisma.product.findMany();
    },

    async create(data: {
      name_es: string;
      name_en: string;
      description_es: string;
      description_en: string;
      long_description_es: string;
      long_description_en: string;
      ingredients_es: string;
      ingredients_en: string;
      shelf_life_es: string;
      shelf_life_en: string;
      storage_es: string;
      storage_en: string;
      packaging_es: string;
      packaging_en: string;
      price: number;
      unit: string;
      min_order_quantity: number;
      image_url: string;
      category: string;
    }) {
      return prisma.product.create({ data });
    },

    async update(
      id: string,
      data: Partial<{
        name_es: string;
        name_en: string;
        description_es: string;
        description_en: string;
        long_description_es: string;
        long_description_en: string;
        ingredients_es: string;
        ingredients_en: string;
        shelf_life_es: string;
        shelf_life_en: string;
        storage_es: string;
        storage_en: string;
        packaging_es: string;
        packaging_en: string;
        price: number;
        unit: string;
        min_order_quantity: number;
        image_url: string;
        category: string;
      }>
    ) {
      return prisma.product.update({ where: { id }, data });
    },

    async delete(id: string) {
      return prisma.product.delete({ where: { id } });
    },
  },

  orders: {
    async findById(id: string) {
      return prisma.order.findUnique({ where: { id }, include: { items: true } });
    },

    async findAll() {
      return prisma.order.findMany({ include: { items: true } });
    },

    async create(data: {
      user_id: string;
      items: { product_id: string; quantity: number; unit_price?: number }[];
      total_amount: number;
      payment_status: "pending" | "paid" | "failed";
      shipping_address: string;
      notes?: string;
      payment_method: string;
    }) {
      return prisma.order.create({
        data: {
          user_id: data.user_id,
          total_amount: data.total_amount,
          payment_status: data.payment_status,
          shipping_address: data.shipping_address,
          notes: data.notes ?? null,
          payment_method: data.payment_method,
          items: {
            create: data.items.map((p) => ({
              product_id: p.product_id,
              quantity: p.quantity,
              unit_price: p.unit_price ?? 0,
              subtotal: (p.unit_price ?? 0) * p.quantity,
            })),
          },
        },
        include: { items: true },
      });
    },

    async updatePaymentStatus(
      id: string,
      status: "pending" | "paid" | "failed",
      paymentIntentId?: string
    ) {
      return prisma.order.update({
        where: { id },
        data: {
          payment_status: status,
          ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
        },
      });
    },
  },

  order_items: {
    async create(data: {
      order_id: string;
      product_id: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }) {
      return prisma.orderItem.create({ data });
    },

    async findByOrderId(orderId: string) {
      return prisma.orderItem.findMany({ where: { order_id: orderId } });
    },
  },
};


