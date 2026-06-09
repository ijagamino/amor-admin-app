import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import DashboardCard from "app/components/dashboard-card";
import { getDashboardMetrics } from "src/services/dashboard-metrics";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { syncInventory } from "src/services/sync-inventory";
import { syncOrders } from "src/services/sync-orders";
import { syncData } from "src/services/sync-data.ts";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const {
    totalProducts,
    totalInventoryValue,
    inventoryAtRisk,
    slowMovingItems,
    fastMovingItems,
  } = await getDashboardMetrics({
    shop: session.shop,
  });

  return {
    totalProducts,
    totalInventoryValue,
    inventoryAtRisk,
    slowMovingItems,
    fastMovingItems,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const adminContext = await authenticate.admin(request);

  await syncData(adminContext);

  return { success: true };
};

export default function Index() {
  const {
    totalProducts,
    totalInventoryValue,
    inventoryAtRisk,
    slowMovingItems,
    fastMovingItems,
  } = useLoaderData<typeof loader>();

  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("App data synced");
    }
  }, [fetcher.data?.success, shopify]);

  const syncData = () => fetcher.submit({}, { method: "POST" });

  return (
    <s-page heading="Dashboard">
      <s-button
        slot="primary-action"
        onClick={syncData}
        {...(isLoading ? { loading: true } : {})}
      >
        Sync data
      </s-button>

      <s-section heading="Overview">
        <s-grid gridTemplateColumns="repeat(2, 1fr)" gap="base">
          <DashboardCard title="Total Products">{totalProducts}</DashboardCard>
          <DashboardCard title="Total Inventory Value">
            ${totalInventoryValue}
          </DashboardCard>
        </s-grid>
      </s-section>

      <s-section heading="Products that need to be restocked">
        <s-box background="strong" padding="base" borderRadius="base">
          {inventoryAtRisk.length > 0 ? (
            <s-ordered-list>
              {inventoryAtRisk.map((p) => (
                <s-list-item key={p.productId}>
                  <s-stack gap="small">
                    <s-text>{p.productTitle}</s-text>

                    <s-text>Order quantity: {p.reorderQty}</s-text>
                    <s-text tone="neutral">
                      Inventory: {p.totalInventory}
                    </s-text>
                  </s-stack>
                </s-list-item>
              ))}
            </s-ordered-list>
          ) : (
            <s-heading>No products need to be restocked!</s-heading>
          )}
        </s-box>
      </s-section>

      <s-section heading="Item rankings" slot="aside">
        <s-stack gap="base">
          <s-box background="strong" padding="base" borderRadius="base">
            <s-heading>Top 5 Fast Moving Items</s-heading>

            <s-ordered-list>
              {fastMovingItems.map((p) => (
                <s-list-item key={p.productId}>
                  <s-stack gap="small">
                    <s-text>{p.productTitle}</s-text>
                  </s-stack>
                </s-list-item>
              ))}
            </s-ordered-list>
          </s-box>

          <s-box background="strong" padding="base" borderRadius="base">
            <s-heading>Top 5 Slow Moving Items</s-heading>

            {slowMovingItems.length > 0 ? (
              <s-ordered-list>
                {slowMovingItems.map((p) => (
                  <s-list-item key={p.productId}>
                    <s-stack gap="small">
                      <s-text>{p.productTitle}</s-text>
                    </s-stack>
                  </s-list-item>
                ))}
              </s-ordered-list>
            ) : (
              <s-text>No slow moving items!</s-text>
            )}
          </s-box>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
