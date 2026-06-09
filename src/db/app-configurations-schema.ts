import {
  int,
  mysqlTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const appConfigurations = mysqlTable(
  "app_configurations",
  {
    id: serial().primaryKey(),
    shop: varchar({ length: 255 }).notNull(),
    safetyStockDays: int(),
    deliveryLeadTimeDays: int(),
    updatedAt: timestamp().onUpdateNow(),
  },
  (table) => ({
    shopifyUnique: uniqueIndex("unique_shop").on(table.shop),
  }),
);
