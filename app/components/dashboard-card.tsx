import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  children: ReactNode;
}

export default function DashboardCard({ title, children }: DashboardCardProps) {
  return (
    <s-box background="strong" padding="base" borderRadius="base">
      <s-text>{title}</s-text>
      <s-heading>{children}</s-heading>
    </s-box>
  );
}
