import { db } from "src";
import { purchaseOrders } from "src/db/purchase-orders-schema";
import { purchaseOrderItems } from "src/db/purchase-order-items-schema";
import { variants } from "src/db/variants-schema";
import { eq } from "drizzle-orm";
import { logActivity } from "./log-activity";
import { activityLogs } from "src/db/activity-logs-schema";

type InputItem = {
  productId: number;
  variantId: number;
  productTitle: string;
  shopifyVariantId: string;

  currentInventory: number;
  avgDailySales: number;

  approvedQty: number;
};

export async function createPurchaseOrder({
  shop,
  items,
}: {
  shop: string;
  items: InputItem[];
}) {
  return await db.transaction(async (tx) => {
    const [po] = await tx
      .insert(purchaseOrders)
      .values({
        shop,
        status: "draft",
        totalItems: 0,
        totalEstimatedValue: "0.00",
      })
      .$returningId();

    const purchaseOrderId = po.id;

    let totalItems = 0;
    let totalValue = 0;

    const orderItems = [];

    for (const item of items) {
      const [variant] = await tx
        .select({
          price: variants.price,
        })
        .from(variants)
        .where(eq(variants.id, item.variantId));

      const unitPrice = Number(variant?.price ?? 0);

      const lineTotal = unitPrice * item.approvedQty;

      totalItems += item.approvedQty;
      totalValue += lineTotal;

      orderItems.push({
        shop,
        purchaseOrderId,
        productId: item.productId,
        variantId: item.variantId,
        title: item.productTitle,
        suggestedQty: item.approvedQty,
        approvedQty: item.approvedQty,
        unitPrice: unitPrice.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
      });
    }

    if (orderItems.length > 0) {
      await tx.insert(purchaseOrderItems).values(orderItems);
    }

    await tx
      .update(purchaseOrders)
      .set({
        totalItems,
        totalEstimatedValue: totalValue.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, purchaseOrderId));

    await tx.insert(activityLogs).values({
      shop,
      action: "CREATE_PURCHASE_ORDER",
      entityType: "purchase_order",
      entityId: purchaseOrderId,
      message: `Created purchase order with ${items.length} items`,
    });

    return {
      purchaseOrderId,
      totalItems,
      totalEstimatedValue: totalValue,
      itemsCreated: orderItems.length,
    };
  });
}
