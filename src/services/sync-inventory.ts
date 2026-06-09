import { AdminContext } from "@shopify/shopify-app-react-router/server";
import { eq, sql } from "drizzle-orm";
import { db } from "src";
import { products } from "src/db/products-schema";
import { variants } from "src/db/variants-schema";

const getProductsQuery = `
#graphql
  query GetProducts($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        variants(first: 50) {
          nodes {
            id
            title
            price
            inventoryQuantity
            inventoryItem {
              id
            }
          }
        }
      }
    }
  }
`;

interface GetProductsResponse {
  data: {
    products: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: {
        id: string;
        title: string;
        variants: {
          nodes: {
            id: string;
            title: string;
            price: string;
            inventoryQuantity: number;
            inventoryItem: {
              id: string;
            };
          }[];
        };
      }[];
    };
  };
}

export const syncInventory = async ({ admin, session }: AdminContext) => {
  const allProducts: GetProductsResponse["data"]["products"]["nodes"] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(getProductsQuery, {
      variables: { cursor },
    });

    const { data } = (await response.json()) as GetProductsResponse;
    const { nodes, pageInfo } = data.products;

    allProducts.push(...nodes);
    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  if (allProducts.length === 0) {
    return { success: true };
  }

  for (const product of allProducts) {
    await db
      .insert(products)
      .values({
        shop: session.shop,
        shopifyProductId: product.id,
        title: product.title,
      })
      .onDuplicateKeyUpdate({
        set: {
          title: sql`VALUES(title)`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  const dbProducts = await db
    .select()
    .from(products)
    .where(eq(products.shop, session.shop));

  const productMap = new Map(dbProducts.map((p) => [p.shopifyProductId, p.id]));

  const variantRows = [];

  for (const product of allProducts) {
    const internalProductId = productMap.get(product.id);

    if (!internalProductId) continue;

    for (const v of product.variants.nodes) {
      variantRows.push({
        shop: session.shop,
        productId: internalProductId,
        shopifyVariantId: v.id,
        shopifyInventoryItemId: v.inventoryItem.id,
        title: v.title,
        price: v.price ?? 0,
        inventoryQuantity: v.inventoryQuantity ?? 0,
      });
    }
  }

  if (variantRows.length > 0) {
    await db
      .insert(variants)
      .values(variantRows)
      .onDuplicateKeyUpdate({
        set: {
          title: sql`VALUES(title)`,
          price: sql`VALUES(price)`,
          inventoryQuantity: sql`VALUES(inventoryQuantity)`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  return {
    success: true,
    products: allProducts,
    variants: variantRows.length,
  };
};
