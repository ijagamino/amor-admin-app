export interface EnrichedVariant {
  variantId: number;
  productId: number;

  shopifyVariantId: string;

  currentInventory: number;
  avgDailySales: number;

  stockoutDays: number;
  daysUntilRisk: number;

  shouldRestock: boolean;
  suggestedQty: number;
  approvedQty?: number;
}

export const groupVariantsByProduct = (
  variants: EnrichedVariant[],
  productTitleMap: Map<number, string>,
  protectionDays: number,
) => {
  const map = new Map<number, EnrichedVariant[]>();

  for (const v of variants) {
    const productId = v.productId;

    if (!map.has(productId)) {
      map.set(productId, []);
    }

    map.get(productId)!.push(v);
  }

  return Array.from(map.entries()).map(([productId, variants]) => {
    const totalInventory = variants.reduce(
      (sum, v) => sum + v.currentInventory,
      0,
    );

    const totalAvgDailySales = variants.reduce(
      (sum, v) => sum + v.avgDailySales,
      0,
    );

    const targetStock = totalAvgDailySales * protectionDays;
    const gap = targetStock - totalInventory;

    const reorderQty = Math.max(0, Math.round(gap));
    const inventoryAtRisk = gap > 0;

    const restockInDays =
      totalAvgDailySales > 0 ? gap / totalAvgDailySales : Infinity;

    return {
      productId,
      productTitle: productTitleMap.get(productId) ?? `Product ${productId}`,

      totalInventory: totalInventory >= 0 ? totalInventory : 0,
      totalAvgDailySales,

      restockInDays,

      reorderQty,
      inventoryAtRisk,
      variants,
    };
  });
};
