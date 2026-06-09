import { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { and, eq } from "drizzle-orm";
import { variants } from "../../src/db/variants-schema";

interface InventoryLevelsUpdateWebhook {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updatedAt: string;
  admin_graphql_api_id: string;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate webhook
    const { topic, shop, payload } = await authenticate.webhook(request);

    if (topic !== "INVENTORY_LEVELS_UPDATE") {
      return new Response("Not an inventory_levels/update webhook", {
        status: 200,
      });
    }
    const body = payload as InventoryLevelsUpdateWebhook;

    await db
      .update(variants)
      .set({
        inventoryQuantity: body.available,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(variants.shop, shop),
          eq(
            variants.shopifyInventoryItemId,
            `gid://shopify/InventoryItem/${body.inventory_item_id.toString()}`,
          ),
        ),
      );

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(error);

    return new Response("Internal Server Error", { status: 500 });
  }
};
