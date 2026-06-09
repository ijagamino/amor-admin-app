import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getDashboardMetrics } from "src/services/dashboard-metrics";
import { RestockItem, RestockTable } from "app/components/restock-table";
import { createPurchaseOrder } from "src/services/create-purchase-order";
import { useEffect, useState } from "react";
import { eq } from "drizzle-orm";
import { db } from "src";
import { purchaseOrderItems } from "src/db/purchase-order-items-schema";
import { generatePurchaseOrderExcel } from "src/services/generate-po-excel";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const metrics = await getDashboardMetrics({
    shop: session.shop,
  });

  return {
    inventoryAtRisk: metrics.inventoryAtRisk,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const { items } = await request.json();

  const result = await createPurchaseOrder({
    shop: session.shop,
    items,
  });

  const savedItems = await db
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, result.purchaseOrderId));

  const buffer = await generatePurchaseOrderExcel(
    savedItems.map((i) => ({
      productId: i.productId,
      productTitle: i.title,
      variantId: i.variantId,
      shopifyVariantId: String(i.variantId),
      approvedQty: i.approvedQty,
      suggestedQty: i.suggestedQty,
    })),
  );

  const base64 = Buffer.from(buffer).toString("base64");

  return Response.json({
    purchaseOrderId: result.purchaseOrderId,
    excel: base64,
  });
  // return Response.json({
  //   purchaseOrderId: result.purchaseOrderId,
  // });
  // return Response.json(result);
};

export default function RestockPage() {
  const { inventoryAtRisk } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ purchaseOrderId: number; excel: string }>();

  const [selectedItems, setSelectedItems] = useState<RestockItem[]>([]);

  useEffect(() => {
    console.log("yes");
    if (!fetcher.data?.excel || !fetcher.data?.purchaseOrderId) return;
    console.log("sir");

    const binary = atob(fetcher.data.excel);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-order-${fetcher.data.purchaseOrderId}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fetcher.data?.excel, fetcher.data?.purchaseOrderId]);

  const items: RestockItem[] = inventoryAtRisk.flatMap(
    (product) =>
      product.variants?.map((v) => ({
        productId: product.productId,
        productTitle: product.productTitle,

        variantId: v.variantId,
        shopifyVariantId: v.shopifyVariantId,

        currentInventory: v.currentInventory,
        avgDailySales: v.avgDailySales,

        suggestedQty: v.suggestedQty,
        approvedQty: v.approvedQty,
      })) ?? [],
  );

  const generate = () => {
    fetcher.submit(JSON.stringify({ items: selectedItems }), {
      method: "post",
      encType: "application/json",
      action: "/app/restock",
    });
  };

  return (
    <s-page heading="Restock Planner">
      <s-section heading="Restock Inventory at Risk">
        <RestockTable
          items={items}
          selectedItems={selectedItems}
          onSelect={setSelectedItems}
        />
        <s-button onClick={generate}>Generate & Export Purchase Order</s-button>
      </s-section>
    </s-page>
  );
}
