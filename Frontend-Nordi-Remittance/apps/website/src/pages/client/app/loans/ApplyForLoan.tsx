// ============================================================================
// APPLY FOR LOAN — Multi-step application form backed by /loans/apply
// Steps: 1 Eligibility check → 2 Loan details → 3 Review → 4 Confirmation
// ============================================================================

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Percent,
  CalendarClock,
  DollarSign,
  FileText,
  Wallet,
  BadgeDollarSign,
  ShieldCheck,
  Clock,
  RefreshCw,
  X,
} from "@constants/icons";
import { PageContainer, DashCard, StatCard, StatsGrid, ActionButton } from "@components/shared/DashboardPrimitives";
import PageHeader from "@components/shared/PageHeader";
import { StatsGridSkeleton, FormSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import apiClient from "@core/api/client";
import {
  useClientEligibility,
  useApplyForLoan,
} from "../../client-usecase/useloans-client-usecase";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

const fmt = (v: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(v);

const LOAN_PURPOSES = [
  "Personal expenses",
  "Medical expenses",
  "Education",
  "Home improvement",
  "Business",
  "Debt consolidation",
  "Travel",
  "Other",
];

// ─── EMI local calc ───────────────────────────────────────────────────────────
function calcEmi(amount: number, annualRate: number, termMonths: number) {
  if (!amount || !termMonths) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return amount / termMonths;
  return (amount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = ["Eligibility", "Loan Details", "Review", "Confirmation"];

const StepIndicator: React.FC<{ current: number; onSelectStep?: (stepIndex: number) => void }> = ({
  current,
  onSelectStep,
}) => (
  <div className="mx-auto mb-5 flex w-full max-w-4xl items-center justify-between px-1 sm:px-4">
    {STEPS.map((label, i) => {
      const isClickable = Boolean(onSelectStep) && (i <= 2 || current === 3);
      return (
        <React.Fragment key={i}>
          <button
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onSelectStep?.(i)}
            className={`group flex shrink-0 flex-col items-center focus:outline-none ${
              isClickable ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <div
              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors
                ${
                  i < current
                    ? "bg-emerald-500 text-white group-hover:bg-emerald-600"
                    : i === current
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40"
                      : "bg-gray-200 text-gray-500 group-hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:group-hover:bg-gray-600"
                }`}
            >
              {i < current ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span
              className={`mt-1.5 text-[10px] sm:text-xs ${
                i === current
                  ? "font-semibold text-blue-600 dark:text-blue-400"
                  : i < current
                    ? "font-medium text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <div className={`mx-2 mb-4 h-0.5 flex-1 sm:mx-4 ${i < current ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const DEFAULT_KYC_STEPS = [
  {
    key: "personal_info",
    label: "Personal Information & Date of Birth",
    description: "Full legal name, verified email, phone number, and date of birth",
    completed: false,
    status: "incomplete",
    detail: "Complete personal information & date of birth",
  },
  {
    key: "address",
    label: "Residential Address Details",
    description: "Home street address, city, and country of residence",
    completed: false,
    status: "incomplete",
    detail: "Provide residential street address, city, and country",
  },
  {
    key: "identity_document",
    label: "Government-Issued ID Verification",
    description: "Passport, National ID, or Driver's License type, ID number, and document",
    completed: false,
    status: "incomplete",
    detail: "Provide government ID type and ID number",
  },
  {
    key: "proof_of_address",
    label: "Proof of Address Verification",
    description: "Utility bill, bank statement, or tax assessment document type",
    completed: false,
    status: "incomplete",
    detail: "Submit proof of address verification",
  },
  {
    key: "selfie",
    label: "Biometric Selfie with ID",
    description: "Identity selfie confirmation matching your government ID",
    completed: false,
    status: "incomplete",
    detail: "Complete biometric selfie verification",
  },
  {
    key: "signature",
    label: "Digital Signature Authorization",
    description: "Authorized signature for credit and loan agreements",
    completed: false,
    status: "incomplete",
    detail: "Provide digital signature authorization",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
const ApplyForLoan: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    amount: 5000,
    termMonths: 12,
    purpose: "Personal expenses",
    disbursementWalletId: "",
  });
  const [submittedApp, setSubmittedApp] = useState<any>(null);

  const { eligibility, isLoading: eligLoading, refetch: refetchEligibility } = useClientEligibility();
  const { wallets, isLoading: walletsLoading } = useClientWallets();
  const applyMutation = useApplyForLoan();

  // Third-Party / Sponsored Loan Application state
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [tpFormError, setTpFormError] = useState<string | null>(null);
  const [thirdPartyForm, setThirdPartyForm] = useState({
    fullName: "",
    relationshipToSponsor: "spouse",
    email: "",
    phoneNumber: "",
    alternatePhone: "",
    dateOfBirth: "1994-04-12",
    gender: "female",
    maritalStatus: "married",
    occupation: "",
    employerName: "",
    employmentStatus: "employed",
    monthlyIncome: 4500,
    country: "United States",
    state: "",
    city: "",
    address: "",
    postalCode: "",
    idDocumentType: "national_id",
    nationalIdOrPassportNumber: "",
    ssn: "",
    driversLicenseFrontUrl: "",
    driversLicenseFrontName: "",
    driversLicenseBackUrl: "",
    driversLicenseBackName: "",
    bankStatementUrl: "",
    bankStatementName: "",
    bankDetails: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      routingNumber: "",
      sortCode: "",
      iban: "",
      swiftBic: "",
      currency: "USD",
    },
    nextOfKin: {
      fullName: "",
      relationship: "spouse",
      phoneNumber: "",
      email: "",
      address: "",
    },
  });

  // Email OTP Confirmation state for loan submission
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);

  const handleThirdPartyFileUpload = (
    urlField: "driversLicenseFrontUrl" | "driversLicenseBackUrl" | "bankStatementUrl",
    nameField: "driversLicenseFrontName" | "driversLicenseBackName" | "bankStatementName",
    file?: File | null,
  ) => {
    if (!file) return;
    setTpFormError(null);
    // Keep payload compact while supporting preview
    if (file.size <= 350 * 1024 && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setThirdPartyForm((prev) => ({
          ...prev,
          [urlField]: String(reader.result || `uploaded://${file.name}`),
          [nameField]: file.name,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setThirdPartyForm((prev) => ({
        ...prev,
        [urlField]: `uploaded-document://${encodeURIComponent(file.name)}?size=${file.size}&ts=${Date.now()}`,
        [nameField]: file.name,
      }));
    }
  };

  const tpCountryLower = thirdPartyForm.country.trim().toLowerCase();
  const isTpUSA =
    tpCountryLower === "united states" || tpCountryLower === "usa" || tpCountryLower === "us";
  const isTpUK =
    tpCountryLower === "united kingdom" || tpCountryLower === "uk" || tpCountryLower === "gb";
  const isTpIbanCountry = [
    "germany",
    "france",
    "netherlands",
    "spain",
    "italy",
    "sweden",
    "norway",
    "finland",
    "denmark",
    "belgium",
    "switzerland",
    "austria",
    "ireland",
    "poland",
    "portugal",
  ].includes(tpCountryLower);

  const validateThirdPartyBeforeReview = (): string | null => {
    if (!isThirdParty) return null;
    const tp = thirdPartyForm;
    if (!tp.fullName.trim()) return "Please enter the third-party applicant's full legal name.";
    if (!tp.relationshipToSponsor) return "Please select the applicant's relationship with you.";
    if (!tp.email.trim() || !tp.email.includes("@")) return "Please enter a valid email address for the third-party applicant.";
    if (!tp.phoneNumber.trim()) return "Please enter the third-party applicant's phone number.";
    if (!tp.dateOfBirth) return "Please enter the third-party applicant's date of birth.";
    if (!tp.occupation.trim()) return "Please enter the third-party applicant's occupation.";
    if (!tp.monthlyIncome || Number(tp.monthlyIncome) <= 0) return "Please enter the third-party applicant's monthly income.";
    if (!tp.country.trim() || !tp.state.trim() || !tp.city.trim() || !tp.address.trim()) {
      return "Please complete the third-party applicant's country, state, city, and street address.";
    }
    if (!tp.nationalIdOrPassportNumber.trim()) {
      return "Please enter the third-party applicant's National ID or Passport number.";
    }
    if (isTpUSA && (!tp.ssn.trim() || tp.ssn.trim().length < 4)) {
      return "SSN (Social Security Number) is compulsory for applicants in the United States.";
    }
    if (!tp.bankDetails.bankName.trim() || !tp.bankDetails.accountNumber.trim()) {
      return "Please enter the third-party applicant's bank name and bank account number.";
    }
    if (isTpUSA && !tp.bankDetails.routingNumber.trim()) {
      return "Routing Number is compulsory for bank accounts in the United States.";
    }
    if (isTpUK && !tp.bankDetails.sortCode.trim() && !tp.bankDetails.iban.trim()) {
      return "Sort Code (or IBAN) is compulsory for bank accounts in the United Kingdom.";
    }
    if (isTpIbanCountry && !tp.bankDetails.iban.trim()) {
      return `IBAN is compulsory for bank accounts in ${tp.country}.`;
    }
    if (!tp.nextOfKin.fullName.trim() || !tp.nextOfKin.phoneNumber.trim()) {
      return "Please complete Next of Kin full name and phone number.";
    }
    if (!tp.driversLicenseFrontUrl || !tp.driversLicenseBackUrl) {
      return "Driver's License Front and Back image uploads are both compulsory.";
    }
    if (!tp.bankStatementUrl) {
      return "Bank Account Statement document upload is compulsory.";
    }
    return null;
  };

  // Inline KYC completion modal state
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycSuccessMsg, setKycSuccessMsg] = useState<string | null>(null);
  const [kycErrorMsg, setKycErrorMsg] = useState<string | null>(null);
  const [kycForm, setKycForm] = useState({
    dateOfBirth: "1992-06-15",
    homeAddress: "",
    city: "",
    country: "United States",
    idType: "passport",
    idNumber: "",
    idExpiryDate: "2030-12-31",
    addressDocType: "utility_bill",
    selfieConfirmed: true,
    signature: "",
  });

  const kycChecklist = useMemo(() => {
    if (Array.isArray(eligibility.kycChecklist) && eligibility.kycChecklist.length > 0) {
      return eligibility.kycChecklist;
    }
    return DEFAULT_KYC_STEPS;
  }, [eligibility.kycChecklist]);

  const incompleteKycItems = useMemo(
    () => kycChecklist.filter((item) => !item.completed),
    [kycChecklist],
  );

  const completedKycCount = useMemo(
    () => kycChecklist.filter((item) => item.completed).length,
    [kycChecklist],
  );

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycSubmitting(true);
    setKycErrorMsg(null);
    setKycSuccessMsg(null);
    try {
      await apiClient.post("/kyc/verify", {
        ...kycForm,
        governmentId: kycForm.idNumber ? `verified-id-${kycForm.idType}-${kycForm.idNumber}` : undefined,
        proofOfAddress: kycForm.addressDocType ? `verified-poa-${kycForm.addressDocType}` : undefined,
        selfieWithId: kycForm.selfieConfirmed ? "verified-biometric-selfie" : undefined,
      });
      setKycSuccessMsg(
        "Your KYC verification details have been submitted and placed In Review! An Administrator will review and approve your KYC before loan eligibility is unlocked.",
      );
      await refetchEligibility();
      setTimeout(() => {
        setShowKycModal(false);
      }, 1500);
    } catch (err: any) {
      setKycErrorMsg(
        err?.response?.data?.message || err?.message || "Failed to submit KYC details. Please check your inputs.",
      );
    } finally {
      setKycSubmitting(false);
    }
  };

  const activeWallets = useMemo(
    () => (wallets as any[]).filter((w: any) => w.status === "active" || !w.status),
    [wallets],
  );

  // Auto-select first wallet
  React.useEffect(() => {
    if (activeWallets.length && !form.disbursementWalletId) {
      setForm((f) => ({ ...f, disbursementWalletId: activeWallets[0]._id || activeWallets[0].id || "" }));
    }
  }, [activeWallets, form.disbursementWalletId]);

  // Derived interest rate based on credit score + default percentage fee increase (mirrors backend logic)
  const estimatedRate = useMemo(() => {
    const score = eligibility.creditScore;
    let base = 15;
    if (score >= 700) base = 8;
    else if (score >= 650) base = 10;
    else if (score >= 600) base = 12;
    const defaultPenalty = Number(eligibility.volumeBreakdown?.totalDefaultFeePercent || 0);
    return Math.round((base + defaultPenalty) * 100) / 100;
  }, [eligibility.creditScore, eligibility.volumeBreakdown?.totalDefaultFeePercent]);

  const emi = useMemo(() => calcEmi(form.amount, estimatedRate, form.termMonths), [form.amount, estimatedRate, form.termMonths]);
  const totalRepayment = emi * form.termMonths;
  const totalInterest = totalRepayment - form.amount;

  const handleRequestOtp = async () => {
    setOtpSending(true);
    setOtpError(null);
    setOtpSentNotice(null);
    try {
      const res: any = await apiClient.post("/loans/apply/send-otp", {
        amount: form.amount,
        purpose: form.purpose,
        termMonths: form.termMonths,
        disbursementWalletId: form.disbursementWalletId,
        isThirdParty,
        thirdPartyApplicant: isThirdParty ? thirdPartyForm : undefined,
      });
      const targetEmail = res?.data?.email || "your registered email";
      const tpMail = res?.data?.thirdPartyEmail;
      setOtpSentNotice(
        tpMail
          ? `A 6-digit confirmation OTP has been sent to ${targetEmail} and to ${tpMail}. Enter the OTP below to confirm your application.`
          : `A 6-digit confirmation OTP has been sent to ${targetEmail}. Enter the OTP below to confirm your loan application.`,
      );
      setShowOtpModal(true);
    } catch (err: any) {
      setOtpError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send confirmation OTP. Please check your KYC status and application fields.",
      );
      setShowOtpModal(true);
    } finally {
      setOtpSending(false);
    }
  };

  const handleConfirmOtpAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }
    setOtpError(null);
    applyMutation.mutate(
      {
        amount: form.amount,
        purpose: form.purpose,
        termMonths: form.termMonths,
        disbursementWalletId: form.disbursementWalletId,
        otpCode: otpCode.trim(),
        isThirdParty,
        thirdPartyApplicant: isThirdParty ? thirdPartyForm : undefined,
      } as any,
      {
        onSuccess: (data: any) => {
          setShowOtpModal(false);
          setOtpCode("");
          setSubmittedApp(data?.application || data);
          setStep(3);
        },
        onError: (err: any) => {
          setOtpError(
            err?.response?.data?.message ||
              err?.message ||
              "Invalid or expired OTP code. Please try again or resend OTP.",
          );
        },
      },
    );
  };

  if (eligLoading || walletsLoading) {
    return (
      <PageContainer>
        <PageHeader title="Apply for a Loan" breadcrumbs={[{ label: "Loans", href: "/customer/loans" }, { label: "Apply" }]} />
        <StatsGridSkeleton count={3} />
        <FormSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Apply for a Loan"
        breadcrumbs={[
          { label: "Dashboard", href: "/customer/dashboard" },
          { label: "Loans", href: "/customer/loans" },
          { label: "Apply" },
        ]}
      />

      <div className="w-full space-y-4 sm:space-y-6">
        <StepIndicator
          current={step}
          onSelectStep={(targetStep) => {
            if (targetStep <= 2) setStep(targetStep);
          }}
        />

        {/* ── Step 0: Eligibility ── */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12"
          >
            <div className="xl:col-span-8">
              <DashCard>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Your Loan Eligibility &amp; KYC Status</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Complete and submit all 6 KYC verification items for Administrator approval
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetchEligibility()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <RefreshCw size={13} /> Re-check Status
                  </button>
                </div>

                {!eligibility.eligible ? (
                  <div className="space-y-4 sm:space-y-5">
                    {/* Loan Suspended by Admin Banner */}
                    {eligibility.loanSuspended && (
                      <div className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/40">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                              Loan Feature Suspended by Administrator
                            </p>
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                              Suspended
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                            {eligibility.reason ||
                              eligibility.volumeBreakdown?.suspensionReason ||
                              "Your loan access has been temporarily suspended by an Administrator. Please clear any overdue loan balances or contact support."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Main KYC / Eligibility Banner */}
                    {!eligibility.loanSuspended && eligibility.kycStatus === "in_review" ? (
                      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                              KYC Submitted — Pending Admin Approval
                            </p>
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                              In Review ({completedKycCount}/{kycChecklist.length} Completed)
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                            {eligibility.reason ||
                              "Your KYC verification package has been submitted and is awaiting Administrator approval. Once an Admin approves your KYC, you can immediately proceed with your loan application."}
                          </p>
                        </div>
                      </div>
                    ) : eligibility.kycStatus === "rejected" ? (
                      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                              KYC Verification Requires Revision
                            </p>
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                              Rejected
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                            {eligibility.rejectionReason ||
                              eligibility.reason ||
                              "Your previous KYC submission was declined by an Administrator. Please update the incomplete items below and resubmit for Admin approval."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                              Not Yet Eligible — Complete Your KYC Verification
                            </p>
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                              {completedKycCount} of {kycChecklist.length} Completed
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                            {eligibility.reason ||
                              "Please complete the remaining KYC verification items below. Once submitted, an Administrator will review and approve your KYC to unlock loan applications."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* KYC Requirements Breakdown: Incomplete vs Completed */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 sm:p-4 dark:border-gray-800 dark:bg-gray-900/40">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            KYC Verification Checklist
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {incompleteKycItems.length > 0
                              ? `${incompleteKycItems.length} item(s) not yet completed — complete and submit for Admin approval`
                              : "All KYC items submitted — awaiting Admin approval"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className={`h-full rounded-full transition-all ${
                                eligibility.kycStatus === "approved"
                                  ? "bg-emerald-500"
                                  : eligibility.kycStatus === "in_review"
                                    ? "bg-blue-600"
                                    : "bg-amber-500"
                              }`}
                              style={{
                                width: `${Math.round((completedKycCount / Math.max(kycChecklist.length, 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {Math.round((completedKycCount / Math.max(kycChecklist.length, 1)) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
                        {kycChecklist.map((item) => {
                          const isDone = item.completed;
                          const isInReview = eligibility.kycStatus === "in_review" && isDone;
                          return (
                            <div
                              key={item.key}
                              className={`flex items-start justify-between gap-2.5 rounded-xl border p-3 transition-colors ${
                                isDone
                                  ? "border-emerald-200/80 bg-white dark:border-emerald-900/50 dark:bg-gray-800/80"
                                  : "border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/15"
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                ) : (
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{item.label}</p>
                                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                    {item.detail || item.description}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isInReview
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                    : isDone
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                }`}
                              >
                                {isInReview ? "In Review" : isDone ? "Completed" : "Not Completed"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Footer */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Note: Submitted KYC documents and details must be approved by an Administrator before loan eligibility is activated.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate("/customer/profile/documents")}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            <FileText size={14} /> Document Center
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setKycErrorMsg(null);
                              setKycSuccessMsg(null);
                              setShowKycModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                          >
                            <ShieldCheck size={15} />
                            {eligibility.kycStatus === "in_review"
                              ? "Update / Resubmit KYC Details"
                              : "Proceed to Complete KYC"}
                            <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                          >
                            Continue to Loan Details <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                            KYC Approved — You&apos;re Eligible to Apply
                          </p>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            Up to {fmt(eligibility.maxAmount || 75000)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                          Your credit profile and KYC verification have been approved. Configure your loan details in Step 2.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
                      {kycChecklist.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-white p-3 dark:border-emerald-900/40 dark:bg-gray-800/70"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            <span className="truncate text-xs font-medium text-gray-900 dark:text-white">{item.label}</span>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            Verified
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        Continue to Loan Details <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </DashCard>
            </div>

            {/* Right Sidebar: Borrowing Power & Financial Ecosystem Volume */}
            <div className="xl:col-span-4 space-y-4">
              <DashCard>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Credit Capacity &amp; Ecosystem Volume
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Credit Score", value: eligibility.creditScore || 720 },
                    { label: "Max Loan Limit", value: fmt(eligibility.maxAmount || 75000) },
                    { label: "Monthly Income", value: eligibility.monthlyIncome ? fmt(eligibility.monthlyIncome) : "$5,000" },
                    {
                      label: "Total Volume",
                      value: fmt(eligibility.volumeBreakdown?.totalFinancialVolume ?? 0),
                    },
                    {
                      label: "Repayment Speed",
                      value: `${eligibility.volumeBreakdown?.repaymentSpeedMultiplier ?? 1}x (${eligibility.volumeBreakdown?.repaymentSpeedLabel || "Good"})`,
                    },
                    {
                      label: "Default Fee Policy",
                      value:
                        (eligibility.volumeBreakdown?.defaultCount ?? 0) > 0
                          ? `${eligibility.volumeBreakdown?.defaultCount} def (+${eligibility.volumeBreakdown?.totalDefaultFeePercent}%)`
                          : `+${eligibility.volumeBreakdown?.defaultFeePercentPerDefault ?? 2.5}% / default`,
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.label}</p>
                      <p className="mt-0.5 truncate text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs dark:border-blue-900/50 dark:bg-blue-950/20">
                  <p className="font-semibold text-blue-900 dark:text-blue-200">
                    Volume-Driven Limit Breakdown
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-blue-800 dark:text-blue-300">
                    <div>Accounts: <strong>{fmt(eligibility.volumeBreakdown?.accountsBalance ?? 0)}</strong></div>
                    <div>Transactions: <strong>{fmt(eligibility.volumeBreakdown?.transactionVolume ?? 0)}</strong></div>
                    <div>Cards: <strong>{fmt(eligibility.volumeBreakdown?.cardsVolume ?? 0)}</strong></div>
                    <div>Investments: <strong>{fmt(eligibility.volumeBreakdown?.investmentsVolume ?? 0)}</strong></div>
                  </div>
                  <p className="mt-2.5 border-t border-blue-200/60 pt-2 text-[11px] text-blue-700 dark:border-blue-800/60 dark:text-blue-400">
                    <strong>Manual Repayment Policy:</strong> Loans never auto-debit your accounts. You repay manually by clicking Repay and selecting an account with at least your monthly requirement.
                  </p>
                </div>
              </DashCard>
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Loan Details ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12"
          >
            <div className="lg:col-span-7 xl:col-span-8">
              <DashCard>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Step 2: Configure Loan Details</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Select your desired loan amount, repayment duration, purpose, and disbursement account
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    Est. APR: ~{estimatedRate}% p.a.
                  </span>
                </div>

                <div className="space-y-5">
                  {/* Application Type Selector: Self vs Third-Party (Using User Credit Score Advantage) */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 sm:p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                      Who is this loan application for?
                    </label>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsThirdParty(false);
                          setTpFormError(null);
                        }}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          !isThirdParty
                            ? "border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-gray-900"
                            : "border-gray-200 bg-white/60 hover:bg-white dark:border-gray-700 dark:bg-gray-800/50"
                        }`}
                      >
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          1. Apply for Myself (Account Holder)
                        </span>
                        <span className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          Standard personal or business loan disbursed directly to your wallet
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsThirdParty(true);
                          setTpFormError(null);
                        }}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          isThirdParty
                            ? "border-indigo-600 bg-white shadow-sm ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-gray-900"
                            : "border-gray-200 bg-white/60 hover:bg-white dark:border-gray-700 dark:bg-gray-800/50"
                        }`}
                      >
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          2. Apply for a Third Party (Spouse / Child / Friend)
                        </span>
                        <span className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          Use your Credit Score ({eligibility.creditScore || 720}) &amp; Volume Capacity advantage to sponsor a third party
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 sm:p-4 dark:border-gray-800 dark:bg-gray-800/30">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor="loan-amount-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Loan Amount (USD)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="loan-amount-number"
                          name="amountNumber"
                          type="number"
                          min={100}
                          max={eligibility.maxAmount || 75000}
                          step={100}
                          value={form.amount}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              amount: Math.max(100, Math.min(eligibility.maxAmount || 75000, Number(e.target.value) || 100)),
                            }))
                          }
                          className="w-32 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-right text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{fmt(form.amount)}</span>
                      </div>
                    </div>
                    <input
                      id="loan-amount-input"
                      name="amount"
                      type="range"
                      min={100}
                      max={eligibility.maxAmount || 75000}
                      step={100}
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
                    />
                    <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                      <span>{fmt(100)}</span>
                      <span>{fmt(Math.round((eligibility.maxAmount || 75000) / 2))}</span>
                      <span>{fmt(eligibility.maxAmount || 75000)}</span>
                    </div>
                  </div>

                  {/* Term */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 sm:p-4 dark:border-gray-800 dark:bg-gray-800/30">
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="loan-term-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Repayment Term
                      </label>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{form.termMonths} months</span>
                    </div>
                    <input
                      id="loan-term-input"
                      name="termMonths"
                      type="range"
                      min={1}
                      max={60}
                      step={1}
                      value={form.termMonths}
                      onChange={(e) => setForm((f) => ({ ...f, termMonths: Number(e.target.value) }))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700"
                    />
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {[3, 6, 12, 18, 24, 36, 48, 60].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, termMonths: m }))}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                            form.termMonths === m
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          }`}
                        >
                          {m} mo
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2-Column Purpose & Disbursement Wallet on Desktop */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="loan-purpose-select" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Loan Purpose
                      </label>
                      <select
                        id="loan-purpose-select"
                        name="purpose"
                        value={form.purpose}
                        onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      >
                        {LOAN_PURPOSES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="loan-wallet-select" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Disbursement Account / Wallet
                      </label>
                      {activeWallets.length === 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                          Primary USD account will be used automatically upon approval.
                        </div>
                      ) : (
                        <select
                          id="loan-wallet-select"
                          name="disbursementWalletId"
                          value={form.disbursementWalletId}
                          onChange={(e) => setForm((f) => ({ ...f, disbursementWalletId: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                          {activeWallets.map((w: any) => (
                            <option key={w._id || w.id} value={w._id || w.id}>
                              {w.displayName || w.typeLabel || "Account"} ({w.walletNumber || w.accountNumber || "Primary"}) —{" "}
                              {fmt(w.rawTotalBalance ?? w.balance ?? 0, w.primaryCurrency || w.currency || "USD")}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* ── Third-Party Applicant Comprehensive Form (When isThirdParty === true) ── */}
                  {isThirdParty && (
                    <div className="space-y-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 sm:p-5 dark:border-indigo-900/60 dark:bg-indigo-950/15">
                      <div className="border-b border-indigo-200/70 pb-3 dark:border-indigo-800/60">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                            Third-Party Applicant Details &amp; Compulsory KYC Documents
                          </h4>
                          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                            Sponsored via Your Credit Score ({eligibility.creditScore || 720})
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-indigo-800/80 dark:text-indigo-300/80">
                          Complete the beneficiary&apos;s identity, country banking routing/IBAN/sort code, next of kin, and upload their Driver&apos;s License (Front &amp; Back) and Bank Statement for Admin underwriting.
                        </p>
                      </div>

                      {tpFormError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                          {tpFormError}
                        </div>
                      )}

                      {/* 1. Personal, Relationship & Contact Details */}
                      <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          1. Personal &amp; Relationship Information
                        </p>
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label htmlFor="tp-fullname" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Full Legal Name *
                            </label>
                            <input
                              id="tp-fullname"
                              name="tpFullName"
                              type="text"
                              value={thirdPartyForm.fullName}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, fullName: e.target.value }))}
                              placeholder="e.g. Sarah Jenkins"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-relationship" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Relationship with You *
                            </label>
                            <select
                              id="tp-relationship"
                              name="tpRelationship"
                              value={thirdPartyForm.relationshipToSponsor}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, relationshipToSponsor: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                              <option value="spouse">Spouse / Partner</option>
                              <option value="child">Child / Dependent</option>
                              <option value="friend">Close Friend</option>
                              <option value="sibling">Sibling (Brother / Sister)</option>
                              <option value="parent">Parent</option>
                              <option value="business_partner">Business Partner</option>
                              <option value="relative">Extended Family / Relative</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="tp-email" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Applicant Email Address * (Receives OTP &amp; PDF)
                            </label>
                            <input
                              id="tp-email"
                              name="tpEmail"
                              type="email"
                              value={thirdPartyForm.email}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, email: e.target.value }))}
                              placeholder="applicant@example.com"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-phone" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Primary Phone Number *
                            </label>
                            <input
                              id="tp-phone"
                              name="tpPhone"
                              type="tel"
                              value={thirdPartyForm.phoneNumber}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                              placeholder="+1 (555) 234-5678"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-alt-phone" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Alternate Phone Number
                            </label>
                            <input
                              id="tp-alt-phone"
                              name="tpAltPhone"
                              type="tel"
                              value={thirdPartyForm.alternatePhone}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, alternatePhone: e.target.value }))}
                              placeholder="Optional secondary number"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-dob" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Date of Birth *
                            </label>
                            <input
                              id="tp-dob"
                              name="tpDob"
                              type="date"
                              value={thirdPartyForm.dateOfBirth}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-gender" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Gender *
                            </label>
                            <select
                              id="tp-gender"
                              name="tpGender"
                              value={thirdPartyForm.gender}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, gender: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                              <option value="female">Female</option>
                              <option value="male">Male</option>
                              <option value="non_binary">Non-Binary</option>
                              <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="tp-marital" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Marital Status *
                            </label>
                            <select
                              id="tp-marital"
                              name="tpMaritalStatus"
                              value={thirdPartyForm.maritalStatus}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, maritalStatus: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                              <option value="single">Single</option>
                              <option value="married">Married</option>
                              <option value="divorced">Divorced</option>
                              <option value="widowed">Widowed</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="tp-occupation" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Occupation / Profession *
                            </label>
                            <input
                              id="tp-occupation"
                              name="tpOccupation"
                              type="text"
                              value={thirdPartyForm.occupation}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, occupation: e.target.value }))}
                              placeholder="e.g. Registered Nurse / Software Engineer"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-income" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Monthly Income (USD) *
                            </label>
                            <input
                              id="tp-income"
                              name="tpMonthlyIncome"
                              type="number"
                              min={100}
                              value={thirdPartyForm.monthlyIncome}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, monthlyIncome: Number(e.target.value) }))}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-employer" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Employer / Business Name
                            </label>
                            <input
                              id="tp-employer"
                              name="tpEmployer"
                              type="text"
                              value={thirdPartyForm.employerName}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, employerName: e.target.value }))}
                              placeholder="Company or business name"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Country, Address & National ID / SSN */}
                      <div className="border-t border-indigo-200/60 pt-4 dark:border-indigo-800/50">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          2. Location, Address &amp; Identity / Tax Verification
                        </p>
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label htmlFor="tp-country" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Country of Residence *
                            </label>
                            <select
                              id="tp-country"
                              name="tpCountry"
                              value={thirdPartyForm.country}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, country: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                              <option value="United States">United States (Requires SSN &amp; Routing #)</option>
                              <option value="United Kingdom">United Kingdom (Requires Sort Code)</option>
                              <option value="Canada">Canada</option>
                              <option value="Germany">Germany (Requires IBAN)</option>
                              <option value="France">France (Requires IBAN)</option>
                              <option value="Netherlands">Netherlands (Requires IBAN)</option>
                              <option value="Sweden">Sweden (Requires IBAN)</option>
                              <option value="Norway">Norway (Requires IBAN)</option>
                              <option value="Finland">Finland (Requires IBAN)</option>
                              <option value="Denmark">Denmark (Requires IBAN)</option>
                              <option value="Spain">Spain (Requires IBAN)</option>
                              <option value="Italy">Italy (Requires IBAN)</option>
                              <option value="Ireland">Ireland (Requires IBAN / Sort Code)</option>
                              <option value="Switzerland">Switzerland (Requires IBAN)</option>
                              <option value="Australia">Australia</option>
                              <option value="Nigeria">Nigeria</option>
                              <option value="South Africa">South Africa</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="tp-state" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              State / Province / Region *
                            </label>
                            <input
                              id="tp-state"
                              name="tpState"
                              type="text"
                              value={thirdPartyForm.state}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, state: e.target.value }))}
                              placeholder="e.g. New York / England / Ontario"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-city" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              City *
                            </label>
                            <input
                              id="tp-city"
                              name="tpCity"
                              type="text"
                              value={thirdPartyForm.city}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, city: e.target.value }))}
                              placeholder="City name"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="tp-address" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Residential Street Address *
                            </label>
                            <input
                              id="tp-address"
                              name="tpAddress"
                              type="text"
                              value={thirdPartyForm.address}
                              onChange={(e) => setThirdPartyForm((p) => ({ ...p, address: e.target.value }))}
                              placeholder="Full street address, apartment or house number"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-id-number" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              National ID or Passport Number *
                            </label>
                            <input
                              id="tp-id-number"
                              name="tpNationalId"
                              type="text"
                              value={thirdPartyForm.nationalIdOrPassportNumber}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({ ...p, nationalIdOrPassportNumber: e.target.value }))
                              }
                              placeholder="National ID or Passport #"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          {isTpUSA && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <label htmlFor="tp-ssn" className="mb-1 block text-xs font-semibold text-blue-800 dark:text-blue-300">
                                U.S. Social Security Number (SSN) * (Compulsory for USA Applicants)
                              </label>
                              <input
                                id="tp-ssn"
                                name="tpSsn"
                                type="text"
                                value={thirdPartyForm.ssn}
                                onChange={(e) => setThirdPartyForm((p) => ({ ...p, ssn: e.target.value }))}
                                placeholder="XXX-XX-XXXX"
                                className="w-full rounded-xl border border-blue-300 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-blue-700 dark:bg-gray-900 dark:text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Country-Aware Bank Details (Routing Number / Sort Code / IBAN) */}
                      <div className="border-t border-indigo-200/60 pt-4 dark:border-indigo-800/50">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          3. Third-Party Banking &amp; Country Routing Details ({thirdPartyForm.country})
                        </p>
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label htmlFor="tp-bank-name" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Bank Name *
                            </label>
                            <input
                              id="tp-bank-name"
                              name="tpBankName"
                              type="text"
                              value={thirdPartyForm.bankDetails.bankName}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  bankDetails: { ...p.bankDetails, bankName: e.target.value },
                                }))
                              }
                              placeholder="e.g. Chase / Barclays / Deutsche Bank"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-account-name" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Account Holder Name *
                            </label>
                            <input
                              id="tp-account-name"
                              name="tpAccountName"
                              type="text"
                              value={thirdPartyForm.bankDetails.accountName}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  bankDetails: { ...p.bankDetails, accountName: e.target.value },
                                }))
                              }
                              placeholder="Full name on bank account"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-account-number" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Bank Account Number *
                            </label>
                            <input
                              id="tp-account-number"
                              name="tpAccountNumber"
                              type="text"
                              value={thirdPartyForm.bankDetails.accountNumber}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  bankDetails: { ...p.bankDetails, accountNumber: e.target.value },
                                }))
                              }
                              placeholder="Account number"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-routing" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Routing Number {isTpUSA ? "* (Required for USA)" : "(USA / Canada)"}
                            </label>
                            <input
                              id="tp-routing"
                              name="tpRoutingNumber"
                              type="text"
                              value={thirdPartyForm.bankDetails.routingNumber}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  bankDetails: { ...p.bankDetails, routingNumber: e.target.value },
                                }))
                              }
                              placeholder="9-digit ABA Routing Number"
                              className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:bg-gray-900 dark:text-white ${
                                isTpUSA ? "border-blue-300 dark:border-blue-700" : "border-gray-200 dark:border-gray-700"
                              }`}
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-sortcode" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Sort Code {isTpUK ? "* (Required for UK)" : "(UK / Ireland)"}
                            </label>
                            <input
                              id="tp-sortcode"
                              name="tpSortCode"
                              type="text"
                              value={thirdPartyForm.bankDetails.sortCode}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  bankDetails: { ...p.bankDetails, sortCode: e.target.value },
                                }))
                              }
                              placeholder="e.g. 20-45-67"
                              className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:bg-gray-900 dark:text-white ${
                                isTpUK ? "border-blue-300 dark:border-blue-700" : "border-gray-200 dark:border-gray-700"
                              }`}
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-iban" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              IBAN {isTpIbanCountry ? `* (Required for ${thirdPartyForm.country})` : "(Europe / International)"}
                            </label>
                            <input
                              id="tp-iban"
                              name="tpIban"
                              type="text"
                              value={thirdPartyForm.bankDetails.iban}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  bankDetails: { ...p.bankDetails, iban: e.target.value },
                                }))
                              }
                              placeholder="e.g. DE89 3704 0044 0532 0130 00"
                              className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:bg-gray-900 dark:text-white ${
                                isTpIbanCountry ? "border-blue-300 dark:border-blue-700" : "border-gray-200 dark:border-gray-700"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. Next of Kin Details */}
                      <div className="border-t border-indigo-200/60 pt-4 dark:border-indigo-800/50">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          4. Next of Kin Details
                        </p>
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <label htmlFor="tp-nok-name" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Next of Kin Full Name *
                            </label>
                            <input
                              id="tp-nok-name"
                              name="tpNokName"
                              type="text"
                              value={thirdPartyForm.nextOfKin.fullName}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  nextOfKin: { ...p.nextOfKin, fullName: e.target.value },
                                }))
                              }
                              placeholder="Full legal name"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-nok-rel" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Relationship *
                            </label>
                            <input
                              id="tp-nok-rel"
                              name="tpNokRel"
                              type="text"
                              value={thirdPartyForm.nextOfKin.relationship}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  nextOfKin: { ...p.nextOfKin, relationship: e.target.value },
                                }))
                              }
                              placeholder="e.g. Spouse / Parent / Sibling"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-nok-phone" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Next of Kin Phone *
                            </label>
                            <input
                              id="tp-nok-phone"
                              name="tpNokPhone"
                              type="tel"
                              value={thirdPartyForm.nextOfKin.phoneNumber}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  nextOfKin: { ...p.nextOfKin, phoneNumber: e.target.value },
                                }))
                              }
                              placeholder="+1 (555) 987-6543"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label htmlFor="tp-nok-address" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Next of Kin Address
                            </label>
                            <input
                              id="tp-nok-address"
                              name="tpNokAddress"
                              type="text"
                              value={thirdPartyForm.nextOfKin.address}
                              onChange={(e) =>
                                setThirdPartyForm((p) => ({
                                  ...p,
                                  nextOfKin: { ...p.nextOfKin, address: e.target.value },
                                }))
                              }
                              placeholder="Street address & city"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 5. Compulsory Document Uploads (Driver's License Front & Back + Bank Statement) */}
                      <div className="border-t border-indigo-200/60 pt-4 dark:border-indigo-800/50">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          5. Compulsory Document Uploads (Driver&apos;s License Front &amp; Back + Bank Account Statement)
                        </p>
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                          <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                            <label htmlFor="tp-dl-front" className="mb-1 block text-xs font-semibold text-gray-800 dark:text-gray-200">
                              Driver&apos;s License (Front) *
                            </label>
                            <input
                              id="tp-dl-front"
                              name="tpDlFront"
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                handleThirdPartyFileUpload(
                                  "driversLicenseFrontUrl",
                                  "driversLicenseFrontName",
                                  e.target.files?.[0],
                                )
                              }
                              className="w-full text-[11px] text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 dark:file:bg-blue-950/60 dark:file:text-blue-300"
                            />
                            {thirdPartyForm.driversLicenseFrontName && (
                              <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={12} /> {thirdPartyForm.driversLicenseFrontName}
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                            <label htmlFor="tp-dl-back" className="mb-1 block text-xs font-semibold text-gray-800 dark:text-gray-200">
                              Driver&apos;s License (Back) *
                            </label>
                            <input
                              id="tp-dl-back"
                              name="tpDlBack"
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                handleThirdPartyFileUpload(
                                  "driversLicenseBackUrl",
                                  "driversLicenseBackName",
                                  e.target.files?.[0],
                                )
                              }
                              className="w-full text-[11px] text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 dark:file:bg-blue-950/60 dark:file:text-blue-300"
                            />
                            {thirdPartyForm.driversLicenseBackName && (
                              <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={12} /> {thirdPartyForm.driversLicenseBackName}
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                            <label htmlFor="tp-bank-stmt" className="mb-1 block text-xs font-semibold text-gray-800 dark:text-gray-200">
                              Bank Account Statement *
                            </label>
                            <input
                              id="tp-bank-stmt"
                              name="tpBankStatement"
                              type="file"
                              accept=".pdf,image/*,.doc,.docx"
                              onChange={(e) =>
                                handleThirdPartyFileUpload(
                                  "bankStatementUrl",
                                  "bankStatementName",
                                  e.target.files?.[0],
                                )
                              }
                              className="w-full text-[11px] text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 dark:file:bg-blue-950/60 dark:file:text-blue-300"
                            />
                            {thirdPartyForm.bankStatementName && (
                              <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={12} /> {thirdPartyForm.bankStatementName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <ActionButton label="Back to Eligibility" icon={<ArrowLeft size={16} />} variant="secondary" onClick={() => setStep(0)} />
                    <button
                      type="button"
                      onClick={() => {
                        const err = validateThirdPartyBeforeReview();
                        if (err) {
                          setTpFormError(err);
                          return;
                        }
                        setTpFormError(null);
                        setStep(2);
                      }}
                      disabled={form.amount < 100}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continue to Review <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </DashCard>
            </div>

            {/* Right Sidebar: Live EMI & Repayment Breakdown */}
            <div className="lg:col-span-5 xl:col-span-4">
              <DashCard>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Live Repayment Estimate
                </p>
                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                  <p className="text-xs text-blue-600 dark:text-blue-300">Estimated Monthly Requirement (EMI)</p>
                  <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-white">{fmt(emi)}</p>
                  <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">
                    For {form.termMonths} months at ~{estimatedRate}% APR
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { label: "Principal Amount", value: fmt(form.amount) },
                    { label: "Total Interest", value: fmt(totalInterest) },
                    { label: "Total Repayment", value: fmt(totalRepayment) },
                    { label: "Loan Purpose", value: form.purpose },
                    {
                      label: "Disbursement Account",
                      value:
                        activeWallets.find((w: any) => (w._id || w.id) === form.disbursementWalletId)?.walletNumber ||
                        activeWallets[0]?.walletNumber ||
                        "Primary USD Account",
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
              </DashCard>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12"
          >
            <div className="lg:col-span-7 xl:col-span-8">
              <DashCard>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Step 3: Review Your Application</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Verify your loan terms and disbursement details before final submission
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      eligibility.kycStatus === "approved"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    KYC: {eligibility.kycStatus === "approved" ? "Approved" : eligibility.kycStatus === "in_review" ? "In Review" : "Pending"}
                  </span>
                </div>

                {!eligibility.eligible && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="flex-1">
                      <p className="font-semibold">KYC Approval Required for Final Submission</p>
                      <p className="mt-0.5">
                        {eligibility.reason ||
                          "Your KYC verification must be approved by an Administrator before the backend can accept your loan submission."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="shrink-0 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                    >
                      View KYC
                    </button>
                  </div>
                )}

                {applyMutation.isError && (
                  <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                    <p className="font-semibold">Unable to Submit Loan Application</p>
                    <p className="mt-0.5">
                      {(applyMutation.error as any)?.response?.data?.message ||
                        (applyMutation.error as any)?.message ||
                        "Please ensure your KYC is approved by an Administrator and you have an active disbursement wallet."}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: "Principal Loan Amount", value: fmt(form.amount) },
                    { label: "Repayment Duration", value: `${form.termMonths} months` },
                    { label: "Loan Purpose", value: form.purpose },
                    { label: "Estimated Annual Interest Rate (APR)", value: `~${estimatedRate}% p.a.` },
                    { label: "Minimum Monthly Requirement (EMI)", value: fmt(emi) },
                    { label: "Total Estimated Interest", value: fmt(totalInterest) },
                    { label: "Total Repayment Amount", value: fmt(totalRepayment) },
                    {
                      label: "Disbursement Account / Wallet",
                      value:
                        activeWallets.find(
                          (w: any) => (w._id || w.id) === form.disbursementWalletId,
                        )?.walletNumber ||
                        activeWallets[0]?.walletNumber ||
                        form.disbursementWalletId ||
                        "Primary USD Account",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
                {isThirdParty && (
                  <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                      Sponsored Third-Party Applicant Summary
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
                      <div><span className="text-gray-500">Full Name:</span> <strong className="text-gray-900 dark:text-white">{thirdPartyForm.fullName}</strong></div>
                      <div><span className="text-gray-500">Relationship:</span> <strong className="capitalize text-gray-900 dark:text-white">{thirdPartyForm.relationshipToSponsor}</strong></div>
                      <div><span className="text-gray-500">Email:</span> <strong className="text-gray-900 dark:text-white">{thirdPartyForm.email}</strong></div>
                      <div><span className="text-gray-500">Phone:</span> <strong className="text-gray-900 dark:text-white">{thirdPartyForm.phoneNumber}</strong></div>
                      <div><span className="text-gray-500">Country / City:</span> <strong className="text-gray-900 dark:text-white">{thirdPartyForm.country}, {thirdPartyForm.city}</strong></div>
                      <div><span className="text-gray-500">ID / Passport:</span> <strong className="text-gray-900 dark:text-white">{thirdPartyForm.nationalIdOrPassportNumber}</strong></div>
                      <div><span className="text-gray-500">Bank &amp; Account:</span> <strong className="text-gray-900 dark:text-white">{thirdPartyForm.bankDetails.bankName} ({thirdPartyForm.bankDetails.accountNumber})</strong></div>
                      <div><span className="text-gray-500">Next of Kin:</span> <strong className="text-gray-900 dark:text-white">{thirdPartyForm.nextOfKin.fullName} ({thirdPartyForm.nextOfKin.relationship})</strong></div>
                      <div><span className="text-gray-500">Uploaded Docs:</span> <strong className="text-emerald-600 dark:text-emerald-400">DL Front, DL Back &amp; Bank Statement</strong></div>
                    </div>
                  </div>
                )}
              </DashCard>
            </div>

            <div className="lg:col-span-5 xl:col-span-4">
              <DashCard>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Email OTP Confirmation &amp; Terms
                </h4>
                <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <p className="font-semibold text-blue-900 dark:text-blue-200">Manual Repayment &amp; OTP Verification</p>
                    <p className="mt-1 text-blue-800 dark:text-blue-300">
                      Clicking <strong>Confirm Application with Email OTP</strong> will send a 6-digit OTP to your email{isThirdParty ? ` and ${thirdPartyForm.email || "the third-party applicant"}` : ""}. Once verified, you will receive a Loan Pending email, and upon Admin decision, an official PDF statement detailing your interest rate, loan amount, duration, and approval/rejection reason.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row lg:flex-col">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={otpSending || applyMutation.isPending}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {otpSending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    {otpSending ? "Sending Verification OTP…" : "Confirm Application with Email OTP"}
                  </button>
                  <ActionButton label="Back to Loan Details" icon={<ArrowLeft size={16} />} variant="secondary" onClick={() => setStep(1)} />
                </div>
              </DashCard>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Confirmation ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-5xl"
          >
            <DashCard>
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="mb-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Step 4 of 4 · Confirmation
                </span>
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  Loan Application Submitted Successfully!
                </h3>
                <p className="mx-auto mb-6 max-w-lg text-sm text-gray-500 dark:text-gray-400">
                  Your loan application has been received and queued for Administrator credit review and disbursement.
                </p>

                <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-700 dark:bg-gray-800/50">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Application Summary Receipt
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        label: "Application Reference",
                        value: submittedApp?.applicationId || submittedApp?.id || submittedApp?._id || "Pending Assignment",
                      },
                      { label: "Amount Requested", value: fmt(submittedApp?.requestedAmount || form.amount) },
                      { label: "Repayment Term", value: `${submittedApp?.term || form.termMonths} months` },
                      { label: "Loan Purpose", value: submittedApp?.purpose || form.purpose },
                      { label: "Estimated Interest Rate", value: `~${submittedApp?.interestRate || estimatedRate}% p.a.` },
                      {
                        label: "Minimum Monthly Payment",
                        value: submittedApp?.monthlyPayment ? fmt(submittedApp.monthlyPayment) : fmt(emi),
                      },
                      { label: "Current Status", value: submittedApp?.status || "submitted" },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg border border-gray-200/70 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/60">
                        <span className="block text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
                        <span className="mt-0.5 block text-sm font-semibold text-gray-900 dark:text-white capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <ActionButton
                    label="View My Applications"
                    variant="secondary"
                    onClick={() => navigate("/customer/loans/overview")}
                  />
                  <ActionButton
                    label="Back to Loans Dashboard"
                    onClick={() => navigate("/customer/loans")}
                  />
                </div>
              </div>
            </DashCard>
          </motion.div>
        )}
      </div>

      {/* ── Email OTP Confirmation Modal for Loan Submission ── */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowOtpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Confirm Loan Application with OTP
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Enter the 6-digit verification code sent to your email to confirm and submit this loan application.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                </button>
              </div>

              {otpSentNotice && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                  {otpSentNotice}
                </div>
              )}

              {otpError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                  {otpError}
                </div>
              )}

              <form onSubmit={handleConfirmOtpAndSubmit} className="space-y-4">
                <div>
                  <label htmlFor="loan-otp-input" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    6-Digit Email OTP Code
                  </label>
                  <input
                    id="loan-otp-input"
                    name="otpCode"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.35em] text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={otpSending}
                    className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {otpSending ? "Resending OTP…" : "Resend OTP Code"}
                  </button>
                  <span className="text-gray-400">Expires in 10 minutes</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <ActionButton label="Cancel" variant="secondary" onClick={() => setShowOtpModal(false)} />
                  <button
                    type="submit"
                    disabled={applyMutation.isPending || otpCode.length < 6}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {applyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {applyMutation.isPending ? "Verifying & Submitting…" : "Verify OTP & Submit Application"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KYC Completion & Submission Modal (Submitted to Admin for Approval) ── */}
      <AnimatePresence>
        {showKycModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowKycModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Complete & Submit KYC Verification
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Provide any remaining KYC details below. Once submitted, your profile moves to{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">In Review</span> for Administrator approval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              {kycErrorMsg && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                  {kycErrorMsg}
                </div>
              )}

              {kycSuccessMsg && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {kycSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSubmitKyc} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="kyc-dob" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </label>
                    <input
                      id="kyc-dob"
                      name="dateOfBirth"
                      type="date"
                      value={kycForm.dateOfBirth}
                      onChange={(e) => setKycForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="kyc-country" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Country of Residence
                    </label>
                    <input
                      id="kyc-country"
                      name="country"
                      type="text"
                      value={kycForm.country}
                      onChange={(e) => setKycForm((f) => ({ ...f, country: e.target.value }))}
                      placeholder="e.g. United States"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="kyc-address" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Residential Street Address
                    </label>
                    <input
                      id="kyc-address"
                      name="homeAddress"
                      type="text"
                      value={kycForm.homeAddress}
                      onChange={(e) => setKycForm((f) => ({ ...f, homeAddress: e.target.value }))}
                      placeholder="123 Financial Way, Suite 4B"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="kyc-city" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      City
                    </label>
                    <input
                      id="kyc-city"
                      name="city"
                      type="text"
                      value={kycForm.city}
                      onChange={(e) => setKycForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="New York"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="kyc-id-type" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Government ID Type
                    </label>
                    <select
                      id="kyc-id-type"
                      name="idType"
                      value={kycForm.idType}
                      onChange={(e) => setKycForm((f) => ({ ...f, idType: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="passport">International Passport</option>
                      <option value="national_id">National Identity Card</option>
                      <option value="drivers_license">Driver&apos;s License</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="kyc-id-number" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Government ID Number
                    </label>
                    <input
                      id="kyc-id-number"
                      name="idNumber"
                      type="text"
                      value={kycForm.idNumber}
                      onChange={(e) => setKycForm((f) => ({ ...f, idNumber: e.target.value }))}
                      placeholder="e.g. A84920319"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="kyc-poa-type" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Proof of Address Document
                    </label>
                    <select
                      id="kyc-poa-type"
                      name="addressDocType"
                      value={kycForm.addressDocType}
                      onChange={(e) => setKycForm((f) => ({ ...f, addressDocType: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="utility_bill">Utility Bill (Last 3 Months)</option>
                      <option value="bank_statement">Bank Statement</option>
                      <option value="tax_assessment">Government Tax Assessment</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="kyc-signature" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Digital Signature (Type Full Legal Name)
                    </label>
                    <input
                      id="kyc-signature"
                      name="signature"
                      type="text"
                      value={kycForm.signature}
                      onChange={(e) => setKycForm((f) => ({ ...f, signature: e.target.value }))}
                      placeholder="Type full legal name as signature"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold italic text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
                  <input
                    id="kyc-selfie-confirm"
                    name="selfieConfirmed"
                    type="checkbox"
                    checked={kycForm.selfieConfirmed}
                    onChange={(e) => setKycForm((f) => ({ ...f, selfieConfirmed: e.target.checked }))}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    I confirm my biometric selfie identity verification and authorize Nordi Remittance Administrators to review my KYC records for credit &amp; loan eligibility.
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKycModal(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={kycSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {kycSubmitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    Submit KYC for Admin Approval
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

export default ApplyForLoan;
