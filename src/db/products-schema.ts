import {
  mysqlTable,
  timestamp,
  text,
  uniqueIndex,
  varchar,
  serial,
} from "drizzle-orm/mysql-core";

export const products = mysqlTable(
  "products",
  {
    id: serial().primaryKey(),
    shop: varchar({ length: 255 }).notNull(),
    shopifyProductId: varchar({ length: 255 }).notNull(),
    title: text().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().onUpdateNow(),
  },
  (table) => ({
    shopifyUnique: uniqueIndex("unique_shop_shopifyProductId").on(
      table.shop,
      table.shopifyProductId,
    ),
  }),
);
