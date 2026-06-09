import { db } from "src";
import { getAppConfig } from "./get-app-config";
import { eq } from "drizzle-orm";
import { variants } from "src/db/variants-schema";
import { getAvgDailySales } from "./get-avg-daily-sales";
import { groupVariantsByProduct } from "./group-variants-by-product";
import { products } from "src/db/products-schema";

export const getDashboardMetrics = async ({ shop }: { shop: string }) => {
  const { protectionDays } = await getAppConfig(shop);

  const inventory = await db
    .select({
      variantId: variants.id,
      productId: variants.productId,
      shopifyVariantId: variants.shopifyVariantId,
      inventoryQuantity: variants.inventoryQuantity,
      price: variants.price,
    })
    .from(variants)
    .where(eq(variants.shop, shop));

  const sales = await getAvgDailySales({
    shop,
  });

  const salesMap = new Map(sales.map((s) => [s.variantId, s.avgDailySales]));

  const enrichedVariants = inventory.map((v) => {
    const avgDailySales = salesMap.get(v.variantId) ?? 0;

    const currentInventory = v.inventoryQuantity ?? 0;

    const stockoutDays =
      avgDailySales > 0 ? currentInventory / avgDailySales : Infinity;

    const daysUntilRisk = stockoutDays - protectionDays;

    const shouldRestock = daysUntilRisk <= 7;

    const suggestedQty = shouldRestock
      ? Math.max(
          0,
          Math.round(avgDailySales * protectionDays - currentInventory),
        )
      : 0;

    return {
      variantId: v.variantId,
      productId: v.productId,
      shopifyVariantId: v.shopifyVariantId,

      currentInventory,
      price: Number(v.price),

      avgDailySales,

      stockoutDays,
      daysUntilRisk,

      shouldRestock,
      suggestedQty,
    };
  });

  const productsFromDb = await db
    .select({
      id: products.id,
      title: products.title,
    })
    .from(products);
  const productTitleMap = new Map(productsFromDb.map((p) => [p.id, p.title]));

  const productsGrouped = groupVariantsByProduct(
    enrichedVariants,
    productTitleMap,
    protectionDays,
  );

  const totalProducts = productsGrouped.length;

  const totalInventoryValue = enrichedVariants.reduce((sum, v) => {
    return sum + v.currentInventory * v.price;
  }, 0);

  const activeProducts = productsGrouped.filter(
    (p) => p.totalAvgDailySales > 0,
  );

  const sortedByVelocity = [...activeProducts].sort(
    (a, b) => a.totalAvgDailySales - b.totalAvgDailySales,
  );

  const fastMovingItems = sortedByVelocity.slice(-5).reverse();
  const fastProductIds = new Set(fastMovingItems.map((p) => p.productId));
  const slowMovingItems = sortedByVelocity
    .filter((p) => !fastProductIds.has(p.productId))
    .slice(0, 5);

  const inventoryAtRisk = productsGrouped.filter((p) => p.inventoryAtRisk);

  return {
    totalProducts,
    totalInventoryValue,

    inventoryAtRisk,

    slowMovingItems,
    fastMovingItems,
  };
};
