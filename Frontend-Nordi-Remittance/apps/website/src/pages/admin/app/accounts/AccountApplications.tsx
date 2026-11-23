// ============================================================================
// AccountApplications — Spacious Admin review of customer account applications
// Endpoints: GET /admin/operations/accounts/applications/pending
//            POST /admin/operations/accounts/applications/:id/approve
//            POST /admin/operations/accounts/applications/:id/reject
// ============================================================================
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  User,
  AlertCircle,
  X,
  CheckCheck,
  Wallet,
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
} from "@components/shared/DashboardPrimitives";
import { PageHeader } from "@components/shared/PageHeader";
import {
  useApplicationsManagement,
  useAccountsManagement,
  formatCurrencyAmount,
} from "../../admin-usecase/useadmin-account-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;

const typeLabels: Record<string, string> = {
  savings: "Savings Account",
  current: "Current Account",
  fixed_deposit: "Fixed Deposit",
};

const typeColors: Record<string, string> = {
  savings: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  current: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  fixed_deposit: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
};

const statusBadges: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
  pending: {
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    icon: <Clock size={14} className="text-amber-500" />,
    label: "Pending Review",
  },
  approved: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    icon: <CheckCircle2 size={14} className="text-emerald-500" />,
    label: "Approved",
  },
  rejected: {
    bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    icon: <XCircle size={14} className="text-rose-500" />,
    label: "Rejected",
  },
};

