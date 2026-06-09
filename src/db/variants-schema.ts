import {
  mysqlTable,
  int,
  timestamp,
  uniqueIndex,
  varchar,
  serial,
  bigint,
  text,
  decimal,
} from "drizzle-orm/mysql-core";
import { products } from "./products-schema";

export const variants = mysqlTable(
  "variants",
  {
    id: serial().primaryKey(),
    shop: varchar({ length: 255 }).notNull(),
    productId: bigint({ mode: "number", unsigned: true })
      .notNull()
      .references(() => products.id),
    shopifyInventoryItemId: varchar({ length: 255 }).notNull(),
    shopifyVariantId: varchar({ length: 255 }).notNull(),
    title: text().notNull(),
    price: decimal({ precision: 10, scale: 2 }).notNull(),
    inventoryQuantity: int().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().onUpdateNow(),
  },
  (table) => ({
    shopifyUnique: uniqueIndex("unique_shop_shopifyVariantId").on(
      table.shop,
      table.shopifyVariantId,
    ),
  }),
);
