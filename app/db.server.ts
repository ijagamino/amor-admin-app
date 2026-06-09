import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../src/db/schema";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

function createDb() {
  return drizzle(pool, { schema, mode: "default" });
}

type Database = ReturnType<typeof createDb>;

declare global {
  // eslint-disable-next-line no-var
  var drizzleClient: Database | undefined;
}

const db = global.drizzleClient ?? createDb();

if (process.env.NODE_ENV !== "production") {
  global.drizzleClient = db;
}

export default db;
