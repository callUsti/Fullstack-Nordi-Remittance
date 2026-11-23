// ============================================================================
// DOWNLOAD STATEMENT — Modern statement generator & PDF/CSV/Excel exporter
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, FileSpreadsheet, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { PageContainer, DashCard } from "@components/shared/DashboardPrimitives";
import { EmptyState } from "@components/shared/EmptyState";
import { dashboardItemVariants } from "@core/animation/Animation";
import apiClient from "@core/api/client";
import { useReports } from "@hooks/api-queries/useLegal";
import { useClientWallets, formatWalletBalances } from "../../client-usecase/useaccounts-client-usecase";
import { useToast } from "@store/toast.store";

/* eslint-disable @typescript-eslint/no-explicit-any */

const FORMAT_OPTIONS = [
  { id: "pdf", label: "PDF Document", ext: "pdf", icon: <FileText size={16} /> },
  { id: "csv", label: "CSV Sheet", ext: "csv", icon: <FileSpreadsheet size={16} /> },
  { id: "excel", label: "Excel (.xlsx)", ext: "xlsx", icon: <FileSpreadsheet size={16} /> },
] as const;

const DATE_PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

const DownloadStatement: React.FC = () => {
  const toast = useToast();
  const { wallets } = useClientWallets();
  const realWallets = wallets.filter((w) => !w.isApplicationOnly && !w.id.startsWith("app-"));

  const { data: reportsData, refetch: refetchReports, isLoading: reportsLoading } = useReports();
  const reports: any[] = Array.isArray((reportsData as any)?.data)
    ? (reportsData as any).data
    : Array.isArray((reportsData as any)?.reports)
      ? (reportsData as any).reports
      : [];

  const [accountId, setAccountId] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [format, setFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const applyPreset = (days: number) => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setDateRange({ from, to });
  };

  const triggerBlobDownload = (blobData: BlobPart, filename: string, mimeType: string) => {
    const blob = new Blob([blobData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleGenerateAndDownload = async () => {
    setDownloading(true);
    try {
      const ext = format === "excel" ? "xlsx" : format;
      const res = await apiClient.get("/legal/statements/export", {
        params: {
          accountId: accountId || undefined,
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

      triggerBlobDownload(res.data, `Nordi-Statement-${dateRange.to || "export"}.${ext}`, mime);
      toast.success(`${format.toUpperCase()} statement downloaded`);
      refetchReports();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to generate statement");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSaved = async (report: any) => {
    const reportId = report.id || report._id;
    const fmt = (report.format || "pdf").toLowerCase();
    const ext = fmt === "excel" ? "xlsx" : fmt;
    setDownloadingId(reportId);
    try {
      const res = await apiClient.get(`/legal/reports/${reportId}/file`, {
        responseType: "blob",
      });
      const mime =
        fmt === "pdf"
          ? "application/pdf"
          : fmt === "csv"
            ? "text/csv;charset=utf-8;"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      triggerBlobDownload(res.data, `Nordi-Statement-${String(reportId).slice(0, 8)}.${ext}`, mime);
      toast.success("Statement downloaded");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not download statement");
    } finally {
      setDownloadingId(null);
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors";
  const labelCls = "block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Download Statement"
          subtitle="Export official PDF, CSV, or Excel statements for any period"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Transactions", href: "/customer/transactions" },
            { label: "Download" },
          ]}
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Generator */}
        <div className="lg:col-span-7">
          <DashCard padding="lg">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                  Generate Transaction Statement
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Includes sender bank, purpose, type, fees, and timestamps
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Account / Wallet</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
                  <option value="">All Accounts &amp; Wallets</option>
                  {realWallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.displayName} ({w.typeLabel}) — •••• {w.walletNumber.slice(-4)} ({formatWalletBalances(w)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">Date Range</label>
                  <div className="flex gap-1.5">
                    {DATE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPreset(p.days)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                    className={inputCls}
                  />
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
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormat(opt.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all sm:flex-row sm:text-sm ${
                        format === opt.id
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                type="button"
                disabled={downloading}
                onClick={handleGenerateAndDownload}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 sm:text-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {downloading ? "Generating Statement..." : `Download ${format.toUpperCase()} Statement`}
              </motion.button>
            </div>
          </DashCard>
        </div>

        {/* Right: Previous Downloads */}
        <div className="lg:col-span-5">
          <DashCard padding="lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Previous Downloads</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{reports.length} saved</span>
            </div>

            {reportsLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <EmptyState
                title="No Statements Yet"
                description="Your generated PDF, CSV, and Excel statements will appear here."
              />
            ) : (
              <div className="space-y-2">
                {reports.slice(0, 8).map((item: any) => {
                  const id = item.id || item._id;
                  const fmt = String(item.format || "pdf").toUpperCase();
                  const startStr = item.startDate ? new Date(item.startDate).toLocaleDateString() : "";
                  const endStr = item.endDate ? new Date(item.endDate).toLocaleDateString() : "";
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleDownloadSaved(item)}
                      disabled={downloadingId === id}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:border-blue-800/50 dark:hover:bg-gray-800/60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                            {startStr && endStr ? `${startStr} – ${endStr}` : "Account Statement"}
                          </p>
                          <p className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                            <Calendar size={11} /> {fmt} · {item.currency || "USD"}
                            {item.downloadCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={10} /> {item.downloadCount}x
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {downloadingId === id ? (
                        <Loader2 size={16} className="shrink-0 animate-spin text-blue-600" />
                      ) : (
                        <Download size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </DashCard>
        </div>
      </div>
    </PageContainer>
  );
};

export default DownloadStatement;
