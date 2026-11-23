// ============================================================================
// ACCOUNT STATEMENTS — Live Ledger Preview + Real CSV / Printable Statement Export
// ============================================================================

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileText, ArrowDownLeft, ArrowUpRight, Printer, Loader2 } from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { PageContainer, DashCard } from "@components/shared/DashboardPrimitives";
import { FormSkeleton, AccountListSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import apiClient from "@core/api/client";
import {
  useClientWallets,
  useClientBalanceHistory,
  formatWalletBalances,
} from "../../client-usecase/useaccounts-client-usecase";
import { useToast } from "@store/toast.store";

const fmt = (n: number, c = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c, minimumFractionDigits: 2 }).format(n);
  } catch {
    return `${c} ${(Number(n) || 0).toFixed(2)}`;
  }
};

const AccountStatements: React.FC = () => {
  const toast = useToast();
  const { wallets, isLoading } = useClientWallets();
  const realWallets = wallets.filter((w) => !w.isApplicationOnly && !w.id.startsWith("app-"));

  const [selectedAccount, setSelectedAccount] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [format, setFormat] = useState<"csv" | "pdf" | "excel">("pdf");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!selectedAccount && realWallets.length > 0) {
      setSelectedAccount(realWallets[0].id);
    }
  }, [realWallets, selectedAccount]);

  const { entries, isLoading: entriesLoading } = useClientBalanceHistory(
    (selectedAccount || realWallets[0]?.id || "") as UUID,
    {
      page: 1,
      limit: 100,
      startDate: dateRange.from || undefined,
      endDate: dateRange.to || undefined,
    },
  );

  const selectedWalletObj = realWallets.find((w) => w.id === selectedAccount);

  const handleDownloadStatement = async () => {
    if (!selectedWalletObj) {
      toast.error("Please select an account first");
      return;
    }

    setDownloading(true);
    try {
      const ext = format === "excel" ? "xlsx" : format;
      const res = await apiClient.get("/legal/statements/export", {
        params: {
          accountId: selectedWalletObj.id,
          startDate: dateRange.from || undefined,
          endDate: dateRange.to || undefined,
          format,
        },
        responseType: "blob",
      });
      const mime =
        format === "pdf"
          ? "application/pdf"
          : format === "csv"
            ? "text/csv;charset=utf-8;"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Nordi-Statement-${selectedWalletObj.walletNumber.slice(-4)}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} Statement downloaded successfully`);
    } catch {
      if (format === "pdf") {
        window.print();
        toast.success("Statement prepared for PDF print/save");
      } else {
        toast.error("Failed to download statement");
      }
    } finally {
      setDownloading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors";
  const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Account Statements"
          subtitle="Preview your live account ledger and export official statements in CSV or PDF"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Accounts", href: "/customer/accounts" },
            { label: "Statements" },
          ]}
        />
      </motion.div>

      {isLoading ? (
        <FormSkeleton fields={4} />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Statement Generator Controls */}
          <div className="lg:col-span-5">
            <DashCard padding="lg">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                    Generate Statement
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    Select any wallet or bank account below
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Select Account / Wallet</label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Choose an account</option>
                    {realWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.displayName} ({w.typeLabel}) — •••• {w.walletNumber.slice(-4)} ({formatWalletBalances(w)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>From Date (optional)</label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>To Date (optional)</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Export Format</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormat("pdf")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all sm:text-sm ${
                        format === "pdf"
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <FileText size={15} /> PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat("csv")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all sm:text-sm ${
                        format === "csv"
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <Download size={15} /> CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat("excel")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all sm:text-sm ${
                        format === "excel"
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <Download size={15} /> Excel
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <motion.button
                    onClick={handleDownloadStatement}
                    disabled={!selectedAccount || downloading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 sm:text-sm"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {downloading ? "Generating..." : `Download ${format.toUpperCase()}`}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:text-sm"
                  >
                    <Printer size={15} /> Print
                  </button>
                </div>
              </div>
            </DashCard>
          </div>

          {/* Live Statement Preview */}
          <div className="lg:col-span-7">
            <DashCard padding="none">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-6 dark:border-gray-800">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                    Statement Ledger Preview
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    {selectedWalletObj
                      ? `${selectedWalletObj.displayName} · Acct •••• ${selectedWalletObj.walletNumber.slice(-4)}`
                      : "Select an account to preview entries"}
                  </p>
                </div>
                {selectedWalletObj && (
                  <div className="rounded-xl bg-blue-50 px-4 py-2 text-right dark:bg-blue-950/50">
                    <p className="text-[11px] font-medium uppercase text-blue-600 dark:text-blue-400">
                      Closing Balance
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fmt(selectedWalletObj.primaryCurrencyBalance, selectedWalletObj.primaryCurrency)}
                    </p>
                  </div>
                )}
              </div>

              {entriesLoading ? (
                <div className="p-6">
                  <AccountListSkeleton count={4} />
                </div>
              ) : entries.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
                    No ledger transactions recorded for this period.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-5 sm:px-6">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`rounded-xl p-2.5 ${
                            entry.entryType === "credit"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400"
                          }`}
                        >
                          {entry.entryType === "credit" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                            {entry.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-base font-semibold ${
                            entry.entryType === "credit"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {entry.entryType === "credit" ? "+" : "-"}
                          {fmt(entry.amount, entry.currency)}
                        </p>
                        <p className="text-xs text-gray-400">Bal: {fmt(entry.balance, entry.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AccountStatements;
