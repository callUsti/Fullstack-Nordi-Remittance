// ============================================================================
// AccountsManagement — Spacious Admin hub for all user wallets & bank accounts
// ============================================================================
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  Building2,
  PiggyBank,
  Clock,
  Download,
  RefreshCw,
  ChevronDown,
  Search,
  Lock,
  Unlock,
  Ban,
  Briefcase,
  Users,
  Tag,
} from "lucide-react";
import {
  PageContainer,
  DashCard,
  StatCard,
  StatsGrid,
  FilterBar,
  FilterSelect,
  FilterPill,
  ActionButton,
  StatusBadge,
} from "@components/shared/DashboardPrimitives";
import { PageHeader } from "@components/shared/PageHeader";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { useToast } from "@store/toast.store";
import { useAccountsManagement, formatCurrencyAmount } from "../../admin-usecase/useadmin-account-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

const accountTypeIcons: Record<string, React.ReactNode> = {
  savings: <PiggyBank size={16} />,
  current: <Building2 size={16} />,
  fixed_deposit: <Lock size={16} />,
  "fixed-deposit": <Lock size={16} />,
  personal: <Wallet size={16} />,
  business: <Briefcase size={16} />,
  wallet: <Wallet size={16} />,
};

const accountTypeColors: Record<string, string> = {
  savings: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  current: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  fixed_deposit: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  "fixed-deposit": "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  personal: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300",
  business: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
  wallet: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300",
};

const statusFilters = ["All", "Active", "Dormant", "Frozen", "Closed"];

