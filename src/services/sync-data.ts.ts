import { AdminContext } from "@shopify/shopify-app-react-router/server";
import { eq, sql } from "drizzle-orm";
import { db } from "src";
import { products } from "src/db/products-schema";
import { variants } from "src/db/variants-schema";
import { syncInventory } from "./sync-inventory";
import { syncOrders } from "./sync-orders";
import { logActivity } from "./log-activity";

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

export const syncData = async (adminContext: AdminContext) => {
  try {
    const { products } = await syncInventory(adminContext);
    if (!products) return;
    const { orders } = await syncOrders(adminContext);
    if (!orders) return;

    await logActivity({
      shop: adminContext.session.shop,
      action: "SYNC_DATA",
      entityType: "product,orders",
      message: `Synced ${products.length} products and ${orders.length} orders from Shopify`,
    });

    return;
  } catch (error) {
    console.error(error);
    return;
  }
};
