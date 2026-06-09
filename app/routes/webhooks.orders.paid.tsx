import { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { and, eq, sql } from "drizzle-orm";
import { variants } from "src/db/variants-schema";
import { salesSnapshots } from "src/db/sales-snapshots-schema";

// interface OrdersPaidWebhook {
//   id: number;
//   order_number: number;
//   email: string;
//   created_at: string;
//   total_price: string;
//   currency: string;
//   line_items: {
//     id: number;
//     title: string;
//     quantity: number;
//     price: string;
//     product_id: number | null;
//     variant_id: number | null;
//   }[];
// }

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate webhook
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log(topic);

    if (topic !== "ORDERS_PAID") {
      return new Response("Not an orders/paid webhook", { status: 200 });
    }

    console.log(payload);

    const orderDate = new Date(payload.created_at);
    const day = new Date(
      Date.UTC(
        orderDate.getUTCFullYear(),
        orderDate.getUTCMonth(),
        orderDate.getUTCDate(),
      ),
    );

    await db.transaction(async (tx) => {
      console.log("TX START");
      for (const item of payload.line_items) {
        if (!item.variant_id) continue;

        // find internal variant
        const variant = await tx
          .select()
          .from(variants)
          .where(
            and(
              eq(variants.shop, shop),
              eq(
                variants.shopifyVariantId,
                `gid://shopify/ProductVariant/${item.variant_id.toString()}`,
              ),
            ),
          )
          .limit(1);
        console.log(variant);

        const v = variant[0];
        if (!v) continue;

        await tx
          .insert(salesSnapshots)
          .values({
            shop,
            variantId: v.id,
            date: day,
            quantitySold: item.quantity,
          })
          .onDuplicateKeyUpdate({
            set: {
              quantitySold: sql`
                ${salesSnapshots.quantitySold} + VALUES(quantitySold)
              `,
              updatedAt: sql`NOW()`,
            },
          });

        await tx
          .update(variants)
          .set({
            inventoryQuantity: sql`
              ${variants.inventoryQuantity} - ${item.quantity}
            `,
            updatedAt: sql`NOW()`,
          })
          .where(eq(variants.id, v.id));
      }
      console.log("TX END");
    });
    console.log("sumakses");
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(error);

    return new Response("Internal Server Error", { status: 500 });
  }
};
