import { db } from "src";
import { activityLogs } from "src/db/activity-logs-schema";

export async function logActivity(input: {
  shop: string;
  action: string;
  entityType?: string;
  entityId?: number;
  message: string;
}) {
  await db.insert(activityLogs).values({
    shop: input.shop,
    action: input.action,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    message: input.message,
  });
}
