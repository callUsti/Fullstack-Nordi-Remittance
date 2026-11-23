import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Repeat,
  X,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@components/shared/DashboardPrimitives";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ClientTransactionsTableProps {
  transactions: any[];
  showBalances?: boolean;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  credit: { icon: <ArrowDownLeft size={15} />, color: "text-emerald-600 dark:text-emerald-400" },
  deposit: { icon: <ArrowDownLeft size={15} />, color: "text-emerald-600 dark:text-emerald-400" },
  refund: { icon: <ArrowDownLeft size={15} />, color: "text-blue-600 dark:text-blue-400" },
  debit: { icon: <ArrowUpRight size={15} />, color: "text-rose-600 dark:text-rose-400" },
  withdrawal: { icon: <ArrowUpRight size={15} />, color: "text-rose-600 dark:text-rose-400" },
  transfer: { icon: <Repeat size={15} />, color: "text-blue-600 dark:text-blue-400" },
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={13} />,
  success: <CheckCircle2 size={13} />,
  pending: <Clock size={13} />,
  processing: <RefreshCw size={13} />,
  failed: <XCircle size={13} />,
  cancelled: <XCircle size={13} />,
};

const formatCurrency = (amount: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
};

const formatDateTime = (date?: string) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const labelize = (v?: string) =>
  v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Transfer";

export const ClientTransactionsTable: React.FC<ClientTransactionsTableProps> = ({
  transactions,
  showBalances = true,
}) => {
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  return (
    <>
      <div
        className="w-full overflow-x-auto touch-pan-x scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="min-w-full table-auto text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
              <th className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                Reference / Party
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                Sender Bank
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                Type
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                Purpose
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                Amount
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                Status
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                Time Sent
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.map((tx: any, index: number) => {
              const rawType = (tx.type || "transfer").toLowerCase();
              const status = (tx.status || "pending").toLowerCase();
              const tConfig = typeConfig[rawType] || typeConfig.transfer;
              const isCredit = rawType === "credit" || rawType === "deposit" || rawType === "refund";
              const senderBank = tx.senderBank || tx.meta?.senderBankName || tx.recipientBankName || "Nordi Bank";
              const purpose = tx.purpose || tx.meta?.purpose || tx.description || tx.category || "Transfer";
              const txTypeLabel = tx.transferType
                ? `${labelize(rawType)} · ${labelize(tx.transferType)}`
                : tx.isInternational
                  ? `${labelize(rawType)} · Intl`
                  : labelize(rawType);

              return (
                <motion.tr
                  key={tx._id || tx.id || tx.referenceNumber || index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                  className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg bg-gray-100 p-1.5 dark:bg-gray-800 ${tConfig.color}`}>
                        {tConfig.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[160px] truncate text-xs font-medium text-gray-900 dark:text-white">
                          {tx.recipientName || tx.meta?.senderName || tx.referenceNumber || tx.reference || "Transaction"}
                        </p>
                        <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
                          {tx.referenceNumber || tx.reference || "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <Building2 size={13} className="shrink-0 text-blue-500" />
                      <span className="max-w-[140px] truncate">{senderBank}</span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      {txTypeLabel}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="max-w-[180px] truncate text-xs text-gray-600 dark:text-gray-300" title={purpose}>
                      {purpose}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <p
                      className={`text-xs font-semibold ${
                        isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {showBalances
                        ? `${isCredit ? "+" : "-"}${formatCurrency(Math.abs(Number(tx.amount) || 0), tx.currency || "USD")}`
                        : "••••••"}
                    </p>
                    {showBalances && Number(tx.fee) > 0 && (
                      <p className="text-[10px] text-gray-400">
                        Fee: {formatCurrency(Number(tx.fee), tx.feeCurrency || tx.currency || "USD")}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={status} icon={statusIcons[status]} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(tx.timeSent || tx.createdAt || tx.date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTx(tx)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      <Eye size={12} />
                      View
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                    Transaction Receipt
                  </h3>
                  <p className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                    {selectedTx.referenceNumber || selectedTx.reference || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 p-5 text-xs sm:text-sm">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Amount</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {showBalances
                        ? formatCurrency(Math.abs(Number(selectedTx.amount) || 0), selectedTx.currency || "USD")
                        : "••••••"}
                    </p>
                  </div>
                  <StatusBadge status={(selectedTx.status || "pending").toLowerCase()} />
                </div>

                {[
                  { label: "Sender Bank", value: selectedTx.senderBank || selectedTx.meta?.senderBankName || "Nordi Bank" },
                  {
                    label: "Recipient / Party",
                    value: selectedTx.recipientName || selectedTx.meta?.senderName || "—",
                  },
                  {
                    label: "Recipient Bank",
                    value: selectedTx.recipientBankName || selectedTx.meta?.bankName || "—",
                  },
                  {
                    label: "Account Number",
                    value: selectedTx.recipientAccountNumber || "—",
                  },
                  {
                    label: "Type",
                    value: selectedTx.transferType
                      ? `${labelize(selectedTx.type)} (${labelize(selectedTx.transferType)})`
                      : labelize(selectedTx.type),
                  },
                  {
                    label: "Purpose",
                    value:
                      selectedTx.purpose ||
                      selectedTx.meta?.purpose ||
                      selectedTx.description ||
                      selectedTx.category ||
                      "—",
                  },
                  {
                    label: "Fee / Charges",
                    value: showBalances
                      ? formatCurrency(Number(selectedTx.fee) || 0, selectedTx.feeCurrency || selectedTx.currency || "USD")
                      : "••••",
                  },
                  {
                    label: "Time Sent",
                    value: formatDateTime(selectedTx.timeSent || selectedTx.createdAt || selectedTx.date),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-gray-100 pb-2 last:border-b-0 dark:border-gray-800"
                  >
                    <span className="shrink-0 text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className="text-right font-medium text-gray-900 dark:text-white break-words">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClientTransactionsTable;

