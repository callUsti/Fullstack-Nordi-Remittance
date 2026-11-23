// ============================================================================
// SavingsAccounts — Spacious Admin view of Savings & Personal Wallets + Savings Applications
// ============================================================================
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Search,
  Ban,
  CheckCheck,
  XCircle,
  Clock,
  Tag,
} from "lucide-react";
import {
  PageContainer,
  DashCard,
  StatCard,
  StatsGrid,
  FilterBar,
  ActionButton,
  StatusBadge,
} from "@components/shared/DashboardPrimitives";
import { PageHeader } from "@components/shared/PageHeader";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { useToast } from "@store/toast.store";
import {
  useAccountsManagement,
  useApplicationsManagement,
  formatCurrencyAmount,
} from "../../admin-usecase/useadmin-account-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function SavingsAccounts() {
  const [accountToClose, setAccountToClose] = useState<string | null>(null);
  const toast = useToast();
  const { rawAccounts, isLoading, search, setSearch, freezeAccount, unfreezeAccount, closeAccount, refetch } =
    useAccountsManagement();
  const {
    rawApplications,
    approveApplication,
    rejectApplication,
    isApproving,
    refetch: refetchApps,
  } = useApplicationsManagement();

  const accounts = rawAccounts.filter((a: any) => a.type === "savings" || a.type === "personal");
  const savingsOnly = rawAccounts.filter((a: any) => a.type === "savings");
  const pendingSavingsApps = rawApplications.filter((a: any) => a.type === "savings" && a.status === "pending");

  const totalBalance = accounts.reduce((s: number, a: any) => s + a.balance, 0);
  const active = accounts.filter((a: any) => a.status === "active").length;

  const filteredAccounts = accounts.filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.owner.toLowerCase().includes(q) ||
      a.accountNumber.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.nickname && a.nickname.toLowerCase().includes(q)) ||
      (a.goal && a.goal.toLowerCase().includes(q))
    );
  });

  return (
    <PageContainer className="px-2 sm:px-3 lg:px-4 [&>div]:max-w-full">
      <PageHeader
        title="Savings & Personal Accounts"
        subtitle="Manage customer goal-based savings accounts, personal wallets, and pending savings applications"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Accounts", href: "/admin/accounts" },
          { label: "Savings" },
        ]}
        actions={
          <div className="flex gap-2.5">
            <ActionButton label="Export" icon={<Download size={15} />} onClick={() => {}} variant="secondary" />
            <ActionButton
              label="Refresh"
              icon={<RefreshCw size={15} />}
              onClick={() => {
                refetch();
                refetchApps();
              }}
            />
          </div>
        }
      />

      <StatsGrid cols={4}>
        <StatCard
          label="Total Savings & Personal Balance"
          value={formatCurrencyAmount(totalBalance, "USD")}
          icon={<PiggyBank size={20} />}
          iconColor="from-emerald-500 to-teal-600"
          index={0}
        />
        <StatCard
          label="Active Accounts"
          value={active}
          icon={<PiggyBank size={20} />}
          iconColor="from-emerald-400 to-emerald-600"
          positive
          index={1}
        />
        <StatCard
          label="Dedicated Savings Accounts"
          value={savingsOnly.length}
          icon={<PiggyBank size={20} />}
          iconColor="from-teal-500 to-teal-600"
          index={2}
        />
        <StatCard
          label="Pending Savings Applications"
          value={pendingSavingsApps.length}
          icon={<Clock size={20} />}
          iconColor="from-amber-500 to-orange-600"
          index={3}
        />
      </StatsGrid>

      {/* Pending Savings Applications Banner & Quick Review */}
      {pendingSavingsApps.length > 0 && (
        <DashCard padding="lg" className="mb-6 border-emerald-500/30">
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            Pending Savings Account Applications ({pendingSavingsApps.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pendingSavingsApps.map((app: any) => (
              <div
                key={app.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {app.user?.firstName} {app.user?.lastName}{" "}
                    <span className="text-xs font-normal text-gray-500">({app.user?.email})</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {app.nickname || "Savings Account"} · Initial Deposit:{" "}
                    {formatCurrencyAmount(app.initialDeposit || 0, app.currency)}
                  </p>
                  {app.goal && <p className="text-xs text-gray-500">Goal: {app.goal}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={isApproving}
                    onClick={() => {
                      approveApplication(app.id);
                      setTimeout(() => refetch(), 800);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 sm:text-sm"
                  >
                    <CheckCheck size={15} /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Reason for rejecting this savings application:");
                      if (reason) rejectApplication(app.id, reason);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 sm:text-sm"
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashCard>
      )}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search savings & personal accounts by customer, account number, nickname, or goal..."
      />

      <DashCard padding="none">
        <div className="overflow-x-auto touch-pan-x scrollbar-hide">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                {["Account Number", "Customer", "Type & Goal", "Balance", "APY Rate", "Status", "Opened", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-5 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredAccounts.map((acc: any, i: number) => (
                      <motion.tr
                        key={acc.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: i * 0.02 } }}
                        exit={{ opacity: 0 }}
                        className="border-b border-gray-100 hover:bg-gray-50/70 dark:border-gray-800/60 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                            {acc.accountNumber || "—"}
                          </p>
                          {acc.nickname && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-gray-500">
                              <Tag size={11} className="text-emerald-500" /> {acc.nickname}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                            {acc.owner}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{acc.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-xl bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {acc.typeLabel}
                          </span>
                          {acc.goal && <p className="mt-1 text-xs font-medium text-gray-500">Goal: {acc.goal}</p>}
                        </td>
                        <td className="px-5 py-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                          {formatCurrencyAmount(acc.balance, acc.currency)}
                        </td>
                        <td className="px-5 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                          {acc.interestRate > 0 ? `${acc.interestRate}% p.a.` : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={acc.status} />
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {acc.opened
                            ? new Date(acc.opened).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {acc.status === "active" && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                title="Freeze"
                                onClick={() => {
                                  freezeAccount(acc.id);
                                  toast.warning("Account frozen");
                                }}
                                className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400"
                              >
                                <Lock size={15} />
                              </motion.button>
                            )}
                            {(acc.status === "suspended" || acc.status === "frozen") && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                title="Unfreeze"
                                onClick={() => {
                                  unfreezeAccount(acc.id);
                                  toast.success("Account unfrozen");
                                }}
                                className="rounded-xl bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
                              >
                                <Unlock size={15} />
                              </motion.button>
                            )}
                            {acc.status !== "closed" && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                title="Close"
                                onClick={() => setAccountToClose(acc.id)}
                                className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
                              >
                                <Ban size={15} />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {!isLoading && filteredAccounts.length === 0 && (
          <div className="py-16 text-center">
            <Search size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-base font-medium text-gray-500">No savings accounts found</p>
          </div>
        )}
      </DashCard>

      <Modal
        isOpen={!!accountToClose}
        onClose={() => setAccountToClose(null)}
        title="Close Savings Account"
        description="Are you sure you want to close this savings account? This action cannot be undone."
        footer={
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAccountToClose(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 !bg-rose-600 hover:!bg-rose-700"
              onClick={() => {
                if (accountToClose) {
                  closeAccount(accountToClose);
                  toast.error("Account closed");
                  setAccountToClose(null);
                }
              }}
            >
              Close Account
            </Button>
          </div>
        }
      >
        <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:bg-rose-900/10 dark:text-rose-400">
          This will permanently close the selected savings account.
        </div>
      </Modal>
    </PageContainer>
  );
}
