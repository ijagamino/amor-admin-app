import { AdminContext } from "@shopify/shopify-app-react-router/server";
import { eq, sql } from "drizzle-orm";
import { db } from "src";
import { salesSnapshots } from "src/db/sales-snapshots-schema";
import { variants } from "src/db/variants-schema";

const getOrdersQuery = `
#graphql
  query GetOrders($cursor: String) {
    orders(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        createdAt
        lineItems(first: 250) {
          nodes {
            quantity
            title
            variant {
              id
              title
            }
          }
        }
      }
    }
  }
`;

interface GetOrdersResponse {
  data: {
    orders: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: {
        id: string;
        createdAt: string;
        lineItems: {
          nodes: {
            quantity: number;
            title: string;
            variant: {
              id: string;
              title: string;
            } | null;
          }[];
        };
      }[];
    };
  };
}

export const syncOrders = async ({ admin, session }: AdminContext) => {
  const allOrders: GetOrdersResponse["data"]["orders"]["nodes"] = [];

  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(getOrdersQuery, {
      variables: { cursor },
    });

    const { data } = (await response.json()) as GetOrdersResponse;
    const { nodes, pageInfo } = data.orders;

    allOrders.push(...nodes);

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }
  if (allOrders.length === 0) {
    return { success: true };
  }
  const dbVariants = await db
    .select({
      id: variants.id,
      shopifyVariantId: variants.shopifyVariantId,
    })
    .from(variants)
    .where(eq(variants.shop, session.shop));

  const variantMap = new Map(
    dbVariants.map((variant) => [variant.shopifyVariantId, variant.id]),
  );
  const snapshotMap = new Map<
    string,
    {
      variantId: number;
      date: Date;
      quantitySold: number;
    }
  >();

  for (const order of allOrders) {
    const dateString = order.createdAt.slice(0, 10);

    const date = new Date(`${dateString}T00:00:00Z`);

    for (const lineItem of order.lineItems.nodes) {
      if (!lineItem.variant) {
        continue;
      }

      const variantId = variantMap.get(lineItem.variant.id);

      if (!variantId) {
        continue;
      }

      const key = `${variantId}:${dateString}`;

      const existing = snapshotMap.get(key);

      if (existing) {
        existing.quantitySold += lineItem.quantity;
      } else {
        snapshotMap.set(key, {
          variantId,
          date,
          quantitySold: lineItem.quantity,
        });
      }
    }
  }

  const snapshotRows = Array.from(snapshotMap.values()).map((snapshot) => ({
    shop: session.shop,
    variantId: snapshot.variantId,
    date: snapshot.date,
    quantitySold: snapshot.quantitySold,
  }));

  if (snapshotRows.length > 0) {
    await db
      .insert(salesSnapshots)
      .values(snapshotRows)
      .onDuplicateKeyUpdate({
        set: {
          quantitySold: sql`VALUES(quantitySold)`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  return {
    success: true,
    orders: allOrders,
    snapshots: snapshotRows.length,
  };
};
