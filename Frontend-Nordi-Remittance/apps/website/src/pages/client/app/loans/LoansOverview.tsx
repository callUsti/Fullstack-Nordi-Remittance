// ============================================================================
// LOANS OVERVIEW — table of all user loans with real field names from backend
// ============================================================================

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Landmark,
  CalendarClock,
  FileText,
  DollarSign,
  Loader2,
  X,
} from "@constants/icons";

import { PageContainer, DashCard, StatCard, StatsGrid, StatusBadge, ActionButton } from "@components/shared/DashboardPrimitives";
import PageHeader from "@components/shared/PageHeader";
import EmptyState from "@components/shared/EmptyState";
import { StatsGridSkeleton, TableSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientLoans,
  useClientApplications,
  useMakeLoanPayment,
} from "../../client-usecase/useloans-client-usecase";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

const fmt = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const loanStatusVariant: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
  defaulted: "Defaulted",
  written_off: "Written Off",
  paused: "Paused",
};

const LoansOverview: React.FC = () => {
  const navigate = useNavigate();
  const { loans, isLoading } = useClientLoans();
  const { applications, isLoading: appsLoading } = useClientApplications();
  const { wallets } = useClientWallets();
  const payMutation = useMakeLoanPayment();

  const activeWallets = useMemo(
    () => (wallets as any[]).filter((w: any) => w.status === "active" || !w.status),
    [wallets],
  );

  const [repayTarget, setRepayTarget] = useState<any | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayWalletId, setRepayWalletId] = useState<string>("");
  const [repayType, setRepayType] = useState<"regular" | "full">("regular");

  const openRepayModal = (loan: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const baseMonthly =
      Number(loan.monthlyPayment) ||
      Number(loan.principalAmount || loan.amount || 0) / Math.max(1, Number(loan.term) || 12);
    const defCount = Number(loan.defaultCount || 0) + Number(loan.missedPayments || 0);
    const defFeePct = Number(loan.defaultFeePercentage ?? loan.lateFeePercentage ?? 2.5);
    const defFeeAddon =
      defCount > 0 ? Math.round(baseMonthly * ((defCount * defFeePct) / 100) * 100) / 100 : 0;
    const minReq = Math.min(
      Number(loan.outstandingBalance || 0),
      Math.round((baseMonthly + defFeeAddon) * 100) / 100,
    );
    setRepayTarget({ ...loan, minRequired: minReq, defaultFeeAddon: defFeeAddon, defaultCount: defCount, defaultFeePct: defFeePct });
    setRepayAmount(minReq);
    setRepayType("regular");
    setRepayWalletId(activeWallets[0]?._id || activeWallets[0]?.id || "");
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayTarget || !repayWalletId) return;
    const effective =
      repayType === "full" ? Number(repayTarget.outstandingBalance || 0) : Number(repayAmount || 0);
    if (repayType === "regular" && effective < (repayTarget.minRequired || 0) - 0.01) return;
    payMutation.mutate(
      {
        loanId: repayTarget._id || repayTarget.loanId,
        data: { amount: effective, accountId: repayWalletId },
      },
      {
        onSuccess: () => setRepayTarget(null),
      },
    );
  };

  const stats = useMemo(() => {
    if (!loans.length) return { totalBorrowed: 0, activeLoans: 0, nextPayment: 0, nextPaymentDate: "" };

    const totalBorrowed = loans.reduce((sum: number, l: any) => sum + (l.principalAmount ?? l.amount ?? 0), 0);
    const activeLoans = loans.filter((l: any) => l.status === "active").length;

    const upcoming = loans
      .filter((l: any) => l.status === "active" && l.nextPaymentDate)
      .sort((a: any, b: any) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());

    return {
      totalBorrowed,
      activeLoans,
      nextPayment: upcoming[0]?.nextPaymentAmount ?? upcoming[0]?.monthlyPayment ?? 0,
      nextPaymentDate: upcoming[0]?.nextPaymentDate ?? "",
    };
  }, [loans]);

  return (
    <PageContainer>
      <PageHeader
        title="Loans Overview"
        breadcrumbs={[
          { label: "Dashboard", href: "/customer/dashboard" },
          { label: "Loans", href: "/customer/loans" },
          { label: "Overview" },
        ]}
      />

      {isLoading ? (
        <>
          <StatsGridSkeleton count={3} />
          <TableSkeleton rows={5} />
        </>
      ) : (
        <motion.div variants={dashboardItemVariants} initial="hidden" animate="visible" className="space-y-6">
          <StatsGrid cols={3}>
            <StatCard label="Total Borrowed" value={fmt(stats.totalBorrowed)} icon={<Landmark size={20} />} iconColor="bg-blue-600" index={0} />
            <StatCard label="Active Loans" value={String(stats.activeLoans)} icon={<FileText size={20} />} iconColor="bg-emerald-600" index={1} />
            <StatCard label="Next Payment" value={stats.nextPayment ? fmt(stats.nextPayment) : "—"} icon={<CalendarClock size={20} />} iconColor="bg-amber-600" index={2} />
          </StatsGrid>

          {/* Active Loans Table */}
          <DashCard padding="none">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-6 sm:py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Active Loans</h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Manual repayment only — your accounts are never auto-debited. Click Repay to select an account.
                </p>
              </div>
            </div>

            {loans.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Landmark size={48} />}
                  title="No loans yet"
                  description="You haven't taken any loans. Apply for one to get started."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      {["Loan ID", "Type", "Amount", "Outstanding", "Monthly Min.", "Term", "Next Payment", "Status", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {loans.map((loan: any, idx: number) => (
                      <tr
                        key={loan._id ?? loan.loanId ?? idx}
                        onClick={() => navigate(`/customer/loans/${loan._id || loan.loanId}`)}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                          {loan.loanId ?? loan._id ?? `LN-${idx + 1}`}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs capitalize text-gray-500 dark:text-gray-400 sm:text-sm">
                          {loan.loanType ?? loan.type ?? "Personal"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-900 dark:text-white sm:text-sm">
                          {fmt(loan.principalAmount ?? loan.amount ?? 0, loan.currency)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-900 dark:text-white sm:text-sm">
                          {fmt(loan.outstandingBalance ?? 0, loan.currency)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
                          {fmt(loan.monthlyPayment ?? 0, loan.currency)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                          {loan.term ? `${loan.term} mo` : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                          {fmtDate(loan.nextPaymentDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={loanStatusVariant[loan.status] ?? loan.status ?? "Unknown"} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {(loan.status === "active" || loan.status === "defaulted" || loan.status === "pending") &&
                            Number(loan.outstandingBalance || 0) > 0 && (
                              <button
                                type="button"
                                onClick={(e) => openRepayModal(loan, e)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                              >
                                <DollarSign size={13} /> Repay
                              </button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashCard>

          {/* Applications Table */}
          {!appsLoading && applications.length > 0 && (
            <DashCard padding="none">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-6 sm:py-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Loan Applications</h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Submitted and pending review</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      {["Application ID", "Type", "Amount", "Term", "Status", "Submitted"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {applications.map((app: any, idx: number) => (
                      <tr key={app._id ?? app.applicationId ?? idx} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {app.applicationId ?? app._id ?? `APP-${idx + 1}`}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs capitalize text-gray-500 dark:text-gray-400">
                          {app.loanType ?? "Personal"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-900 dark:text-white">
                          {fmt(app.requestedAmount ?? 0)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {app.term ? `${app.term} mo` : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={app.status ?? "unknown"} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {fmtDate(app.submittedAt ?? app.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashCard>
          )}
        </motion.div>
      )}

      {/* ── Manual Repay Loan Form Modal (Enforces >= Monthly Requirement) ── */}
      <AnimatePresence>
        {repayTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setRepayTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Repay Loan ({repayTarget.loanId || repayTarget._id?.slice(-8)})
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select an account to debit from — minimum is your monthly requirement
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRepayTarget(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                <div className="flex items-center justify-between">
                  <span>Outstanding Balance:</span>
                  <span className="font-bold">{fmt(repayTarget.outstandingBalance ?? 0, repayTarget.currency)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Minimum Monthly Requirement:</span>
                  <span className="font-bold">{fmt(repayTarget.minRequired ?? 0, repayTarget.currency)}</span>
                </div>
                {(repayTarget.defaultCount || 0) > 0 && (
                  <div className="mt-1 flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span>Default Penalty ({repayTarget.defaultCount}x @{repayTarget.defaultFeePct}%):</span>
                    <span className="font-semibold">+{fmt(repayTarget.defaultFeeAddon ?? 0, repayTarget.currency)}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleRepaySubmit} className="space-y-4">
                <div className="flex gap-2">
                  {(["regular", "full"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setRepayType(t);
                        if (t === "regular" && repayAmount < (repayTarget.minRequired || 0)) {
                          setRepayAmount(repayTarget.minRequired || 0);
                        }
                      }}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-colors ${
                        repayType === t
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300"
                          : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {t === "full" ? "Full Payoff" : "Monthly / Custom Repay"}
                    </button>
                  ))}
                </div>

                {repayType === "regular" ? (
                  <div>
                    <label htmlFor="overview-repay-amount" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Amount to Repay (Minimum: {fmt(repayTarget.minRequired ?? 0, repayTarget.currency)})
                    </label>
                    <input
                      id="overview-repay-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min={repayTarget.minRequired || 1}
                      max={repayTarget.outstandingBalance}
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    {repayAmount < (repayTarget.minRequired || 0) - 0.01 && (
                      <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                        Amount cannot be below your monthly requirement of {fmt(repayTarget.minRequired ?? 0, repayTarget.currency)}.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Full Payoff Amount: {fmt(repayTarget.outstandingBalance ?? 0, repayTarget.currency)}
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                      Pays off the remaining balance and closes the loan.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="overview-repay-wallet" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Select Account to Debit From
                  </label>
                  <select
                    id="overview-repay-wallet"
                    name="walletId"
                    value={repayWalletId}
                    onChange={(e) => setRepayWalletId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {activeWallets.map((w: any) => (
                      <option key={w._id || w.id} value={w._id || w.id}>
                        {w.displayName || w.typeLabel || "Account"} ({w.walletNumber || w.accountNumber || "Wallet"}) — Balance:{" "}
                        {fmt(w.rawTotalBalance ?? w.balance ?? 0, w.primaryCurrency || w.currency || "USD")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <ActionButton label="Cancel" variant="secondary" onClick={() => setRepayTarget(null)} />
                  <button
                    type="submit"
                    disabled={
                      payMutation.isPending ||
                      !repayWalletId ||
                      (repayType === "regular" && repayAmount < (repayTarget.minRequired || 0) - 0.01)
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {payMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                    {payMutation.isPending
                      ? "Debiting Account…"
                      : `Repay ${fmt(repayType === "full" ? repayTarget.outstandingBalance : repayAmount, repayTarget.currency)}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default LoansOverview;

