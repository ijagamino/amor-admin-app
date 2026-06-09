import { db } from "src";
import { appConfigurations } from "src/db/app-configurations-schema";
import { eq } from "drizzle-orm";

export async function getAppConfig(shop: string) {
  const config = await db
    .select()
    .from(appConfigurations)
    .where(eq(appConfigurations.shop, shop))
    .limit(1);

  const row = config[0];

  const deliveryLeadTimeDays = row?.deliveryLeadTimeDays ?? 7;
  const safetyStockDays = row?.safetyStockDays ?? 7;
  const protectionDays = deliveryLeadTimeDays + safetyStockDays;

  return {
    deliveryLeadTimeDays,
    safetyStockDays,
    protectionDays,
  };
}
