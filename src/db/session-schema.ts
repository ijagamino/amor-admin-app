import {
  bigint,
  boolean,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const session = mysqlTable("session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  shop: text().notNull(),
  state: text().notNull(),
  isOnline: boolean().notNull().default(false),
  scope: text(),
  expires: timestamp("expires", { mode: "date" }),
  accessToken: text().notNull(),
  userId: bigint({ mode: "number" }),
  firstName: text(),
  lastName: text(),
  email: text(),
  accountOwner: boolean(),
  locale: text(),
  collaborator: boolean(),
  emailVerified: boolean(),
  refreshToken: text(),
  refreshTokenExpires: timestamp("refreshTokenExpires", { mode: "date" }),
});
