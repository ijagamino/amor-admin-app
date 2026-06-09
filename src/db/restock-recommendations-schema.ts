import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  serial,
  bigint,
  decimal,
} from "drizzle-orm/mysql-core";
import { variants } from "./variants-schema";

export const restockRecommendations = mysqlTable("restock_recommendations", {
  id: serial().primaryKey(),
  shop: varchar({ length: 255 }).notNull(),
  variantId: bigint({ mode: "number", unsigned: true })
    .notNull()
    .references(() => variants.id),
  currentInventory: int().notNull(),
  avgDailySales: decimal({ precision: 10, scale: 2 }).notNull(),
  daysUntilStockout: int().notNull(),
  deliveryLeadTimeDays: int().notNull(),
  safetyStockDays: int().notNull(),
  suggestedQty: int().notNull(),
  approvedQty: int(),
  status: varchar({ length: 255 }).notNull().default("pending"),
  purchaseOrderId: varchar({ length: 191 }),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});
