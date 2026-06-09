import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  serial,
  decimal,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const purchaseOrders = mysqlTable(
  "purchase_orders",
  {
    id: serial().primaryKey(),
    shop: varchar({ length: 255 }).notNull(),
    status: varchar({ length: 50 }).notNull().default("draft"),
    totalItems: int().notNull().default(0),
    totalEstimatedValue: decimal({ precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().onUpdateNow(),
  },
  (table) => ({
    shopIndex: uniqueIndex("shop_po_unique").on(table.shop, table.id),
  }),
);
