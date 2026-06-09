import { db } from "src";
import { salesSnapshots } from "src/db/sales-snapshots-schema";
import { sql } from "drizzle-orm";

export async function getAvgDailySales({
  shop,
  days = 7,
}: {
  shop: string;
  days?: number;
}) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({
      variantId: salesSnapshots.variantId,
      totalSold: sql<number>`
        SUM( ${salesSnapshots.quantitySold})
      `,
    })
    .from(salesSnapshots)
    .where(
      sql`${salesSnapshots.shop} = ${shop} AND ${salesSnapshots.date} >= ${since}`,
    )
    .groupBy(salesSnapshots.variantId);

  return result.map((row) => {
    const avgDailySales = +(Number(row.totalSold) / days).toFixed(2);

    return {
      variantId: row.variantId,
      totalSold: Number(row.totalSold),
      avgDailySales,
      windowDays: days,
    };
  });
}
