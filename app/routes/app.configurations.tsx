import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { eq } from "drizzle-orm";
import { db } from "src";
import { appConfigurations } from "src/db/app-configurations-schema";
import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { updateAppConfig } from "src/services/update-app-config";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const config = await db
    .select()
    .from(appConfigurations)
    .where(eq(appConfigurations.shop, session.shop));

  return { config: config[0] ?? null };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();

  const safetyStockDays = Number(formData.get("safetyStockDays"));
  const deliveryLeadTimeDays = Number(formData.get("deliveryLeadTimeDays"));

  await updateAppConfig({
    shop: session.shop,
    safetyStockDays,
    deliveryLeadTimeDays,
  });

  return { success: true };
};

export default function Index() {
  const { config } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  const [safetyStockDays, setSafetyStockDays] = useState(
    config?.safetyStockDays ?? 0,
  );

  const [deliveryLeadTimeDays, setDeliveryLeadTimeDays] = useState(
    config?.deliveryLeadTimeDays ?? 0,
  );

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("App configuration updated");
    }
  }, [fetcher.data?.success, shopify]);

  const save = () => {
    const form = new FormData();
    form.append("safetyStockDays", String(safetyStockDays));
    form.append("deliveryLeadTimeDays", String(deliveryLeadTimeDays));

    fetcher.submit(form, { method: "post" });
  };

  return (
    <s-page heading="Configurations">
      <s-section heading="Application configurations">
        <s-paragraph>Set application configurations here.</s-paragraph>
        <s-stack direction="block" gap="base">
          <s-number-field
            label="Safety Stock Days"
            value={String(safetyStockDays)}
            min={0}
            onChange={(e) => {
              setSafetyStockDays(Number(e.currentTarget.value));
            }}
          />
          <s-number-field
            label="Delivery Lead Time Days"
            defaultValue={String(deliveryLeadTimeDays)}
            min={0}
            onChange={(e) => {
              setDeliveryLeadTimeDays(Number(e.currentTarget.value));
            }}
          />
          <s-button onClick={save} {...(isLoading ? { loading: true } : {})}>
            Save Settings
          </s-button>
        </s-stack>
      </s-section>
    </s-page>
  );
}
