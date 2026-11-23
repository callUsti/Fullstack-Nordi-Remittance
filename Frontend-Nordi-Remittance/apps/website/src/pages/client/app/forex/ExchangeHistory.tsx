// ============================================================================
// FOREX SUB-PAGES — Exchange History
// Dark mode + DashboardPrimitives + grey borders + responsive typography
// Integrated with Backend Transactions Module
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import {
  PageContainer, DashCard, StatusBadge,
} from "@components/shared/DashboardPrimitives";
import { TableSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useClientTransactions } from "../../client-usecase/usetransaction-client-usecase";
import { formatCurrency } from "@core/algo";

const ExchangeHistory: React.FC = () => {
  const { transactions, isLoading } = useClientTransactions({
    type: "transfer" as any,
    limit: 25,
  });

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Exchange History"
          subtitle="Your past foreign exchange conversions and cross-border transfers"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Forex", href: "/customer/forex" },
            { label: "History" },
          ]}
        />
      </motion.div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No Exchange History"
          description="You haven't completed any foreign exchange conversions yet. Exchange transactions will be logged here."
        />
      ) : (
        <DashCard padding="none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Exchange Records</h3>
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  {["Date", "Reference", "Currency", "Amount", "Recipient / Note", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((t: any, i: number) => {
                  const dateStr = t.createdAt
                    ? new Date(t.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    : "Recent";
                  const ref = t.reference || t.id?.substring(0, 8) || `#TXN-${i + 1}`;
                  const curr = t.currency || "USD";
                  const amt = typeof t.amount === "number" ? t.amount : parseFloat(t.amount || 0);

                  return (
                    <tr key={t.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{dateStr}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{ref}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{curr}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(amt, curr)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {t.description || t.recipientName || "Internal transfer / conversion"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={(t.status || "completed").toLowerCase() as any} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile view */}
          <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.map((t: any, i: number) => {
              const dateStr = t.createdAt
                ? new Date(t.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
                : "Recent";
              const curr = t.currency || "USD";
              const amt = typeof t.amount === "number" ? t.amount : parseFloat(t.amount || 0);

              return (
                <div key={t.id || i} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(amt, curr)}
                    </span>
                    <StatusBadge status={(t.status || "completed").toLowerCase() as any} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{dateStr}</span>
                    <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                      {t.description || "Forex exchange"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </DashCard>
      )}
    </PageContainer>
  );
};

export default ExchangeHistory;