// ─── Reject Dialog ────────────────────────────────────────────────────────────
function RejectDialog({
  isOpen,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen: boolean;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40">
              <XCircle size={22} className="text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Account Application</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Provide a clear reason for the applicant</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="e.g. Incomplete business verification, additional KYC documentation required..."
          rows={4}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-rose-500"
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            disabled={!reason.trim() || isLoading}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Application Row ──────────────────────────────────────────────────────────
function ApplicationRow({
  app,
  userWallets,
  onApprove,
  onReject,
  isApproving,
}: {
  app: any;
  userWallets: any[];
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ownerName =
    app.user?.firstName && app.user?.lastName
      ? `${app.user.firstName} ${app.user.lastName}`
      : app.user?.email || "Unknown Applicant";
  const currency = app.currency || "USD";
  const amount = Number(app.initialDeposit ?? app.principal ?? app.expectedMonthlyVolume ?? 0);
  const statusInfo = statusBadges[app.status] || statusBadges.pending;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="border-b border-gray-100 transition-colors hover:bg-gray-50/70 dark:border-gray-800/70 dark:hover:bg-gray-800/40"
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <User size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">{ownerName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{app.user?.email || "—"}</p>
              {userWallets.length > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <Wallet size={11} /> {userWallets.length} Linked Wallet{userWallets.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </td>

        <td className="px-5 py-4">
          <div className="flex flex-col items-start gap-1">
            <span
              className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-medium ${
                typeColors[app.type] || "bg-gray-100 text-gray-700"
              }`}
            >
              {typeLabels[app.type] || app.type}
            </span>
            {(app.nickname || app.businessName || app.goal) && (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Tag size={12} className="text-indigo-500" />
                {app.nickname || app.businessName || app.goal}
              </span>
            )}
          </div>
        </td>

        <td className="px-5 py-4">
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {amount > 0 ? formatCurrencyAmount(amount, currency) : `${currency} Account`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {app.type === "fixed_deposit"
              ? `${app.termMonths || 12} mos @ ${app.interestRate || 5.25}%`
              : app.type === "savings"
                ? `${app.interestRate || 2.75}% APY`
                : app.overdraftRequested
                  ? "Overdraft Requested"
                  : "Standard Checking"}
          </p>
        </td>

        <td className="px-5 py-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-medium ${statusInfo.bg}`}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </span>
          {app.walletNumber && (
            <p className="mt-1 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Acct: {app.walletNumber}
            </p>
          )}
        </td>

        <td className="px-5 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          {app.submittedAt
            ? new Date(app.submittedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </td>

        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              title="Toggle Details"
            >
              Details
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} />
              </motion.div>
            </button>
            {app.status === "pending" && (
              <>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isApproving}
                  onClick={onApprove}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  <CheckCheck size={15} />
                  Approve
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onReject}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50 sm:text-sm"
                >
                  <XCircle size={15} />
                  Reject
                </motion.button>
              </>
            )}
          </div>
        </td>
      </motion.tr>

      {/* Expanded Detail & User Associated Accounts Row */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={6} className="bg-gray-50/90 px-6 py-5 dark:bg-gray-800/50">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase text-gray-400">Account Nickname</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {app.nickname || app.businessName || app.goal || "Standard"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase text-gray-400">Currency</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{currency}</p>
                  </div>
                  {app.initialDeposit != null && app.initialDeposit > 0 && (
                    <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase text-gray-400">Initial Deposit</p>
                      <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyAmount(app.initialDeposit, currency)}
                      </p>
                    </div>
                  )}
                  {app.principal != null && app.principal > 0 && (
                    <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase text-gray-400">Principal Amount</p>
                      <p className="mt-1 font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrencyAmount(app.principal, currency)}
                      </p>
                    </div>
                  )}
                  {app.termMonths != null && (
                    <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase text-gray-400">Lock Term</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">{app.termMonths} Months</p>
                    </div>
                  )}
                  {app.interestRate != null && (
                    <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase text-gray-400">Interest Rate</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">{app.interestRate}% p.a.</p>
                    </div>
                  )}
                  {app.purpose && (
                    <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase text-gray-400">Purpose</p>
                      <p className="mt-1 font-semibold capitalize text-gray-900 dark:text-white">
                        {app.businessName ? `${app.businessName} (Business)` : app.purpose}
                      </p>
                    </div>
                  )}
                  {app.goal && (
                    <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase text-gray-400">Savings Goal</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">{app.goal}</p>
                    </div>
                  )}
                  {app.rejectionReason && (
                    <div className="col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/30">
                      <p className="text-xs font-medium uppercase text-rose-600 dark:text-rose-400">Rejection Reason</p>
                      <p className="mt-1 font-semibold text-rose-700 dark:text-rose-300">{app.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* All Wallets Associated with this Applicant */}
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    All Wallets & Accounts Associated with {ownerName} ({userWallets.length})
                  </p>
                  {userWallets.length === 0 ? (
                    <p className="text-xs text-gray-400">No active wallets found for this user yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {userWallets.map((w: any) => (
                        <div
                          key={w.id || w.walletNumber}
                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium uppercase text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                {w.typeLabel || w.walletType || w.type}
                              </span>
                              {w.isPrimary && (
                                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                  ★ Primary
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                              {w.displayName || w.nickname || w.walletNumber}
                            </p>
                            <p className="font-mono text-xs text-gray-500">{w.accountNumber || w.walletNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrencyAmount(w.balance ?? 0, w.currency || "USD")}
                            </p>
                            <span className="text-[11px] font-semibold capitalize text-emerald-600 dark:text-emerald-400">
                              {w.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountApplications() {
  const {
    applications,
    stats,
    search,
    statusFilter,
    typeFilter,
    isLoading,
    isApproving,
    isRejecting,
    rejectDialogId,
    rejectReason,
    pagination,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setPage,
    setRejectDialogId,
    setRejectReason,
    approveApplication,
    rejectApplication,
    refetch,
  } = useApplicationsManagement();

  const { userAccountsMap, refetch: refetchWallets } = useAccountsManagement();

  const handleApprove = (id: string) => {
    approveApplication(id);
    setTimeout(() => refetchWallets(), 800);
  };

  return (
    <PageContainer className="px-2 sm:px-3 lg:px-4 [&>div]:max-w-full">
      <PageHeader
        title="Account Applications"
        subtitle="Review, approve, or reject customer Savings, Current, and Fixed Deposit account applications"
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Accounts", href: "/admin/accounts" },
          { label: "Applications" },
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
          label="Total Applications"
          value={stats.total}
          icon={<FileText size={20} />}
          iconColor="from-indigo-500 to-indigo-600"
          index={0}
        />
        <StatCard
          label="Pending Review"
          value={stats.pending}
          icon={<Clock size={20} />}
          iconColor="from-amber-500 to-amber-600"
          index={1}
        />
        <StatCard
          label="Approved & Opened"
          value={stats.approved}
          icon={<CheckCircle2 size={20} />}
          iconColor="from-emerald-500 to-emerald-600"
          positive
          index={2}
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle size={20} />}
          iconColor="from-rose-500 to-rose-600"
          index={3}
        />
      </StatsGrid>

      {stats.pending > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-950/30"
        >
          <AlertCircle size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            <span className="font-semibold">
              {stats.pending} account application{stats.pending !== 1 ? "s" : ""}
            </span>{" "}
            awaiting admin approval. Approving an application automatically creates and links the customer's new wallet.
          </p>
        </motion.div>
      )}

      {/* Status Filter Pills */}
      <div className="mb-4 flex gap-2.5 overflow-x-auto pb-1 touch-pan-x scrollbar-hide">
        {STATUS_FILTERS.map((s) => (
          <FilterPill
            key={s}
            label={`${s === "all" ? "All Applications" : s.charAt(0).toUpperCase() + s.slice(1)} (${
              s === "all" ? stats.total : stats[s]
            })`}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by applicant name, email, nickname, business name, or goal..."
      >
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All Account Types" },
            { value: "savings", label: "Savings Accounts" },
            { value: "current", label: "Current Accounts" },
            { value: "fixed_deposit", label: "Fixed Deposits" },
          ]}
        />
      </FilterBar>

      <DashCard padding="none">
        <div className="overflow-x-auto touch-pan-x scrollbar-hide">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                {["Applicant", "Account Type & Label", "Deposit / Terms", "Status", "Submitted", "Actions"].map((h) => (
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
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-5 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : applications.map((app) => {
                      const uid = String(app.user?._id || app.user || "");
                      const userWallets = userAccountsMap[uid] || userAccountsMap[app.user?.email] || app.userWallets || [];
                      return (
                        <ApplicationRow
                          key={app._id || app.id}
                          app={app}
                          userWallets={userWallets}
                          onApprove={() => handleApprove(app._id || app.id)}
                          onReject={() => setRejectDialogId(app._id || app.id)}
                          isApproving={isApproving}
                        />
                      );
                    })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {!isLoading && applications.length === 0 && (
          <div className="py-16 text-center">
            <FileText size={44} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-base font-medium text-gray-600 dark:text-gray-300">No account applications found</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Try switching status tabs or clearing your search filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 p-5 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * 20 + 1}–{Math.min(pagination.page * 20, pagination.total)} of{" "}
              {pagination.total}
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

      {/* Reject Dialog */}
      <AnimatePresence>
        {rejectDialogId && (
          <RejectDialog
            isOpen={!!rejectDialogId}
            reason={rejectReason}
            onReasonChange={setRejectReason}
            onConfirm={() => rejectApplication(rejectDialogId, rejectReason)}
            onCancel={() => {
              setRejectDialogId(null);
              setRejectReason("");
            }}
            isLoading={isRejecting}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
