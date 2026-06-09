import {
  mysqlTable,
  int,
  timestamp,
  uniqueIndex,
  varchar,
  serial,
  bigint,
  date,
} from "drizzle-orm/mysql-core";
import { variants } from "./variants-schema";

export const salesSnapshots = mysqlTable(
  "sales_snapshots",
  {
    id: serial().primaryKey(),
    shop: varchar({ length: 255 }).notNull(),
    variantId: bigint({ mode: "number", unsigned: true })
      .notNull()
      .references(() => variants.id),
    date: date().notNull(),
    quantitySold: int().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().onUpdateNow(),
  },
  (table) => ({
    shopifyUnique: uniqueIndex("unique_shop_variantId_date").on(
      table.shop,
      table.variantId,
      table.date,
    ),
  }),
);
