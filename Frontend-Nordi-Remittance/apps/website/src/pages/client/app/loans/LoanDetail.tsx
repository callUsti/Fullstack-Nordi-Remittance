// ============================================================================
// LOAN DETAIL — Client view: loan info + repayment schedule + make payment
// Route: /customer/loans/:loanId
// ============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wallet,
  Percent,
  DollarSign,
  FileText,
  Loader2,
  X,
} from "@constants/icons";
import {
  PageContainer,
  DashCard,
  StatCard,
  StatsGrid,
  StatusBadge,
  ProgressBar,
  ActionButton,
} from "@components/shared/DashboardPrimitives";
import PageHeader from "@components/shared/PageHeader";
import { StatsGridSkeleton, TableSkeleton } from "@components/skeletons";
import EmptyState from "@components/shared/EmptyState";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientLoanDetailFull,
  useMakeLoanPayment,
} from "../../client-usecase/useloans-client-usecase";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

const fmt = (v: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(v);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

// ─── Payment modal (Manual Repay Form — Enforces >= Monthly Requirement) ─────
const PaymentModal: React.FC<{
  loan: any;
  wallets: any[];
  onClose: () => void;
}> = ({ loan, wallets, onClose }) => {
  const baseMonthly =
    Number(loan.monthlyPayment) ||
    Number(loan.principalAmount || loan.amount || 0) / Math.max(1, Number(loan.term) || 12);
  const defaultCount = Number(loan.defaultCount || 0) + Number(loan.missedPayments || 0);
  const defaultFeePct = Number(loan.defaultFeePercentage ?? loan.lateFeePercentage ?? 2.5);
  const defaultFeeAddon =
    defaultCount > 0 ? Math.round(baseMonthly * ((defaultCount * defaultFeePct) / 100) * 100) / 100 : 0;
  const minimumMonthlyRequirement = Math.min(
    Number(loan.outstandingBalance || 0),
    Math.round((baseMonthly + defaultFeeAddon) * 100) / 100,
  );

  const [amount, setAmount] = useState<number>(minimumMonthlyRequirement || 100);
  const [walletId, setWalletId] = useState<string>(wallets[0]?._id || wallets[0]?.id || "");
  const [paymentType, setPaymentType] = useState<"regular" | "full">("regular");

  const payMutation = useMakeLoanPayment();

  const effectiveAmount =
    paymentType === "full" ? Number(loan.outstandingBalance || 0) : Number(amount || 0);

  const selectedWallet = wallets.find((w: any) => (w._id || w.id) === walletId) || wallets[0];
  const selectedWalletBalance = Number(
    selectedWallet?.rawTotalBalance ?? selectedWallet?.balance ?? 0,
  );

  const isBelowMinimum =
    paymentType === "regular" && effectiveAmount < minimumMonthlyRequirement - 0.01;
  const isInsufficientFunds = selectedWallet && selectedWalletBalance < effectiveAmount;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBelowMinimum || isInsufficientFunds || !walletId) return;
    payMutation.mutate(
      { loanId: loan._id || loan.loanId, data: { amount: effectiveAmount, accountId: walletId } },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Repay Loan</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manual repayment — select the account to debit from
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span>Outstanding Balance:</span>
            <span className="font-bold">{fmt(loan.outstandingBalance ?? 0, loan.currency)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span>Minimum Monthly Requirement:</span>
            <span className="font-bold">{fmt(minimumMonthlyRequirement, loan.currency)}</span>
          </div>
          {defaultCount > 0 && (
            <div className="mt-1 flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span>Default Fee Applied ({defaultCount}x @{defaultFeePct}%):</span>
              <span className="font-semibold">+{fmt(defaultFeeAddon, loan.currency)}</span>
            </div>
          )}
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          {/* Payment type */}
          <div className="flex gap-2">
            {(["regular", "full"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setPaymentType(t);
                  if (t === "regular" && amount < minimumMonthlyRequirement) {
                    setAmount(minimumMonthlyRequirement);
                  }
                }}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-colors
                  ${
                    paymentType === t
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300"
                      : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                  }`}
              >
                {t === "full" ? "Full Payoff" : "Monthly / Custom Repay"}
              </button>
            ))}
          </div>

          {paymentType === "regular" && (
            <div>
              <label htmlFor="repay-amount-input" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Amount to Repay (Minimum: {fmt(minimumMonthlyRequirement, loan.currency)})
              </label>
              <input
                id="repay-amount-input"
                name="amount"
                type="number"
                step="0.01"
                min={minimumMonthlyRequirement}
                max={loan.outstandingBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white ${
                  isBelowMinimum
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-gray-200 focus:ring-blue-500 dark:border-gray-700"
                }`}
              />
              {isBelowMinimum ? (
                <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  Repayment amount cannot be below the monthly requirement of {fmt(minimumMonthlyRequirement, loan.currency)}.
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-gray-400">
                  Must be at least {fmt(minimumMonthlyRequirement, loan.currency)} (monthly requirement).
                </p>
              )}
            </div>
          )}

          {paymentType === "full" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Full Payoff Amount: {fmt(loan.outstandingBalance ?? 0, loan.currency)}
              </p>
              <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                This will pay off your entire remaining loan balance and close the loan.
              </p>
            </div>
          )}

          {/* Account / Wallet Selector */}
          <div>
            <label htmlFor="repay-wallet-select" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Select Account to Debit From
            </label>
            <select
              id="repay-wallet-select"
              name="walletId"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {wallets.map((w: any) => (
                <option key={w._id || w.id} value={w._id || w.id}>
                  {w.displayName || w.typeLabel || "Account"} ({w.walletNumber || w.accountNumber || "Wallet"}) — Balance:{" "}
                  {fmt(w.rawTotalBalance ?? w.balance ?? 0, w.primaryCurrency || w.currency || "USD")}
                </option>
              ))}
            </select>
            {isInsufficientFunds && (
              <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                Insufficient funds in selected account ({fmt(selectedWalletBalance)} available). Please choose another account.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <ActionButton label="Cancel" variant="secondary" onClick={onClose} />
            <button
              type="submit"
              disabled={payMutation.isPending || !walletId || isBelowMinimum || Boolean(isInsufficientFunds)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {payMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {payMutation.isPending ? "Debiting Account…" : `Repay ${fmt(effectiveAmount, loan.currency)}`}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const LoanDetail: React.FC = () => {
  const { loanId } = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const [showPayModal, setShowPayModal] = useState(false);

  const { loan, installments, isLoading } = useClientLoanDetailFull(loanId as any);
  const { wallets } = useClientWallets();

  const activeWallets = (wallets as any[]).filter((w: any) => w.status === "active" || !w.status);

  const progress =
    loan.principalAmount && loan.outstandingBalance != null
      ? ((loan.principalAmount - loan.outstandingBalance) / loan.principalAmount) * 100
      : 0;

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Loan Details" breadcrumbs={[{ label: "Loans", href: "/customer/loans" }, { label: "Detail" }]} />
        <StatsGridSkeleton count={4} />
        <TableSkeleton rows={6} />
      </PageContainer>
    );
  }

  if (!loan || !loan._id) {
    return (
      <PageContainer>
        <PageHeader title="Loan Details" breadcrumbs={[{ label: "Loans", href: "/customer/loans" }, { label: "Detail" }]} />
        <DashCard>
          <EmptyState icon={<Banknote size={40} />} title="Loan not found" description="This loan could not be found." />
        </DashCard>
      </PageContainer>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showPayModal && (
          <PaymentModal loan={loan} wallets={activeWallets} onClose={() => setShowPayModal(false)} />
        )}
      </AnimatePresence>

      <PageContainer>
        <PageHeader
          title={`Loan ${loan.loanId || loan._id}`}
          subtitle={`${loan.loanType ?? "Personal"} loan · ${loan.currency ?? "USD"}`}
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Loans", href: "/customer/loans" },
            { label: loan.loanId || "Detail" },
          ]}
          actions={
            loan.status === "active" ? (
              <ActionButton label="Make Payment" icon={<DollarSign size={16} />} onClick={() => setShowPayModal(true)} />
            ) : undefined
          }
        />

        <motion.div variants={dashboardItemVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Stats */}
          <StatsGrid cols={4}>
            <StatCard
              label="Principal"
              value={fmt(loan.principalAmount ?? 0, loan.currency)}
              icon={<Banknote size={18} />}
              iconColor="bg-blue-600"
              index={0}
            />
            <StatCard
              label="Outstanding"
              value={fmt(loan.outstandingBalance ?? 0, loan.currency)}
              icon={<DollarSign size={18} />}
              iconColor="bg-amber-600"
              index={1}
            />
            <StatCard
              label="Monthly Payment"
              value={fmt(loan.monthlyPayment ?? 0, loan.currency)}
              icon={<CalendarClock size={18} />}
              iconColor="bg-emerald-600"
              index={2}
            />
            <StatCard
              label="Interest Rate"
              value={`${loan.interestRate ?? 0}%`}
              icon={<Percent size={18} />}
              iconColor="bg-blue-600"
              index={3}
            />
          </StatsGrid>

          {/* Loan Info + Progress */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashCard>
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Loan Information</h3>
              <div className="space-y-2">
                {[
                  { label: "Status", value: <StatusBadge status={loan.status} /> },
                  { label: "Loan ID", value: loan.loanId || loan._id },
                  { label: "Type", value: loan.loanType ?? "Personal" },
                  { label: "Purpose", value: loan.purpose ?? "—" },
                  { label: "Start Date", value: fmtDate(loan.startDate) },
                  { label: "Maturity Date", value: fmtDate(loan.maturityDate) },
                  { label: "Disbursement Date", value: fmtDate(loan.disbursementDate) },
                  { label: "Next Payment", value: loan.nextPaymentDate ? `${fmtDate(loan.nextPaymentDate)} — ${fmt(loan.nextPaymentAmount ?? loan.monthlyPayment ?? 0, loan.currency)}` : "—" },
                  { label: "Total Repayment", value: fmt(loan.totalRepayment ?? 0, loan.currency) },
                  { label: "Total Interest", value: fmt(loan.totalInterest ?? 0, loan.currency) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </DashCard>

            <DashCard>
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Repayment Progress</h3>
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Repaid</span>
                  <span className="font-medium text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
                </div>
                <ProgressBar value={Math.min(progress, 100)} />
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{fmt(Math.max(0, (loan.principalAmount ?? 0) - (loan.outstandingBalance ?? 0)), loan.currency)} paid</span>
                  <span>{fmt(loan.outstandingBalance ?? 0, loan.currency)} remaining</span>
                </div>
              </div>

              {loan.missedPayments > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {loan.missedPayments} missed payment{loan.missedPayments > 1 ? "s" : ""}. Please make a payment to avoid penalties.
                  </p>
                </div>
              )}

              {loan.nextPaymentDate && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Next Payment Due</p>
                  <p className="mt-0.5 text-lg font-semibold text-blue-800 dark:text-blue-200">
                    {fmt(loan.nextPaymentAmount ?? loan.monthlyPayment ?? 0, loan.currency)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{fmtDate(loan.nextPaymentDate)}</p>
                </div>
              )}
            </DashCard>
          </div>

          {/* Repayment Schedule */}
          <DashCard padding="none">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Repayment Schedule</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{installments.length} installments</p>
            </div>

            {installments.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={<FileText size={36} />} title="No schedule available" description="The repayment schedule has not been generated yet." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      {["#", "Due Date", "Principal", "Interest", "Total", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {installments.map((inst: any, i: number) => (
                      <tr key={i} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{inst.installmentNumber ?? i + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{fmtDate(inst.dueDate)}</td>
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">{fmt(inst.principalAmount ?? 0, loan.currency)}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{fmt(inst.interestAmount ?? 0, loan.currency)}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">{fmt(inst.totalAmount ?? 0, loan.currency)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              inst.status === "paid"
                                ? "Paid"
                                : inst.status === "overdue"
                                  ? "Overdue"
                                  : inst.status === "partially_paid"
                                    ? "Partial"
                                    : "Pending"
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashCard>
        </motion.div>
      </PageContainer>
    </>
  );
};

export default LoanDetail;
