// ============================================================================
// FixedDepositAccounts — Spacious Admin view of Fixed Deposit Accounts & Applications
// ============================================================================
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  CheckCheck,
  Unlock,
  Tag,
} from "lucide-react";
import {
  PageContainer,
  DashCard,
  StatCard,
  StatsGrid,
  FilterBar,
  FilterPill,
  ActionButton,
  StatusBadge,
} from "@components/shared/DashboardPrimitives";
import { PageHeader } from "@components/shared/PageHeader";
import { useToast } from "@store/toast.store";
import {
  useApplicationsManagement,
  useAccountsManagement,
  formatCurrencyAmount,
} from "../../admin-usecase/useadmin-account-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function FixedDepositAccounts() {
  const toast = useToast();
  const {
    rawApplications,
    isLoading,
    search,
    statusFilter,
    isApproving,
    isRejecting,
    rejectDialogId,
    rejectReason,
    setSearch,
    setStatusFilter,
    setRejectDialogId,
    setRejectReason,
    approveApplication,
    rejectApplication,
    refetch,
  } = useApplicationsManagement();

  const {
    rawAccounts,
    freezeAccount,
    unfreezeAccount,
    refetch: refetchWallets,
  } = useAccountsManagement();

  const fixedWallets = rawAccounts.filter((a: any) => a.type === "fixed_deposit" || a.type === "fixed-deposit");
  const fixedApps = rawApplications.filter((a: any) => a.type === "fixed_deposit");
  const pendingCount = fixedApps.filter((a: any) => a.status === "pending").length;
  const approvedCount = Math.max(
    fixedWallets.length,
    fixedApps.filter((a: any) => a.status === "approved").length,
  );
  const totalFixedPrincipal = fixedWallets.reduce(
    (sum: number, w: any) => sum + (w.balance || w.principal || 0),
    0,
  );

  const filteredApps = fixedApps
    .filter((a: any) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        a.user?.firstName?.toLowerCase().includes(q) ||
        a.user?.lastName?.toLowerCase().includes(q) ||
        a.user?.email?.toLowerCase().includes(q) ||
        a.nickname?.toLowerCase().includes(q)
      );
    })
    .filter((a: any) => statusFilter === "all" || a.status === statusFilter);

  return (
    <PageContainer className="px-2 sm:px-3 lg:px-4 [&>div]:max-w-full">
      <PageHeader
        title="Fixed Deposit Accounts & Applications"
        subtitle="Manage active customer term deposits and review new fixed deposit applications"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Accounts", href: "/admin/accounts" },
          { label: "Fixed Deposits" },
        ]}
        actions={
          <ActionButton
            label="Refresh"
            icon={<RefreshCw size={15} />}
            onClick={() => {
              refetch();
              refetchWallets();
            }}
          />
        }
      />

      <StatsGrid cols={4}>
        <StatCard
          label="Total Locked Principal"
          value={formatCurrencyAmount(totalFixedPrincipal, "USD")}
          icon={<Lock size={20} />}
          iconColor="from-amber-500 to-orange-600"
          index={0}
        />
        <StatCard
          label="Pending Applications"
          value={pendingCount}
          icon={<Clock size={20} />}
          iconColor="from-amber-500 to-amber-600"
          index={1}
        />
        <StatCard
          label="Active Fixed Deposits"
          value={approvedCount}
          icon={<CheckCircle2 size={20} />}
          iconColor="from-emerald-500 to-emerald-600"
          positive
          index={2}
        />
        <StatCard
          label="Rejected Applications"
          value={fixedApps.filter((a: any) => a.status === "rejected").length}
          icon={<XCircle size={20} />}
          iconColor="from-rose-500 to-rose-600"
          index={3}
        />
      </StatsGrid>

      {/* Active Fixed Deposit Wallets Section */}
      {fixedWallets.length > 0 && (
        <DashCard padding="none" className="mb-8">
          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active Fixed Deposit Wallets ({fixedWallets.length})
            </h3>
            <p className="text-xs text-gray-500 sm:text-sm">
              Approved term deposit accounts currently earning locked interest
            </p>
          </div>
          <div className="overflow-x-auto touch-pan-x scrollbar-hide">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                  {["Account Number", "Customer", "Principal Balance", "Term & Rate", "Maturity Date", "Status", "Actions"].map(
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
                {fixedWallets.map((w: any) => (
                  <tr
                    key={w.id}
                    className="border-b border-gray-100 hover:bg-gray-50/70 dark:border-gray-800/60 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                        {w.accountNumber}
                      </p>
                      {w.nickname && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-gray-500">
                          <Tag size={11} className="text-amber-500" /> {w.nickname}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">{w.owner}</p>
                      <p className="text-xs text-gray-500">{w.email}</p>
                    </td>
                    <td className="px-5 py-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                      {formatCurrencyAmount(w.balance || w.principal || 0, w.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {w.interestRate || 5.25}% p.a.
                      </span>
                      <span className="ml-2 text-xs text-gray-500">({w.termMonths || 12} mos)</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {w.maturityDate ? new Date(w.maturityDate).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-5 py-4">
                      {w.status === "active" ? (
                        <button
                          onClick={() => {
                            freezeAccount(w.id);
                            toast.warning("Fixed deposit frozen");
                          }}
                          className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400"
                          title="Freeze"
                        >
                          <Lock size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            unfreezeAccount(w.id);
                            toast.success("Fixed deposit unfrozen");
                          }}
                          className="rounded-xl bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
                          title="Unfreeze"
                        >
                          <Unlock size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashCard>
      )}

      <div className="mb-4 flex gap-2.5 overflow-x-auto pb-1 touch-pan-x scrollbar-hide">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <FilterPill
            key={s}
            label={s === "all" ? "All Applications" : s.charAt(0).toUpperCase() + s.slice(1)}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </div>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search fixed deposit applications by applicant name, email, or nickname..."
      />

      <DashCard padding="none">
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fixed Deposit Applications ({filteredApps.length})
          </h3>
        </div>
        <div className="overflow-x-auto touch-pan-x scrollbar-hide">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                {[
                  "Applicant",
                  "Label",
                  "Principal Amount",
                  "Lock Term",
                  "Interest Rate",
                  "Status",
                  "Submitted",
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
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-5 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredApps.map((app: any, i: number) => (
                      <motion.tr
                        key={app._id || app.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: i * 0.02 } }}
                        exit={{ opacity: 0 }}
                        className="border-b border-gray-100 hover:bg-gray-50/70 dark:border-gray-800/60 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                            {app.user?.firstName} {app.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{app.user?.email}</p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200">
                          {app.nickname || "Fixed Deposit"}
                        </td>
                        <td className="px-5 py-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                          {formatCurrencyAmount(app.principal || 0, app.currency)}
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-700 dark:text-gray-300">
                          {app.termMonths} Months
                        </td>
                        <td className="px-5 py-4 font-medium text-amber-600 dark:text-amber-400">
                          {app.interestRate}% p.a.
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("en-GB") : "—"}
                        </td>
                        <td className="px-5 py-4">
                          {app.status === "pending" && (
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                disabled={isApproving}
                                onClick={() => {
                                  approveApplication(app._id || app.id);
                                  setTimeout(() => refetchWallets(), 800);
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CheckCheck size={14} /> Approve
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                onClick={() => setRejectDialogId(app._id || app.id)}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400"
                              >
                                <XCircle size={14} /> Reject
                              </motion.button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {!isLoading && filteredApps.length === 0 && (
          <div className="py-16 text-center">
            <FileText size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-base font-medium text-gray-500">No fixed deposit applications found</p>
          </div>
        )}
      </DashCard>

      {/* Reject dialog */}
      <AnimatePresence>
        {rejectDialogId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setRejectDialogId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 sm:p-8"
            >
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Reject Fixed Deposit Application
              </h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={4}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-base outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setRejectDialogId(null)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  disabled={!rejectReason.trim() || isRejecting}
                  onClick={() => rejectApplication(rejectDialogId, rejectReason)}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isRejecting ? "Rejecting…" : "Confirm Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
