// ============================================================================
// ADMIN — LOAN APPLICATIONS
// Lists all loan applications from GET /loans/admin/applications.
// Supports approve/reject (with modal) and disburse actions.
// ============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  Percent,
  Users,
  Send,
  X,
  Loader2,
  Sliders,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import apiClient from "@core/api/client";
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
  SectionHeader,
  ProgressBar,
} from "@components/shared/DashboardPrimitives";
import { PageHeader } from "@components/shared/PageHeader";
import { useToast } from "@store/toast.store";
import { useLoansManagement } from "../../admin-usecase/useloans-admin-usecase";
import { TableSkeleton } from "@components/skeletons";

/* eslint-disable @typescript-eslint/no-explicit-any */

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const statusFilters = ["all", "submitted", "under_review", "approved", "rejected", "cancelled"];

const typeLabels: Record<string, string> = {
  personal: "Personal Loan",
  business: "Business Loan",
  mortgage: "Mortgage",
  auto: "Auto Loan",
  student: "Student Loan",
  payday: "Payday Loan",
};

// ─── Review Modal ─────────────────────────────────────────────────────────────
interface ReviewModalProps {
  loan: any;
  mode: "approve" | "reject";
  onConfirm: (notes: string, approvedAmount?: number) => void;
  onClose: () => void;
  isLoading: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ loan, mode, onConfirm, onClose, isLoading }) => {
  const [notes, setNotes] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<number>(loan.amount);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-base font-semibold ${mode === "approve" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
            {mode === "approve" ? "Approve Application" : "Reject Application"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{loan.applicant}</p>
            {loan.isThirdParty && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                3rd Party: {loan.thirdPartyApplicant?.fullName} ({loan.thirdPartyApplicant?.relationshipToSponsor})
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loan.email}
            {loan.isThirdParty && loan.thirdPartyApplicant?.email ? ` · Beneficiary: ${loan.thirdPartyApplicant.email}` : ""}
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {typeLabels[loan.type] ?? loan.type} · {fmt(loan.amount)} · {loan.term}mo · {loan.interestRate || 10}% APR
          </p>
        </div>

        <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/70 p-2.5 text-[11px] text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          An official <strong>Loan Decision &amp; Repayment Terms PDF</strong> detailing the interest percentage, loan amount, duration, total interest, and your approval/rejection reason will be automatically attached and emailed upon confirmation.
        </div>

        <div className="space-y-3">
          {mode === "approve" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Approved Amount
              </label>
              <input
                type="number"
                min={100}
                max={loan.amount}
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === "approve" ? "Notes (optional)" : "Reason for rejection"}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={mode === "approve" ? "Internal notes…" : "Explain why the application is being rejected…"}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <ActionButton label="Cancel" variant="secondary" onClick={onClose} />
          <button
            onClick={() => onConfirm(notes, mode === "approve" ? approvedAmount : undefined)}
            disabled={isLoading || (mode === "reject" && !notes.trim())}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60
              ${mode === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === "approve" ? "Approve" : "Reject"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function LoanApplications({ defaultStatus }: { defaultStatus?: string }) {
  const toast = useToast();
  const [reviewTarget, setReviewTarget] = useState<{ loan: any; mode: "approve" | "reject" } | null>(null);
  const [dossierTarget, setDossierTarget] = useState<any | null>(null);

  // Admin Loan Limit / Default Fee / Suspend Modal state
  const [policyTarget, setPolicyTarget] = useState<any | null>(null);
  const [policyForm, setPolicyForm] = useState({
    customMaxLoanAmount: "",
    defaultFeePercentPerDefault: 2.5,
    loanSuspended: false,
    suspensionReason: "",
    recordDefault: false,
  });
  const [policySaving, setPolicySaving] = useState(false);

  // Admin Manual Debit Repayment Modal state
  const [debitTarget, setDebitTarget] = useState<any | null>(null);
  const [debitAmount, setDebitAmount] = useState<number>(0);
  const [debitWalletId, setDebitWalletId] = useState<string>("");
  const [debitType, setDebitType] = useState<"regular" | "full">("regular");
  const [debitSaving, setDebitSaving] = useState(false);

  const {
    loans: filtered,
    stats,
    search,
    setSearch,
    statusFilter: activeStatus,
    setStatusFilter: setActiveStatus,
    typeFilter,
    setTypeFilter,
    approveLoan,
    rejectLoan,
    disburseLoan,
    refetch,
    isLoading,
    isMutating,
  } = useLoansManagement();

  const openPolicyModal = (loan: any) => {
    const cfg = loan.loanConfig || {};
    setPolicyTarget(loan);
    setPolicyForm({
      customMaxLoanAmount: cfg.customMaxLoanAmount != null ? String(cfg.customMaxLoanAmount) : "",
      defaultFeePercentPerDefault: Number(cfg.defaultFeePercentPerDefault ?? loan.defaultFeePercentage ?? 2.5),
      loanSuspended: Boolean(cfg.loanSuspended),
      suspensionReason: cfg.suspensionReason || "",
      recordDefault: false,
    });
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyTarget?.userId) {
      toast.error("Applicant user ID is missing");
      return;
    }
    setPolicySaving(true);
    try {
      await apiClient.patch(`/loans/admin/users/${policyTarget.userId}/loan-settings`, {
        customMaxLoanAmount:
          policyForm.customMaxLoanAmount.trim() === "" ? null : Number(policyForm.customMaxLoanAmount),
        defaultFeePercentPerDefault: Number(policyForm.defaultFeePercentPerDefault),
        loanSuspended: policyForm.loanSuspended,
        suspensionReason: policyForm.suspensionReason,
        loanId: policyTarget.loanId || undefined,
        recordDefault: policyForm.recordDefault,
      });
      toast.success(`Updated loan limit & default fee settings for ${policyTarget.applicant}`);
      setPolicyTarget(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update loan settings");
    } finally {
      setPolicySaving(false);
    }
  };

  const openDebitModal = (loan: any) => {
    const baseMonthly = Number(loan.monthlyPayment) || Math.round((Number(loan.amount || 0) / Math.max(1, Number(loan.term) || 12)) * 100) / 100;
    const defCount = Number(loan.defaultCount || 0);
    const defFeePct = Number(loan.defaultFeePercentage ?? 2.5);
    const defFeeAddon = defCount > 0 ? Math.round(baseMonthly * ((defCount * defFeePct) / 100) * 100) / 100 : 0;
    const minReq = Math.min(Number(loan.outstanding || loan.amount || 0), Math.round((baseMonthly + defFeeAddon) * 100) / 100);

    setDebitTarget({ ...loan, minRequired: minReq });
    setDebitAmount(minReq);
    setDebitType("regular");
    const wallets = Array.isArray(loan.userWallets) ? loan.userWallets : [];
    setDebitWalletId(wallets[0]?.id || wallets[0]?._id || "");
  };

  const handleAdminDebit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debitTarget?.loanId) {
      toast.error("Active disbursed loan ID is required to debit repayment");
      return;
    }
    const effective = debitType === "full" ? Number(debitTarget.outstanding || 0) : Number(debitAmount || 0);
    if (debitType === "regular" && effective < (debitTarget.minRequired || 0) - 0.01) {
      toast.error(`Repayment cannot be below the monthly requirement of ${fmt(debitTarget.minRequired || 0)}`);
      return;
    }
    setDebitSaving(true);
    try {
      await apiClient.post(`/loans/admin/${debitTarget.loanId}/debit-repayment`, {
        amount: effective,
        walletId: debitWalletId || undefined,
        paymentType: debitType,
      });
      toast.success(`Debited ${fmt(effective)} from ${debitTarget.applicant}'s account for loan repayment`);
      setDebitTarget(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to debit user account");
    } finally {
      setDebitSaving(false);
    }
  };

  // Apply defaultStatus prop as initial filter once ready
  React.useEffect(() => {
    if (defaultStatus && defaultStatus !== "all") {
      setActiveStatus(defaultStatus as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultStatus]);

  const handleReview = (notes: string, approvedAmount?: number) => {
    if (!reviewTarget) return;
    if (reviewTarget.mode === "approve") {
      approveLoan(reviewTarget.loan.applicationId, approvedAmount, notes, {
        onSuccess: () => setReviewTarget(null),
        onError: (err) => toast.error(err?.message || "Failed to approve"),
      });
    } else {
      rejectLoan(reviewTarget.loan.applicationId, notes, {
        onSuccess: () => setReviewTarget(null),
        onError: (err) => toast.error(err?.message || "Failed to reject"),
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        {reviewTarget && (
          <ReviewModal
            loan={reviewTarget.loan}
            mode={reviewTarget.mode}
            onConfirm={handleReview}
            onClose={() => setReviewTarget(null)}
            isLoading={isMutating}
          />
        )}
      </AnimatePresence>

      {/* ── Admin Applicant & Third-Party Underwriting Dossier Modal ── */}
      <AnimatePresence>
        {dossierTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setDossierTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Loan Application Underwriting Dossier
                    </h3>
                    {dossierTarget.isThirdParty ? (
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                        Third-Party Sponsored Application
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        Primary Account Holder
                      </span>
                    )}
                    {dossierTarget.otpVerified && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        Email OTP Confirmed
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Sponsoring Account Holder: <strong>{dossierTarget.applicant}</strong> ({dossierTarget.email}) · App ID:{" "}
                    {dossierTarget.applicationId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDossierTarget(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-5 text-xs">
                {/* Financial Overview */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-400">Requested Amount</p>
                    <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{fmt(dossierTarget.amount)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-400">Term &amp; APR</p>
                    <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                      {dossierTarget.term}mo · {dossierTarget.interestRate || 10}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-400">Monthly Min. (EMI)</p>
                    <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">{fmt(dossierTarget.monthlyPayment || 0)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                    <p className="text-[10px] text-gray-400">Default Penalty Policy</p>
                    <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                      +{dossierTarget.defaultFeePercentage ?? 2.5}% / default
                    </p>
                  </div>
                </div>

                {/* Third-Party Details Section */}
                {dossierTarget.isThirdParty && dossierTarget.thirdPartyApplicant ? (
                  <>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                        1. Third-Party Beneficiary Personal &amp; Employment Profile
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        <div><span className="text-gray-500">Full Legal Name:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.fullName}</strong></div>
                        <div><span className="text-gray-500">Relationship to Sponsor:</span> <strong className="capitalize text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.relationshipToSponsor}</strong></div>
                        <div><span className="text-gray-500">Email:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.email}</strong></div>
                        <div><span className="text-gray-500">Primary Phone:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.phoneNumber}</strong></div>
                        <div><span className="text-gray-500">Alternate Phone:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.alternatePhone || "—"}</strong></div>
                        <div><span className="text-gray-500">Date of Birth:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.dateOfBirth}</strong></div>
                        <div><span className="text-gray-500">Gender:</span> <strong className="capitalize text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.gender}</strong></div>
                        <div><span className="text-gray-500">Marital Status:</span> <strong className="capitalize text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.maritalStatus}</strong></div>
                        <div><span className="text-gray-500">Occupation:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.occupation}</strong></div>
                        <div><span className="text-gray-500">Employer:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.employerName || "—"}</strong></div>
                        <div><span className="text-gray-500">Monthly Income:</span> <strong className="text-gray-900 dark:text-white">{fmt(dossierTarget.thirdPartyApplicant.monthlyIncome || 0)}</strong></div>
                        <div><span className="text-gray-500">Sponsor Credit Score Used:</span> <strong className="text-emerald-600 dark:text-emerald-400">{dossierTarget.thirdPartyApplicant.sponsorCreditScoreUsed || 720}</strong></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                        <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                          2. Location, Identity &amp; Tax / SSN
                        </h4>
                        <div className="space-y-1.5">
                          <div><span className="text-gray-500">Country:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.country}</strong></div>
                          <div><span className="text-gray-500">State / City:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.state}, {dossierTarget.thirdPartyApplicant.city}</strong></div>
                          <div><span className="text-gray-500">Street Address:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.address}</strong></div>
                          <div><span className="text-gray-500">National ID / Passport #:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.nationalIdOrPassportNumber}</strong></div>
                          {dossierTarget.thirdPartyApplicant.ssn && (
                            <div><span className="text-gray-500">U.S. SSN:</span> <strong className="text-blue-600 dark:text-blue-400">{dossierTarget.thirdPartyApplicant.ssn}</strong></div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                        <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                          3. Banking, Routing / Sort Code / IBAN &amp; Next of Kin
                        </h4>
                        <div className="space-y-1.5">
                          <div><span className="text-gray-500">Bank Name:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.bankDetails?.bankName || "—"}</strong></div>
                          <div><span className="text-gray-500">Account Name &amp; #:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.bankDetails?.accountName} ({dossierTarget.thirdPartyApplicant.bankDetails?.accountNumber})</strong></div>
                          {dossierTarget.thirdPartyApplicant.bankDetails?.routingNumber && (
                            <div><span className="text-gray-500">Routing Number:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.bankDetails.routingNumber}</strong></div>
                          )}
                          {dossierTarget.thirdPartyApplicant.bankDetails?.sortCode && (
                            <div><span className="text-gray-500">Sort Code:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.bankDetails.sortCode}</strong></div>
                          )}
                          {dossierTarget.thirdPartyApplicant.bankDetails?.iban && (
                            <div><span className="text-gray-500">IBAN:</span> <strong className="text-gray-900 dark:text-white">{dossierTarget.thirdPartyApplicant.bankDetails.iban}</strong></div>
                          )}
                          <div className="border-t border-gray-200 pt-1.5 dark:border-gray-700">
                            <span className="text-gray-500">Next of Kin:</span>{" "}
                            <strong className="text-gray-900 dark:text-white">
                              {dossierTarget.thirdPartyApplicant.nextOfKin?.fullName} ({dossierTarget.thirdPartyApplicant.nextOfKin?.relationship}) · {dossierTarget.thirdPartyApplicant.nextOfKin?.phoneNumber}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Uploaded Compulsory Documents */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                        4. Uploaded Compulsory Documents (Driver&apos;s License Front &amp; Back + Bank Statement)
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                          {
                            label: "Driver's License (Front)",
                            url: dossierTarget.thirdPartyApplicant.driversLicenseFrontUrl,
                          },
                          {
                            label: "Driver's License (Back)",
                            url: dossierTarget.thirdPartyApplicant.driversLicenseBackUrl,
                          },
                          {
                            label: "Bank Account Statement",
                            url: dossierTarget.thirdPartyApplicant.bankStatementUrl,
                          },
                        ].map((doc) => (
                          <div
                            key={doc.label}
                            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                          >
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{doc.label}</p>
                              {doc.url && doc.url.startsWith("data:image/") ? (
                                <img
                                  src={doc.url}
                                  alt={doc.label}
                                  className="mt-2 h-28 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                                />
                              ) : (
                                <p className="mt-1 truncate text-[11px] text-emerald-600 dark:text-emerald-400">
                                  {doc.url ? "Verified Document Uploaded" : "No file"}
                                </p>
                              )}
                            </div>
                            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle size={12} /> Submitted for Review
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                    <p className="text-gray-600 dark:text-gray-300">
                      This is a direct personal/business loan application submitted by the primary account holder (<strong>{dossierTarget.applicant}</strong>). Purpose: <strong>{dossierTarget.purpose || "Personal"}</strong>.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                  {(dossierTarget.status === "submitted" || dossierTarget.status === "under_review") && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const target = dossierTarget;
                          setDossierTarget(null);
                          setReviewTarget({ loan: target, mode: "approve" });
                        }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve &amp; Send PDF Email
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const target = dossierTarget;
                          setDossierTarget(null);
                          setReviewTarget({ loan: target, mode: "reject" });
                        }}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Reject &amp; Send PDF Email
                      </button>
                    </>
                  )}
                  <ActionButton label="Close" variant="secondary" onClick={() => setDossierTarget(null)} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Admin Loan Limit, Default Fee % & Suspension Modal ── */}
      <AnimatePresence>
        {policyTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setPolicyTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Loan Limit, Default Fee &amp; Feature Control
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {policyTarget.applicant} ({policyTarget.email})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPolicyTarget(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePolicy} className="space-y-4">
                <div>
                  <label htmlFor="admin-loan-limit" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Custom Max Loan Limit (USD) — Leave blank for Volume-Based Automatic Limit
                  </label>
                  <input
                    id="admin-loan-limit"
                    name="customMaxLoanAmount"
                    type="number"
                    min={0}
                    max={10000000}
                    step={500}
                    value={policyForm.customMaxLoanAmount}
                    onChange={(e) => setPolicyForm((f) => ({ ...f, customMaxLoanAmount: e.target.value }))}
                    placeholder="e.g. 250000 (or leave empty for auto volume calculation)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Increase or reduce this customer&apos;s maximum borrowing limit across accounts, cards &amp; investments.
                  </p>
                </div>

                <div>
                  <label htmlFor="admin-default-fee" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Percentage Fee Increase Per Default (%)
                  </label>
                  <input
                    id="admin-default-fee"
                    name="defaultFeePercentPerDefault"
                    type="number"
                    min={0}
                    max={50}
                    step={0.25}
                    value={policyForm.defaultFeePercentPerDefault}
                    onChange={(e) =>
                      setPolicyForm((f) => ({ ...f, defaultFeePercentPerDefault: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    For every loan default, this percentage fee is added to the borrower&apos;s loan rate and monthly requirement.
                  </p>
                </div>

                {policyTarget.loanId && (
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                    <input
                      id="admin-record-default"
                      name="recordDefault"
                      type="checkbox"
                      checked={policyForm.recordDefault}
                      onChange={(e) => setPolicyForm((f) => ({ ...f, recordDefault: e.target.checked }))}
                      className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs text-amber-900 dark:text-amber-200">
                      <strong>Record a Default on Current Loan</strong> — Increments default count (+1) and immediately applies the{" "}
                      <strong>+{policyForm.defaultFeePercentPerDefault}%</strong> fee increase to the outstanding balance and monthly requirement.
                    </span>
                  </label>
                )}

                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/20">
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-200">
                      <ShieldAlert size={15} /> Suspend User Loan Feature
                    </span>
                    <input
                      id="admin-loan-suspended"
                      name="loanSuspended"
                      type="checkbox"
                      checked={policyForm.loanSuspended}
                      onChange={(e) => setPolicyForm((f) => ({ ...f, loanSuspended: e.target.checked }))}
                      className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                  </label>
                  {policyForm.loanSuspended && (
                    <div className="mt-2.5">
                      <label htmlFor="admin-suspend-reason" className="mb-1 block text-[11px] font-medium text-rose-700 dark:text-rose-300">
                        Suspension Reason (Shown to Customer)
                      </label>
                      <input
                        id="admin-suspend-reason"
                        name="suspensionReason"
                        type="text"
                        value={policyForm.suspensionReason}
                        onChange={(e) => setPolicyForm((f) => ({ ...f, suspensionReason: e.target.value }))}
                        placeholder="e.g. Multiple missed loan repayments — clear outstanding balance to restore access"
                        className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none dark:border-rose-800 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <ActionButton label="Cancel" variant="secondary" onClick={() => setPolicyTarget(null)} />
                  <button
                    type="submit"
                    disabled={policySaving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {policySaving && <Loader2 size={16} className="animate-spin" />}
                    Save Loan Policy &amp; Limits
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Admin Manual Account Debit Repayment Modal ── */}
      <AnimatePresence>
        {debitTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setDebitTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Debit User Account for Loan Repayment
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {debitTarget.applicant} · Manual Admin Debit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDebitTarget(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                <div className="flex justify-between">
                  <span>Outstanding Loan Balance:</span>
                  <span className="font-bold">{fmt(debitTarget.outstanding || 0)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Minimum Monthly Requirement:</span>
                  <span className="font-bold">{fmt(debitTarget.minRequired || 0)}</span>
                </div>
              </div>

              <form onSubmit={handleAdminDebit} className="space-y-4">
                <div className="flex gap-2">
                  {(["regular", "full"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setDebitType(t);
                        if (t === "regular" && debitAmount < (debitTarget.minRequired || 0)) {
                          setDebitAmount(debitTarget.minRequired || 0);
                        }
                      }}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-colors ${
                        debitType === t
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {t === "full" ? "Full Balance Payoff" : "Monthly / Custom Debit"}
                    </button>
                  ))}
                </div>

                {debitType === "regular" && (
                  <div>
                    <label htmlFor="admin-debit-amount" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Amount to Debit (Minimum: {fmt(debitTarget.minRequired || 0)})
                    </label>
                    <input
                      id="admin-debit-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min={debitTarget.minRequired || 1}
                      max={debitTarget.outstanding}
                      value={debitAmount}
                      onChange={(e) => setDebitAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    {debitAmount < (debitTarget.minRequired || 0) - 0.01 && (
                      <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                        Amount cannot be below the monthly requirement of {fmt(debitTarget.minRequired || 0)}.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="admin-debit-wallet" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Select User Account / Wallet to Debit
                  </label>
                  {Array.isArray(debitTarget.userWallets) && debitTarget.userWallets.length > 0 ? (
                    <select
                      id="admin-debit-wallet"
                      name="walletId"
                      value={debitWalletId}
                      onChange={(e) => setDebitWalletId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      {debitTarget.userWallets.map((w: any) => (
                        <option key={w.id || w._id} value={w.id || w._id}>
                          {w.walletNumber} ({w.walletType}) — Available: {fmt(w.balance ?? 0)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                      Will debit applicant&apos;s primary active disbursement account automatically.
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <ActionButton label="Cancel" variant="secondary" onClick={() => setDebitTarget(null)} />
                  <button
                    type="submit"
                    disabled={
                      debitSaving ||
                      (debitType === "regular" && debitAmount < (debitTarget.minRequired || 0) - 0.01)
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {debitSaving && <Loader2 size={16} className="animate-spin" />}
                    Debit {fmt(debitType === "full" ? debitTarget.outstanding : debitAmount)}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageContainer className="px-2 sm:px-3 lg:px-4 [&>div]:max-w-full">
        <PageHeader
          title="Loan Management"
          subtitle="Review applications, manage active loans, and monitor repayments"
          breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Loans" }]}
          actions={
            <div className="flex gap-2">
              <ActionButton label="Export" icon={<Download size={14} />} onClick={() => {}} variant="secondary" />
              <ActionButton label="Refresh" icon={<RefreshCw size={14} />} onClick={() => refetch()} />
            </div>
          }
        />

        <StatsGrid>
          <StatCard label="Total Portfolio" value={fmt(stats.totalDisbursed)} icon={<DollarSign size={18} />} iconColor="bg-blue-600" positive index={0} />
          <StatCard label="Active Loans" value={stats.activeLoans} icon={<Banknote size={18} />} iconColor="bg-emerald-600" index={1} />
          <StatCard label="Pending Applications" value={stats.pendingApplications} icon={<Clock size={18} />} iconColor="bg-amber-600" index={2} />
          <StatCard label="Total Applications" value={stats.totalLoans} icon={<Users size={18} />} iconColor="bg-rose-600" positive={false} index={3} />
        </StatsGrid>

        {/* Status tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 touch-pan-x scrollbar-hide">
          {statusFilters.map((s) => (
            <FilterPill
              key={s}
              label={s === "all" ? "All" : s.replace("_", " ")}
              active={activeStatus === s}
              onClick={() => setActiveStatus(s as any)}
            />
          ))}
        </div>

        <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, email or application ID…">
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All Types" },
              { value: "personal", label: "Personal" },
              { value: "business", label: "Business" },
              { value: "mortgage", label: "Mortgage" },
              { value: "auto", label: "Auto" },
              { value: "student", label: "Student" },
            ]}
          />
        </FilterBar>

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((loan: any, i: number) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <DashCard>
                    <div className="grid grid-cols-1 gap-3.5 sm:gap-4 xl:grid-cols-12 xl:items-center">
                      {/* Applicant Info */}
                      <div className="flex min-w-0 items-center gap-3 xl:col-span-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
                          <Banknote size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{loan.applicant}</p>
                            {loan.isThirdParty && (
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                                3rd Party: {loan.thirdPartyApplicant?.fullName || "Beneficiary"} ({loan.thirdPartyApplicant?.relationshipToSponsor || "Sponsored"})
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[10px] text-gray-400 sm:text-xs">
                            {loan.email}
                            {loan.isThirdParty && loan.thirdPartyApplicant?.email
                              ? ` → ${loan.thirdPartyApplicant.email}`
                              : ""}{" "}
                            · App: {loan.applicationId?.slice(-8) || loan.id?.slice(-8)}
                          </p>
                        </div>
                      </div>

                      {/* Loan Metrics */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:col-span-5">
                        <div>
                          <p className="text-[10px] text-gray-400">Amount / Outst.</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {fmt(loan.amount)}
                            {loan.disbursed && (
                              <span className="ml-1 text-xs font-normal text-amber-600 dark:text-amber-400">
                                ({fmt(loan.outstanding)} left)
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Monthly Min.</p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{fmt(loan.monthlyPayment || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Rate / Default Fee</p>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {loan.interestRate || 10}% APR · +{loan.defaultFeePercentage ?? 2.5}%/def
                            {loan.defaultCount > 0 && (
                              <span className="ml-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                {loan.defaultCount} def
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Term &amp; Type</p>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {loan.term}mo · {typeLabels[loan.type] ?? loan.type}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-wrap items-center gap-1.5 xl:col-span-2">
                        {loan.loanConfig?.loanSuspended && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Loans Suspended
                          </span>
                        )}
                        {loan.loanConfig?.customMaxLoanAmount != null && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            Limit: {fmt(loan.loanConfig.customMaxLoanAmount)}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            loan.kycStatus === "approved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : loan.kycStatus === "in_review"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          KYC: {loan.kycStatus === "in_review" ? "In Review" : loan.kycStatus}
                        </span>
                        <StatusBadge status={loan.disbursed ? (loan.loanStatus || "active") : loan.status} />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 xl:col-span-2 xl:justify-end">
                        {/* Approve / Reject for submitted/under_review */}
                        {(loan.status === "submitted" || loan.status === "under_review") && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setReviewTarget({ loan, mode: "approve" })}
                              title="Approve"
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                            >
                              <CheckCircle size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setReviewTarget({ loan, mode: "reject" })}
                              title="Reject"
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                            >
                              <XCircle size={16} />
                            </motion.button>
                          </>
                        )}

                        {/* Disburse for approved (but not yet disbursed) */}
                        {loan.canDisburse && loan.loanId && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              disburseLoan(loan.loanId, {
                                onError: (err) => toast.error(err?.message || "Disbursement failed"),
                              })
                            }
                            title="Disburse Loan"
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                          >
                            <Send size={16} />
                          </motion.button>
                        )}

                        {/* Admin Manual Debit Repayment button for active/approved loans */}
                        {loan.loanId && Number(loan.outstanding || 0) > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openDebitModal(loan)}
                            title="Debit User Account for Loan Repayment"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <Wallet size={13} /> Debit Repay
                          </motion.button>
                        )}

                        {/* View Full Underwriting Dossier & Third-Party Documents */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDossierTarget(loan)}
                          title="View Full Application & Third-Party KYC Dossier"
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                        >
                          <Eye size={13} /> Dossier
                        </motion.button>

                        {/* Admin Manage Limit / Default Fee % / Suspend Loan Feature */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openPolicyModal(loan)}
                          title="Adjust Loan Limit, Default Fee %, or Suspend User Loan Feature"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <Sliders size={13} /> Limit &amp; Policy
                        </motion.button>
                      </div>
                    </div>

                    {/* Rejection reason */}
                    {loan.status === "rejected" && loan.rejectionReason && (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 dark:border-rose-900 dark:bg-rose-950/30">
                        <p className="text-[10px] text-rose-600 dark:text-rose-400">
                          Reason: {loan.rejectionReason}
                        </p>
                      </div>
                    )}
                  </DashCard>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <DashCard className="py-12 text-center">
                <Banknote size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No loan applications found matching your criteria</p>
              </DashCard>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
