// ============================================================================
// DormantAccounts — Spacious Admin view of Suspended, Frozen & Closed Accounts
// ============================================================================
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Unlock, RefreshCw, Ban, AlertTriangle, Tag } from "lucide-react";
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
import { useAccountsManagement, formatCurrencyAmount } from "../../admin-usecase/useadmin-account-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function DormantAccounts() {
  const [accountToClose, setAccountToClose] = useState<string | null>(null);
  const toast = useToast();
  const { rawAccounts, isLoading, search, setSearch, unfreezeAccount, closeAccount, refetch } =
    useAccountsManagement();

  const dormantAccounts = rawAccounts.filter(
    (a: any) => a.status === "suspended" || a.status === "dormant" || a.status === "frozen",
  );
  const closedAccounts = rawAccounts.filter((a: any) => a.status === "closed");
  const totalDormantBalance = dormantAccounts.reduce((s: number, a: any) => s + a.balance, 0);

  const allInactive = [...dormantAccounts, ...closedAccounts];
  const filtered = allInactive.filter((a: any) => {
    const q = search.toLowerCase();
    return (
      !search ||
      a.owner.toLowerCase().includes(q) ||
      a.accountNumber.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.nickname && a.nickname.toLowerCase().includes(q))
    );
  });

  return (
    <PageContainer className="px-2 sm:px-3 lg:px-4 [&>div]:max-w-full">
      <PageHeader
        title="Dormant, Frozen & Closed Accounts"
        subtitle="Monitor and reactivate suspended, frozen, and archived customer wallets"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Accounts", href: "/admin/accounts" },
          { label: "Dormant" },
        ]}
        actions={<ActionButton label="Refresh" icon={<RefreshCw size={15} />} onClick={() => refetch()} />}
      />

      <StatsGrid cols={4}>
        <StatCard
          label="Dormant / Frozen"
          value={dormantAccounts.length}
          icon={<Clock size={20} />}
          iconColor="from-amber-500 to-amber-600"
          index={0}
        />
        <StatCard
          label="Locked Funds"
          value={formatCurrencyAmount(totalDormantBalance, "USD")}
          icon={<AlertTriangle size={20} />}
          iconColor="from-orange-500 to-orange-600"
          index={1}
        />
        <StatCard
          label="Closed Accounts"
          value={closedAccounts.length}
          icon={<Ban size={20} />}
          iconColor="from-rose-500 to-rose-600"
          index={2}
        />
        <StatCard
          label="Total Inactive"
          value={allInactive.length}
          icon={<Clock size={20} />}
          iconColor="from-gray-500 to-gray-600"
          index={3}
        />
      </StatsGrid>

      {dormantAccounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-950/30"
        >
          <AlertTriangle size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            <strong>{dormantAccounts.length}</strong> account{dormantAccounts.length !== 1 ? "s" : ""} currently frozen
            or dormant — review and reactivate if appropriate.
          </p>
        </motion.div>
      )}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search inactive accounts by customer name, email, or account number..."
      />

      <DashCard padding="none">
        <div className="overflow-x-auto touch-pan-x scrollbar-hide">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                {["Account Number", "Customer", "Account Type", "Balance", "Status", "Last Activity", "Actions"].map(
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
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-5 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.map((acc: any, i: number) => (
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
                              <Tag size={11} /> {acc.nickname}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                            {acc.owner}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{acc.email}</p>
                        </td>
                        <td className="px-5 py-4 font-medium capitalize text-gray-700 dark:text-gray-300">
                          {acc.typeLabel}
                        </td>
                        <td className="px-5 py-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                          {formatCurrencyAmount(acc.balance, acc.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={acc.status} />
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {acc.lastActivity
                            ? new Date(acc.lastActivity).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {(acc.status === "suspended" || acc.status === "frozen" || acc.status === "dormant") && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                title="Reactivate"
                                onClick={() => {
                                  unfreezeAccount(acc.id);
                                  toast.success("Account reactivated");
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                              >
                                <Unlock size={14} /> Reactivate
                              </motion.button>
                            )}
                            {acc.status !== "closed" && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                title="Close permanently"
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
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <Clock size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-base font-medium text-gray-500">No dormant or closed accounts found</p>
          </div>
        )}
      </DashCard>

      <Modal
        isOpen={!!accountToClose}
        onClose={() => setAccountToClose(null)}
        title="Permanently Close Account"
        description="Are you sure you want to permanently close this account? This action cannot be undone."
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
          This will permanently close the selected customer account.
        </div>
      </Modal>
    </PageContainer>
  );
}
