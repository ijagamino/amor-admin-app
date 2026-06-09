import {
  int,
  mysqlTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const activityLogs = mysqlTable("activity_logs", {
  id: serial().primaryKey(),
  shop: text().notNull(),
  action: text().notNull(),
  entityType: text(),
  entityId: int(),
  message: text().notNull(),
  createdAt: timestamp().defaultNow(),
});
