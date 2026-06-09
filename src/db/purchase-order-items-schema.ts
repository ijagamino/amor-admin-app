import {
  mysqlTable,
  int,
  serial,
  varchar,
  timestamp,
  decimal,
  bigint,
} from "drizzle-orm/mysql-core";
import { purchaseOrders } from "./purchase-orders-schema";
import { products } from "./products-schema";
import { variants } from "./variants-schema";

export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: serial().primaryKey(),
  shop: varchar({ length: 255 }).notNull(),
  purchaseOrderId: bigint({ mode: "number", unsigned: true })
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: bigint({ mode: "number", unsigned: true })
    .notNull()
    .references(() => products.id),
  variantId: bigint({ mode: "number", unsigned: true })
    .notNull()
    .references(() => variants.id),
  title: varchar({ length: 255 }).notNull(),
  suggestedQty: int().notNull(),
  approvedQty: int().notNull(),
  unitPrice: decimal({ precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal({ precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});
