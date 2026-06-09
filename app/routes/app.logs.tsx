import { db } from "src";
import { activityLogs } from "src/db/activity-logs-schema";
import { eq, desc } from "drizzle-orm";
import { authenticate } from "app/shopify.server";
import { LoaderFunctionArgs, useLoaderData } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const logs = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.shop, session.shop))
    .orderBy(desc(activityLogs.createdAt))
    .limit(100);

  return { logs };
};

export default function LogsPage() {
  const { logs } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Activity Logs">
      <s-section heading="Recent activity">
        <s-stack gap="base">
          {logs.length === 0 ? (
            <s-text>No activity yet</s-text>
          ) : (
            logs.map((log) => (
              <s-box key={log.id} padding="base" background="subdued">
                <s-stack gap="small">
                  <s-text>{log.action}</s-text>
                  <s-text>{log.message}</s-text>
                  <s-text tone="caution">
                    {new Date(log.createdAt!).toLocaleString()}
                  </s-text>
                </s-stack>
              </s-box>
            ))
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}
