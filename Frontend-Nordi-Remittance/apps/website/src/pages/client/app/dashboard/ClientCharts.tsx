// ============================================================================
// CLIENT CHARTS - Reusable Financial Chart Component for Dashboard & Analytics
// Dark mode + Responsive + Recharts + Skeletons
// ============================================================================

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashCard, SectionHeader } from "@components/shared/DashboardPrimitives";
import { ChartSkeleton } from "@components/skeletons/Skeletons";
import { formatCurrency } from "@core/algo";
import { useClientSpending } from "../../client-usecase/usedashboard-client-usecase";

export interface ChartDataPoint {
  date: string;
  amount: number;
  label?: string;
  secondaryAmount?: number;
}

export interface ClientChartsProps {
  title?: string;
  subtitle?: string;
  data?: ChartDataPoint[];
  isLoading?: boolean;
  type?: "area" | "bar";
  height?: number;
  currency?: string;
  color?: string;
}

export const ClientCharts: React.FC<ClientChartsProps> = ({
  title = "Account Cashflow",
  subtitle = "Income and expense trajectory over time",
  data = [],
  isLoading = false,
  type = "area",
  height = 240,
  currency = "USD",
  color = "#4f46e5",
}) => {
  const { trends, isTrendLoading } = useClientSpending();

  if (isLoading || (data.length === 0 && isTrendLoading)) return <ChartSkeleton />;

  const derivedFromTrends: ChartDataPoint[] = (trends || []).map((t: any) => ({
    date: t.month || t.date || t.period || t.label || "",
    amount: Number(t.spent ?? t.amount ?? t.total ?? 0),
  }));

  const chartData = data.length > 0 ? data : derivedFromTrends;

  if (chartData.length === 0) {
    return (
      <DashCard>
        <SectionHeader title={title} subtitle={subtitle} className="!mb-3" />
        <div
          style={{ width: "100%", height }}
          className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400"
        >
          No cashflow activity recorded yet.
        </div>
      </DashCard>
    );
  }

  return (
    <DashCard>
      <SectionHeader title={title} subtitle={subtitle} className="!mb-3" />
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
              <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value, currency), "Amount"]}
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.9)",
                  borderColor: "#374151",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="amount" fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clientChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
              <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value, currency), "Balance"]}
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.9)",
                  borderColor: "#374151",
                  borderRadius: "0.75rem",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#clientChartGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
};

export default ClientCharts;

