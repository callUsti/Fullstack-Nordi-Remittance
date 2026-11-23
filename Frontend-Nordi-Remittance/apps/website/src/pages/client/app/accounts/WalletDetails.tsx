// ============================================================================
// WALLET DETAILS — Spacious single wallet/account view + full ledger history
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
  Lock,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { PageContainer, DashCard, StatusBadge } from "@components/shared/DashboardPrimitives";
import { StatsGridSkeleton, AccountListSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientWalletDetail,
  useClientBalanceHistory,
  useUpdateWallet,
  useCloseWallet,
} from "../../client-usecase/useaccounts-client-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

const fmt = (n: number, c = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c, minimumFractionDigits: 2 }).format(n);
  } catch {
    return `${c} ${(Number(n) || 0).toFixed(2)}`;
  }
};

const WalletDetails: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const navigate = useNavigate();

  const { wallet, limit, isLoading } = useClientWalletDetail(walletId as UUID);
  const [page, setPage] = useState(1);
  const [entryType, setEntryType] = useState<"" | "debit" | "credit">("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [copied, setCopied] = useState(false);

  const {
    entries,
    pagination,
    isLoading: historyLoading,
  } = useClientBalanceHistory(walletId as UUID, {
    page,
    limit: 20,
    type: entryType || undefined,
    startDate: dateRange.from || undefined,
    endDate: dateRange.to || undefined,
  });

  const updateWallet = useUpdateWallet();
  const closeWallet = useCloseWallet();
  const [renaming, setRenaming] = useState(false);
  const [notes, setNotes] = useState("");

  const inputCls =
    "px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400";

  if (isLoading) {
    return (
      <PageContainer>
        <StatsGridSkeleton count={3} />
        <div className="mt-6">
          <AccountListSkeleton count={4} />
        </div>
      </PageContainer>
    );
  }

  if (!wallet) {
    return (
      <PageContainer>
        <DashCard padding="lg" className="text-center">
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">Account or wallet not found.</p>
          <button
            onClick={() => navigate("/customer/accounts")}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            Back to My Accounts
          </button>
        </DashCard>
      </PageContainer>
    );
  }

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(wallet.walletNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants} className="mb-4">
        <button
          onClick={() => navigate("/customer/accounts")}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> Back to My Accounts
        </button>
      </motion.div>

      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title={wallet.displayName || `${wallet.typeLabel}`}
          subtitle={`${wallet.typeLabel} · Account Number: ${wallet.walletNumber}`}
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Accounts", href: "/customer/accounts" },
            { label: wallet.displayName || "Account Details" },
          ]}
        />
      </motion.div>

      {/* Main Account Overview Card */}
      <DashCard padding="lg" className="mb-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {wallet.typeLabel}
              </span>
              <StatusBadge status={wallet.status} />
              {wallet.isPrimary && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <Star size={13} /> Primary Account
                </span>
              )}
              <button
                onClick={copyAccountNumber}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 font-mono text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {wallet.walletNumber}
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Available Balance
              </p>
              {wallet.balancesByCurrency.length === 0 ? (
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{fmt(0)}</p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-4">
                  {wallet.balancesByCurrency.map((b) => (
                    <p key={b.currency} className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                      {fmt(b.amount, b.currency)}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {(wallet.goal ||
              wallet.interestRate !== undefined ||
              wallet.termMonths !== undefined ||
              wallet.purpose ||
              wallet.businessName ||
              wallet.overdraftRequested) && (
              <div className="flex flex-wrap gap-2.5 pt-1 text-sm">
                {wallet.goal && (
                  <span className="rounded-xl bg-emerald-50 px-3.5 py-1.5 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Goal: {wallet.goal}
                  </span>
                )}
                {wallet.interestRate !== undefined && wallet.interestRate > 0 && (
                  <span className="rounded-xl bg-amber-50 px-3.5 py-1.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    Interest Rate: {wallet.interestRate}% p.a.
                  </span>
                )}
                {wallet.termMonths !== undefined && (
                  <span className="rounded-xl bg-amber-50 px-3.5 py-1.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    Term: {wallet.termMonths} Months
                  </span>
                )}
                {wallet.maturityDate && (
                  <span className="rounded-xl bg-amber-50 px-3.5 py-1.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    Matures: {new Date(wallet.maturityDate).toLocaleDateString()}
                  </span>
                )}
                {(wallet.businessName || wallet.purpose) && (
                  <span className="rounded-xl bg-blue-50 px-3.5 py-1.5 font-medium capitalize text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    Purpose: {wallet.businessName || wallet.purpose}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/customer/send/domestic")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <ArrowUpRight size={16} /> Send Money
            </button>
            {!wallet.isPrimary && wallet.status === "active" && (
              <button
                onClick={() => updateWallet.mutate({ walletId: wallet.id as UUID, data: { isPrimary: true } })}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Set as Primary
              </button>
            )}
            <button
              onClick={() => {
                setNotes(wallet.nickname || wallet.displayName || "");
                setRenaming((r) => !r);
              }}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Pencil size={15} /> Rename
            </button>
            {!wallet.isPrimary && wallet.status === "active" && (
              <button
                onClick={() => {
                  if (confirm("Close this account? Note: balance must be zero before closing.")) {
                    closeWallet.mutate(wallet.id as UUID);
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                <Lock size={15} /> Close Account
              </button>
            )}
          </div>
        </div>

        {renaming && (
          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row">
            <input
              className={inputCls + " flex-1"}
              placeholder="Enter new account nickname"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={() => {
                updateWallet.mutate(
                  { walletId: wallet.id as UUID, data: { nickname: notes, name: notes } as any },
                  { onSuccess: () => setRenaming(false) },
                );
              }}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Nickname
            </button>
          </div>
        )}

        {closeWallet.isError && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {(closeWallet.error as any)?.response?.data?.message || "Couldn't close account."}
          </p>
        )}
      </DashCard>

      {/* Per-wallet limit */}
      {limit && (
        <DashCard padding="lg" className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  Account Transaction Limit
                </h3>
                <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
                  {limit.limitType} · {limit.category}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {fmt(limit.usedAmount, limit.currency)} / {fmt(limit.amount, limit.currency)}
              </p>
              <p className="text-xs text-gray-500">Used in current period</p>
            </div>
          </div>
        </DashCard>
      )}

      {/* Ledger / balance history */}
      <DashCard padding="none">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">Transaction Ledger</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              Complete credit and debit history for this account
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <select
              value={entryType}
              onChange={(e) => {
                setPage(1);
                setEntryType(e.target.value as "" | "debit" | "credit");
              }}
              className={inputCls}
            >
              <option value="">All Entries</option>
              <option value="credit">Credits (+)</option>
              <option value="debit">Debits (-)</option>
            </select>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => {
                setPage(1);
                setDateRange((p) => ({ ...p, from: e.target.value }));
              }}
              className={inputCls}
            />
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => {
                setPage(1);
                setDateRange((p) => ({ ...p, to: e.target.value }));
              }}
              className={inputCls}
            />
          </div>
        </div>

        {historyLoading ? (
          <div className="p-6">
            <AccountListSkeleton count={4} />
          </div>
        ) : entries.length === 0 ? (
          <p className="p-10 text-center text-sm font-medium text-gray-400 dark:text-gray-500 sm:text-base">
            No ledger entries match these filters yet.
          </p>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30 sm:px-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-2xl p-3 ${
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
                        {entry.isReversed && (
                          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                            Reversed
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base font-semibold sm:text-lg ${
                        entry.entryType === "credit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {entry.entryType === "credit" ? "+" : "-"}
                      {fmt(entry.amount, entry.currency)}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                      Bal: {fmt(entry.balance, entry.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 p-5 dark:border-gray-800 sm:px-6">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} total entries
              </p>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-gray-200 p-2 disabled:opacity-40 dark:border-gray-700"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-gray-200 p-2 disabled:opacity-40 dark:border-gray-700"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </DashCard>
    </PageContainer>
  );
};

export default WalletDetails;