export default function AccountsManagement() {
  const toast = useToast();
  const {
    accounts: filtered,
    userAccountsMap,
    stats,
    search,
    setSearch,
    statusFilter: activeStatus,
    setStatusFilter: setActiveStatus,
    typeFilter,
    setTypeFilter,
    freezeAccount,
    unfreezeAccount,
    closeAccount,
    refetch,
    pagination,
    setPage,
  } = useAccountsManagement();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accountToClose, setAccountToClose] = useState<any | null>(null);

  return (
    <PageContainer className="px-2 sm:px-3 lg:px-4 [&>div]:max-w-full">
      <PageHeader
        title="All Bank Accounts & Wallets"
        subtitle="Comprehensive view of every customer Personal, Business, Current, Savings, and Fixed Deposit account"
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Accounts" }]}
        actions={
          <div className="flex gap-2.5">
            <ActionButton label="Export CSV" icon={<Download size={15} />} onClick={() => {}} variant="secondary" />
            <ActionButton label="Refresh" icon={<RefreshCw size={15} />} onClick={() => refetch()} />
          </div>
        }
      />

      <StatsGrid cols={4}>
        <StatCard
          label="Total Balance (AUM)"
          value={formatCurrencyAmount(stats.totalBalance, "USD")}
          icon={<Wallet size={20} />}
          iconColor="from-indigo-500 to-indigo-600"
          index={0}
        />
        <StatCard
          label="Active Accounts"
          value={stats.activeAccounts}
          icon={<CreditCard size={20} />}
          iconColor="from-emerald-500 to-emerald-600"
          positive
          index={1}
        />
        <StatCard
          label="Dormant / Frozen"
          value={stats.dormantAccounts}
          icon={<Clock size={20} />}
          iconColor="from-amber-500 to-amber-600"
          index={2}
        />
        <StatCard
          label="Total Accounts · Users"
          value={`${stats.totalAccounts} · ${stats.uniqueUsersCount || 0} Users`}
          icon={<Users size={20} />}
          iconColor="from-blue-500 to-blue-600"
          index={3}
        />
      </StatsGrid>

      <div className="mb-4 flex gap-2.5 overflow-x-auto pb-1 touch-pan-x scrollbar-hide">
        {statusFilters.map((s) => (
          <FilterPill key={s} label={s} active={activeStatus === s} onClick={() => setActiveStatus(s as any)} />
        ))}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by owner name, email, account number, nickname, or goal..."
      >
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All Account Types" },
            { value: "personal", label: "Personal Wallets" },
            { value: "business", label: "Business Wallets" },
            { value: "savings", label: "Savings Accounts" },
            { value: "current", label: "Current Accounts" },
            { value: "fixed_deposit", label: "Fixed Deposits" },
          ]}
        />
      </FilterBar>

      {/* Accounts Table */}
      <DashCard padding="none">
        <div className="overflow-x-auto touch-pan-x scrollbar-hide">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                {[
                  "Account & Label",
                  "Customer",
                  "Account Type",
                  "Balance",
                  "Rate / Details",
                  "Status",
                  "Last Activity",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((acc: any, i: number) => {
                  const isExpanded = expandedId === acc.id;
                  const userWallets = userAccountsMap[acc.userId] || userAccountsMap[acc.email] || [acc];
                  return (
                    <React.Fragment key={acc.id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: i * 0.02 } }}
                        exit={{ opacity: 0 }}
                        className="border-b border-gray-100 transition-colors hover:bg-gray-50/70 dark:border-gray-800/60 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                              {acc.accountNumber}
                            </p>
                            {acc.isPrimary && (
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                Primary
                              </span>
                            )}
                          </div>
                          {acc.nickname && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                              <Tag size={11} className="text-indigo-500" /> {acc.nickname}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                            {acc.owner}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{acc.email}</p>
                          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {userWallets.length} Total Account{userWallets.length !== 1 ? "s" : ""}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium ${
                              accountTypeColors[acc.type] || accountTypeColors.wallet
                            }`}
                          >
                            {accountTypeIcons[acc.type] || accountTypeIcons.wallet}
                            {acc.typeLabel}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                            {formatCurrencyAmount(acc.balance, acc.currency)}
                          </p>
                          <p className="text-xs font-medium text-gray-400">{acc.currency}</p>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {acc.interestRate > 0 ? (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {acc.interestRate}% p.a.
                            </span>
                          ) : acc.overdraftRequested ? (
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Overdraft</span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={acc.status} />
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {acc.lastActivity
                            ? new Date(acc.lastActivity).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : acc.id)}
                              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                              title="View All User Accounts & Details"
                            >
                              Accounts ({userWallets.length})
                              <ChevronDown
                                size={13}
                                className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>
                            {acc.status === "active" && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  freezeAccount(acc.id);
                                  toast.warning(`Account ${acc.accountNumber} frozen`);
                                }}
                                className="rounded-xl bg-amber-50 p-2 text-amber-600 transition-colors hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400"
                                title="Freeze Account"
                              >
                                <Lock size={15} />
                              </motion.button>
                            )}
                            {(acc.status === "frozen" || acc.status === "suspended" || acc.status === "dormant") && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  unfreezeAccount(acc.id);
                                  toast.success(`Account ${acc.accountNumber} reactivated`);
                                }}
                                className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
                                title="Reactivate Account"
                              >
                                <Unlock size={15} />
                              </motion.button>
                            )}
                            {acc.status !== "closed" && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setAccountToClose(acc)}
                                className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
                                title="Close Account"
                              >
                                <Ban size={15} />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded Panel: All Wallets & Accounts Associated with this User */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td colSpan={8} className="bg-gray-50/90 px-6 py-5 dark:bg-gray-800/50">
                              <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                                      All Wallets & Accounts Associated with {acc.owner} ({userWallets.length})
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                      Customer Email: {acc.email} · KYC Status:{" "}
                                      <span className="font-medium capitalize">{acc.kycStatus}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                                  {userWallets.map((w: any) => (
                                    <div
                                      key={w.id}
                                      className={`rounded-2xl border p-4 shadow-sm transition-all ${
                                        w.id === acc.id
                                          ? "border-indigo-500 bg-indigo-50/40 dark:border-indigo-400 dark:bg-indigo-950/30"
                                          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-medium ${
                                                accountTypeColors[w.type] || accountTypeColors.wallet
                                              }`}
                                            >
                                              {w.typeLabel}
                                            </span>
                                            {w.isPrimary && (
                                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                ★ Primary
                                              </span>
                                            )}
                                          </div>
                                          <p className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                                            {w.displayName}
                                          </p>
                                          <p className="font-mono text-xs text-gray-500">{w.accountNumber}</p>
                                        </div>
                                        <StatusBadge status={w.status} />
                                      </div>

                                      <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                                        <div>
                                          <p className="text-[11px] font-medium uppercase text-gray-400">Balance</p>
                                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatCurrencyAmount(w.balance, w.currency)}
                                          </p>
                                        </div>
                                        {w.interestRate > 0 && (
                                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                            {w.interestRate}% APY
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 p-5 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} accounts
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 w-9 rounded-xl text-sm font-medium transition-colors ${
                    p === pagination.page
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </DashCard>

      {filtered.length === 0 && (
        <DashCard padding="lg" className="mt-4 py-14 text-center">
          <Search size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-base font-medium text-gray-600 dark:text-gray-300">No accounts match your filters</p>
        </DashCard>
      )}

      <Modal
        isOpen={!!accountToClose}
        onClose={() => setAccountToClose(null)}
        title="Close Account"
        description="Are you sure you want to close this customer account? This action is recorded in the audit log."
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
                  closeAccount(accountToClose.id);
                  toast.error(`Account ${accountToClose.accountNumber} closed`);
                  setAccountToClose(null);
                }
              }}
            >
              Close Account
            </Button>
          </div>
        }
      >
        <div className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
          Closing <strong>{accountToClose?.displayName}</strong> ({accountToClose?.accountNumber}) owned by{" "}
          <strong>{accountToClose?.owner}</strong>.
        </div>
      </Modal>
    </PageContainer>
  );
}
