import { db } from "src";
import { appConfigurations } from "src/db/app-configurations-schema";
import { logActivity } from "./log-activity";

interface UpdateAppConfig {
  shop: string;
  safetyStockDays: number;
  deliveryLeadTimeDays: number;
}

export const updateAppConfig = async ({
  shop,
  safetyStockDays,
  deliveryLeadTimeDays,
}: UpdateAppConfig) => {
  await db
    .insert(appConfigurations)
    .values({
      shop,
      safetyStockDays,
      deliveryLeadTimeDays,
    })
    .onDuplicateKeyUpdate({
      set: {
        safetyStockDays,
        deliveryLeadTimeDays,
        updatedAt: new Date(),
      },
    });

  await logActivity({
    shop,
    action: "UPDATE_CONFIG",
    entityType: "config",
    message: `Updated settings: safetyStockDays=${safetyStockDays}, deliveryLeadTimeDays=${deliveryLeadTimeDays}`,
  });
};
