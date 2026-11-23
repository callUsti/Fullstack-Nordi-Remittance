// ============================================================================
// INTERNATIONAL TRANSFER — 4-step wizard
// Steps: 1) Source Account  2) Recipient  3) Amount & Delivery  4) Review
// ============================================================================
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ChevronDown, Check, KeyRound, Mail, Loader2, X } from "lucide-react";
import Countries from "@core/data/Countries";
import { CURRENCY_OPTIONS, getCurrencyForCountry } from "@core/data/Currencies";
import apiClient from "@core/api/client";
import { parseApiError, checkInsufficientFunds, type ParsedApiError } from "@core/errors/apiErrors";
import { TransactionErrorAlert, InsufficientFundsWarning } from "@components/shared/TransactionErrorAlert";
import { useClientTransferLimits } from "@hooks/useTransferLimits";
import { TransferLimitsCard, LimitExceededWarning, RequestLimitModal } from "@components/shared/TransferLimitsBanner";
import {
  Globe,
  Building2,
  User,
  DollarSign,
  RefreshCw,
  Send,
  Shield,
  Search,
  Clock,
  Info,
  AlertTriangle,
} from "@constants/icons";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";
import {
  useSendRemittance,
  useRemittanceQuote,
  useClientRemittanceCountries,
  useClientRecipients,
  useCreateRecipient,
} from "../../client-usecase/usetransaction-client-usecase";
import {
  TransferLayout,
  StepIndicator,
  StepContent,
  WizardNav,
  TCard,
  TInput,
  TSelect,
  TCheckbox,
  AccountSelector,
  ReviewRow,
  ReviewSection,
  FeeSummary,
  TransferResult,
  formatCurrency,
} from "@components/shared/TransferPrimitives";
import type { WizardStep, AccountOption } from "@components/shared/TransferPrimitives";

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS: WizardStep[] = [{ label: "Account" }, { label: "Recipient" }, { label: "Amount" }, { label: "Review" }];

const CURRENCIES = CURRENCY_OPTIONS;

const PURPOSES = [
  { value: "family", label: "Family Support" },
  { value: "business", label: "Business Payment" },
  { value: "education", label: "Education" },
  { value: "investment", label: "Investment" },
  { value: "property", label: "Property" },
  { value: "medical", label: "Medical" },
  { value: "gift", label: "Gift" },
  { value: "other", label: "Other" },
];

const DELIVERY_OPTS = [
  { value: "bank_transfer", label: "Bank Transfer", eta: "2-5 business days" },
  { value: "mobile_money", label: "Mobile Money", eta: "1-2 business days" },
  { value: "cash_pickup", label: "Cash Pickup", eta: "Same day" },
];

const VERIFICATION_STEPS = [
  { step: 1, key: "isin", title: "ISIN Verification Code", subtitle: "International Securities Identification Number (Step 1 of 3)" },
  { step: 2, key: "imf_bop", title: "IMF BOP Code", subtitle: "Balance of Payments Clearance Code (Step 2 of 3)" },
  { step: 3, key: "lei", title: "LEI Verification Code", subtitle: "Legal Entity Identifier Release Code (Step 3 of 3)" },
];

// ─── Validation ──────────────────────────────────────────────────────────────
const schema = Yup.object({
  fromAccount: Yup.string().required("Select a source account"),
  recipientType: Yup.string().oneOf(["existing", "new"]).required(),
  recipientId: Yup.string().when("recipientType", {
    is: "existing",
    then: (s) => s.required("Select a recipient"),
    otherwise: (s) => s.notRequired(),
  }),
  recipientName: Yup.string().when("recipientType", {
    is: "new",
    then: (s) => s.required("Recipient name is required").min(2),
    otherwise: (s) => s.notRequired(),
  }),
  recipientAccount: Yup.string().when("recipientType", {
    is: "new",
    then: (s) => s.required("Account / IBAN is required"),
    otherwise: (s) => s.notRequired(),
  }),
  bankName: Yup.string().when("recipientType", {
    is: "new",
    then: (s) => s.required("Bank name is required"),
    otherwise: (s) => s.notRequired(),
  }),
  swiftCode: Yup.string().when("recipientType", {
    is: "new",
    then: (s) =>
      s.required("SWIFT/BIC is required").matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i, "Invalid SWIFT code"),
    otherwise: (s) => s.notRequired(),
  }),
  country: Yup.string().when("recipientType", {
    is: "new",
    then: (s) => s.required("Country is required"),
    otherwise: (s) => s.notRequired(),
  }),
  amount: Yup.number().required("Enter an amount").positive("Must be positive"),
  fee: Yup.number().typeError("Enter a valid charge").min(0, "Charge cannot be negative").required("Enter transfer fee / charge"),
  currency: Yup.string().required("Select a currency"),
  purpose: Yup.string().required("Select a purpose"),
  deliveryMethod: Yup.string().required("Select delivery method"),
  reference: Yup.string().max(140),
  saveRecipient: Yup.boolean(),
  agreeTos: Yup.boolean().oneOf([true], "You must agree to the terms"),
  agreeCompliance: Yup.boolean().oneOf([true], "Required"),
});

// ─── Component ───────────────────────────────────────────────────────────────
const InternationalTransfer: React.FC = () => {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    reference?: string;
  } | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [submitError, setSubmitError] = useState<ParsedApiError | string | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [verificationState, setVerificationState] = useState<{
    verificationId: string;
    currentStep: number;
    reference: string;
    codeInput: string;
    codeSent: boolean;
    requesting: boolean;
    verifying: boolean;
    error: string | null;
  } | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Hooks
  const { wallets: walletsArr, isLoading: walletsLoading } = useClientWallets();
  const { countries: countriesArr } = useClientRemittanceCountries();
  const { recipients: recipientsArr, isLoading: recipientsLoading } = useClientRecipients();
  const remittance = useSendRemittance();
  const quote = useRemittanceQuote();
  const createRecipient = useCreateRecipient();
  const { international: internationalLimits, limitRequests } = useClientTransferLimits();

  const intlPerTxLimit = internationalLimits?.perTransaction ?? 5000000;
  const dynamicSchema = useMemo(
    () =>
      schema.shape({
        amount: Yup.number()
          .required("Enter an amount")
          .positive("Must be positive")
          .max(
            intlPerTxLimit,
            `Per-transaction international limit is $${intlPerTxLimit.toLocaleString()}. Apply to increase your limit.`,
          ),
      }),
    [intlPerTxLimit],
  );

  const wallets: AccountOption[] = walletsArr as any;
  const countries = countriesArr;
  const recipients = recipientsArr;

  const filteredRecipients = useMemo(
    () =>
      recipientSearch
        ? recipients.filter(
          (r: any) =>
            (r.firstName || r.name || "").toLowerCase().includes(recipientSearch.toLowerCase()) ||
            (r.country || "").toLowerCase().includes(recipientSearch.toLowerCase()),
        )
        : recipients,
    [recipients, recipientSearch],
  );

  const countryOptions = useMemo(() => {
    const base = Countries.map((c) => ({
      value: c.code,
      label: c.name,
      flag: c.flag,
    }));
    const existingCodes = new Set(base.map((c) => c.value));
    const extras = (countries || [])
      .filter((c: any) => (c.code || c.id) && !existingCodes.has(c.code || c.id))
      .map((c: any) => ({
        value: c.code || c.id || c.name,
        label: c.name || c.code,
        flag: c.flag || "🌐",
      }));
    return [...base, ...extras];
  }, [countries]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countryOptions;
    return countryOptions.filter(
      (c) => c.label.toLowerCase().includes(q) || c.value.toLowerCase().includes(q),
    );
  }, [countryOptions, countrySearch]);

  // Form
  const formik = useFormik({
    initialValues: {
      fromAccount: "",
      recipientType: "new" as "existing" | "new",
      recipientId: "",
      recipientName: "",
      recipientAccount: "",
      bankName: "",
      swiftCode: "",
      country: "",
      amount: "",
      fee: "0",
      currency: "EUR",
      purpose: "",
      deliveryMethod: "bank_transfer",
      reference: "",
      saveRecipient: false,
      agreeTos: false,
      agreeCompliance: false,
    },
    validationSchema: dynamicSchema,
    onSubmit: async (values) => {
      setSubmitError(null);
      const selectedAccount = wallets.find((w) => w.id === values.fromAccount);
      const isNew = values.recipientType === "new";
      const sourceCurr = (selectedAccount?.primaryCurrency || selectedAccount?.currency || "USD") as any;
      const payload: Record<string, unknown> = {
        sourceAccountId: values.fromAccount as any,
        fromWalletId: values.fromAccount,
        type: "transfer",
        isInternational: true,
        recipientId: isNew ? undefined : (values.recipientId as any),
        saveRecipient: isNew ? values.saveRecipient : false,
        recipientName: isNew ? values.recipientName : undefined,
        recipientCountry: isNew ? values.country : undefined,
        destinationCountry: isNew ? values.country : undefined,
        recipientDetails: isNew
          ? {
              recipientName: values.recipientName,
              recipientAccount: values.recipientAccount,
              bankName: values.bankName,
              swiftCode: values.swiftCode,
              country: values.country,
            }
          : undefined,
        amount: Number(values.amount),
        fee: Math.max(0, Number(values.fee) || 0),
        currency: sourceCurr,
        sourceCurrency: sourceCurr,
        destinationCurrency: values.currency as any,
        deliveryMethod: values.deliveryMethod as any,
        purpose: values.purpose,
        reference: values.reference || undefined,
        agreeTos: Boolean(values.agreeTos),
        agreeCompliance: Boolean(values.agreeCompliance),
      };

      remittance.mutate(payload as any, {
        onSuccess: (data: any) => {
          const ref = data?.referenceNumber || data?.transaction?.referenceNumber || data?.id || `INTL${Date.now().toString().slice(-7)}`;
          if (data?.requiresVerification && data?.verification?.verificationId) {
            setVerificationState({
              verificationId: data.verification.verificationId,
              currentStep: data.verification.currentStep || 1,
              reference: ref,
              codeInput: "",
              codeSent: false,
              requesting: false,
              verifying: false,
              error: null,
            });
            return;
          }
          setResult({
            success: true,
            reference: ref,
          });
        },
        onError: (err: any) => {
          setSubmitError(parseApiError(err));
        },
      });
    },
  });

  const { values, errors, touched, setFieldValue, handleChange, handleBlur, setTouched } = formik;

  const handleRequestCode = async () => {
    if (!verificationState) return;
    setVerificationState((prev) => (prev ? { ...prev, requesting: true, error: null } : null));
    try {
      await apiClient.post("/transactions/secure-transfer/request-code", {
        verificationId: verificationState.verificationId,
      });
      setVerificationState((prev) => (prev ? { ...prev, requesting: false, codeSent: true } : null));
    } catch (err: any) {
      setVerificationState((prev) =>
        prev
          ? {
              ...prev,
              requesting: false,
              error: err?.response?.data?.message || err?.message || "Failed to send verification code",
            }
          : null,
      );
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationState || !verificationState.codeInput.trim()) {
      setVerificationState((prev) => (prev ? { ...prev, error: "Please enter the verification code" } : null));
      return;
    }
    setVerificationState((prev) => (prev ? { ...prev, verifying: true, error: null } : null));
    try {
      const res = await apiClient.post("/transactions/secure-transfer/verify-code", {
        verificationId: verificationState.verificationId,
        code: verificationState.codeInput.trim(),
      });
      const data = (res.data as any)?.data || res.data;
      const nextStep = data?.verification?.currentStep;
      const status = data?.verification?.status;

      if (status === "completed" || verificationState.currentStep >= 3) {
        const ref = verificationState.reference;
        setVerificationState(null);
        setResult({ success: true, reference: ref });
      } else {
        setVerificationState((prev) =>
          prev
            ? {
                ...prev,
                currentStep: nextStep || prev.currentStep + 1,
                codeInput: "",
                codeSent: false,
                verifying: false,
                error: null,
              }
            : null,
        );
      }
    } catch (err: any) {
      setVerificationState((prev) =>
        prev
          ? {
              ...prev,
              verifying: false,
              error: err?.response?.data?.message || err?.message || "Invalid verification code",
            }
          : null,
      );
    }
  };

  // Per-step validation
  const goNext = async () => {
    setSubmitError(null);
    const fieldsByStep: Record<number, string[]> = {
      0: ["fromAccount"],
      1:
        values.recipientType === "existing"
          ? ["recipientId"]
          : ["recipientName", "recipientAccount", "bankName", "swiftCode", "country"],
      2: ["amount", "fee", "currency", "purpose", "deliveryMethod"],
      3: ["agreeTos", "agreeCompliance"],
    };
    const fields = fieldsByStep[step] || [];
    const touchMap: Record<string, boolean> = {};
    fields.forEach((f) => (touchMap[f] = true));
    await setTouched(touchMap, true);
    const errs = await formik.validateForm();
    if (fields.some((f) => (errs as any)[f])) {
      if (step === 3) {
        setSubmitError("Please agree to both international transfer confirmations above.");
      }
      return;
    }

    if (step === 2) {
      // Get quote
      const selectedAccount = wallets.find((w) => w.id === values.fromAccount);
      quote.mutate({
        amount: Number(values.amount),
        sourceCurrency: (selectedAccount?.primaryCurrency || selectedAccount?.currency || "USD") as any,
        destinationCurrency: values.currency as any,
        destinationCountry: values.country,
        deliveryMethod: values.deliveryMethod as any,
      });
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      await formik.submitForm();
    }
  };

  // Derived
  const selectedAccount = wallets.find((w) => w.id === values.fromAccount);
  const selectedRecipient = recipients.find((r: any) => r.id === values.recipientId);
  const deliveryInfo = DELIVERY_OPTS.find((d) => d.value === values.deliveryMethod);
  const fee = Math.max(0, Number(values.fee) || 0);
  const total = (Number(values.amount) || 0) + fee;
  const quoteData = quote.data as any;
  const exchangeRate = quoteData?.exchangeRate || quoteData?.rate || null;

  // ─── Result Screen ──────────────────────────────────────────────────
  if (result) {
    return (
      <TransferLayout>
        <TCard>
          <TransferResult
            success={result.success}
            title={result.success ? "Remittance Submitted!" : "Transfer Failed"}
            subtitle={
              result.success
                ? "Your international transfer is being processed."
                : "Something went wrong. Please try again."
            }
            reference={result.reference}
            details={
              result.success
                ? [
                  {
                    label: "Amount",
                    value: formatCurrency(values.amount),
                  },
                  { label: "Currency", value: values.currency },
                  {
                    label: "Fee",
                    value: formatCurrency(fee),
                  },
                  {
                    label: "Delivery",
                    value: deliveryInfo?.label || "Bank Transfer",
                  },
                  { label: "ETA", value: deliveryInfo?.eta || "—" },
                  {
                    label: "Recipient",
                    value: selectedRecipient?.firstName || selectedRecipient?.name || values.recipientName || "—",
                  },
                ]
                : undefined
            }
            onNewTransfer={() => {
              formik.resetForm();
              setStep(0);
              setResult(null);
            }}
          />
        </TCard>
      </TransferLayout>
    );
  }

  // ─── Wizard ─────────────────────────────────────────────────────────
  return (
    <TransferLayout>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">International Transfer</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Send money abroad securely and at competitive rates.
        </p>
      </div>

      <TCard>
        <StepIndicator steps={STEPS} current={step} />
      </TCard>

      <StepContent step={step}>
        {/* ── Step 0: Source Account ── */}
        {step === 0 && (
          <TCard title="Source Account" icon={<Building2 size={18} />}>
            <AccountSelector
              accounts={wallets}
              selected={values.fromAccount}
              onSelect={(id) => setFieldValue("fromAccount", id)}
              loading={walletsLoading}
            />
            {errors.fromAccount && touched.fromAccount && (
              <p className="mt-2 text-xs text-red-500">{errors.fromAccount}</p>
            )}
          </TCard>
        )}

        {/* ── Step 1: Recipient ── */}
        {step === 1 && (
          <div className="space-y-6">
            <TCard title="Recipient" icon={<User size={18} />}>
              {/* Toggle */}
              <div className="mb-4 flex gap-2">
                {(["existing", "new"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFieldValue("recipientType", t);
                      setFieldValue("recipientId", "");
                    }}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${values.recipientType === t
                        ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                      }`}
                  >
                    {t === "existing" ? "Saved Recipient" : "New Recipient"}
                  </button>
                ))}
              </div>

              {values.recipientType === "existing" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Search recipients…"
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                    />
                  </div>

                  {recipientsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                      ))}
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No recipients found</p>
                  ) : (
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {filteredRecipients.map((r: any) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setFieldValue("recipientId", r.id);
                            setFieldValue("country", r.country || "");
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${values.recipientId === r.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                              : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                            }`}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {(r.firstName || r.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {`${r.firstName || ""} ${r.lastName || ""}`.trim() || r.name || "—"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {r.country || "—"} · {r.currency || "—"}
                            </p>
                          </div>
                          {r.isFavorite && <span className="text-xs text-amber-400">★</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.recipientId && touched.recipientId && (
                    <p className="text-xs text-red-500">{errors.recipientId}</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TInput
                    label="Recipient Full Name"
                    name="recipientName"
                    value={values.recipientName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Full legal name"
                    error={errors.recipientName}
                    touched={touched.recipientName}
                    icon={<User size={16} />}
                  />
                  <TInput
                    label="Account / IBAN"
                    name="recipientAccount"
                    value={values.recipientAccount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Account number or IBAN"
                    error={errors.recipientAccount}
                    touched={touched.recipientAccount}
                  />
                  <TInput
                    label="Bank Name"
                    name="bankName"
                    value={values.bankName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Recipient's bank"
                    error={errors.bankName}
                    touched={touched.bankName}
                    icon={<Building2 size={16} />}
                  />
                  <TInput
                    label="SWIFT / BIC Code"
                    name="swiftCode"
                    value={values.swiftCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. DEUTDEFF"
                    error={errors.swiftCode}
                    touched={touched.swiftCode}
                    hint="8 or 11 characters"
                  />
                  <div ref={countryDropdownRef} className="relative sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Country
                    </label>
                    <button
                      type="button"
                      onClick={() => setCountryDropdownOpen((prev) => !prev)}
                      onBlur={() => setFieldValue("country", values.country, true)}
                      className={`flex w-full items-center justify-between rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-gray-800 ${errors.country && touched.country
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-200 dark:border-gray-700"
                        }`}
                    >
                      {(() => {
                        const chosen = countryOptions.find((c) => c.value === values.country);
                        return chosen ? (
                          <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <span className="text-base">{chosen.flag}</span>
                            <span>{chosen.label}</span>
                            <span className="text-xs text-gray-400">({chosen.value})</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Select country</span>
                        );
                      })()}
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {countryDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="relative mb-2">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            autoFocus
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search country or code..."
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
                          />
                        </div>
                        <div
                          className="max-h-60 overflow-y-auto overscroll-contain pr-1 touch-pan-y"
                          style={{ WebkitOverflowScrolling: "touch" }}
                        >
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => {
                              const isSelected = values.country === c.value;
                              return (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => {
                                    setFieldValue("country", c.value);
                                    const matchedCurr = getCurrencyForCountry(c.value);
                                    if (matchedCurr) {
                                      setFieldValue("currency", matchedCurr.code);
                                    }
                                    setCountryDropdownOpen(false);
                                    setCountrySearch("");
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors sm:text-sm ${isSelected
                                      ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                    }`}
                                >
                                  <span className="flex items-center gap-2.5 truncate">
                                    <span className="text-base">{c.flag}</span>
                                    <span className="truncate">{c.label}</span>
                                    <span className="text-[11px] text-gray-400">{c.value}</span>
                                  </span>
                                  {isSelected && <Check size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />}
                                </button>
                              );
                            })
                          ) : (
                            <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                              No countries match &ldquo;{countrySearch}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {errors.country && touched.country && (
                      <p className="mt-1 text-xs text-red-500">{errors.country}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <TCheckbox
                      name="saveRecipient"
                      label="Save this recipient for future international transfers"
                      checked={values.saveRecipient}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
            </TCard>
          </div>
        )}

        {/* ── Step 2: Amount & Delivery ── */}
        {step === 2 && (
          <div className="space-y-6">
            <TCard title="Transfer Amount" icon={<DollarSign size={18} />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TInput
                  label="Amount"
                  name="amount"
                  type="number"
                  value={values.amount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0.00"
                  error={errors.amount}
                  touched={touched.amount}
                  icon={<DollarSign size={16} />}
                />
                <TInput
                  label="Transfer Charges / Fee"
                  name="fee"
                  type="number"
                  value={values.fee}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0.00"
                  error={errors.fee}
                  touched={touched.fee}
                  icon={<DollarSign size={16} />}
                />
                <TSelect
                  label="Destination Currency"
                  name="currency"
                  value={values.currency}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  options={CURRENCIES}
                  error={errors.currency}
                  touched={touched.currency}
                />
              </div>

              {(() => {
                const avail = selectedAccount?.primaryCurrencyBalance ?? selectedAccount?.balance ?? 0;
                const curr = selectedAccount?.primaryCurrency || selectedAccount?.currency || "USD";
                const check = checkInsufficientFunds(values.amount, values.fee, avail, curr);
                return check.insufficient ? (
                  <InsufficientFundsWarning
                    totalRequired={check.totalRequired}
                    available={check.available}
                    shortfall={check.shortfall}
                    currency={check.currency}
                  />
                ) : null;
              })()}

              <LimitExceededWarning
                amount={Number(values.amount)}
                limits={internationalLimits}
                scope="international"
                onApplyLimit={() => setLimitModalOpen(true)}
              />

              <TransferLimitsCard
                scope="international"
                limits={internationalLimits}
                pendingRequests={limitRequests}
                onOpenRequestModal={() => setLimitModalOpen(true)}
              />

              {/* Exchange rate info */}
              {exchangeRate && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/40 dark:bg-blue-950/20">
                  <RefreshCw size={16} className="flex-shrink-0 text-blue-500" />
                  <div className="text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Exchange Rate: </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      1 {selectedAccount?.currency || "USD"} = {Number(exchangeRate).toFixed(4)} {values.currency}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <TSelect
                  label="Purpose of Transfer"
                  name="purpose"
                  value={values.purpose}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  options={PURPOSES}
                  placeholder="Select purpose"
                  error={errors.purpose}
                  touched={touched.purpose}
                />
              </div>
            </TCard>

            <TCard title="Delivery Method" icon={<Clock size={18} />}>
              <div className="grid gap-3 sm:grid-cols-3">
                {DELIVERY_OPTS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setFieldValue("deliveryMethod", d.value)}
                    className={`rounded-lg border p-3 text-left transition-all ${values.deliveryMethod === d.value
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/50 dark:bg-blue-950/30"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                  >
                    <span className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{d.label}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{d.eta}</p>
                  </button>
                ))}
              </div>
            </TCard>

            <TInput
              label="Reference (optional)"
              name="reference"
              value={values.reference}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Payment reference"
              error={errors.reference}
              touched={touched.reference}
              hint="Max 140 characters"
            />

            {values.amount && (
              <FeeSummary
                rows={[
                  {
                    label: "Transfer amount",
                    value: formatCurrency(values.amount),
                  },
                  {
                    label: "Delivery fee",
                    value: formatCurrency(fee),
                  },
                  ...(exchangeRate
                    ? [
                      {
                        label: `≈ Recipient gets`,
                        value: `${(Number(values.amount) * Number(exchangeRate)).toFixed(2)} ${values.currency}`,
                      },
                    ]
                    : []),
                  {
                    label: "Total deducted",
                    value: formatCurrency(total),
                    highlight: true,
                  },
                ]}
              />
            )}
          </div>
        )}

        {/* ── Step 3: Review & Confirm ── */}
        {step === 3 && (
          <div className="space-y-6">
            <ReviewSection title="Transfer Details" icon={<Send size={16} />}>
              <ReviewRow label="Amount" value={formatCurrency(values.amount)} highlight />
              <ReviewRow label="Currency" value={values.currency} />
              {exchangeRate && (
                <ReviewRow
                  label="Recipient gets"
                  value={`≈ ${(Number(values.amount) * Number(exchangeRate)).toFixed(2)} ${values.currency}`}
                />
              )}
              <ReviewRow label="Delivery" value={deliveryInfo?.label || "—"} />
              <ReviewRow label="Fee" value={formatCurrency(fee)} />
              <ReviewRow label="Total" value={formatCurrency(total)} highlight />
              <ReviewRow label="Purpose" value={PURPOSES.find((p) => p.value === values.purpose)?.label || "—"} />
              {values.reference && <ReviewRow label="Reference" value={values.reference} />}
            </ReviewSection>

            <ReviewSection title="From Account" icon={<Building2 size={16} />}>
              <ReviewRow
                label="Account"
                value={selectedAccount?.displayName || selectedAccount?.name || selectedAccount?.typeLabel || "—"}
              />
              <ReviewRow
                label="Balance"
                value={
                  typeof (selectedAccount?.primaryCurrencyBalance ?? selectedAccount?.balance) === "number"
                    ? formatCurrency(
                      (selectedAccount?.primaryCurrencyBalance ?? selectedAccount?.balance) as number,
                      selectedAccount?.primaryCurrency || selectedAccount?.currency,
                    )
                    : "—"
                }
              />
            </ReviewSection>

            <ReviewSection title="Recipient" icon={<Globe size={16} />}>
              {values.recipientType === "existing" ? (
                <>
                  <ReviewRow
                    label="Name"
                    value={
                      `${selectedRecipient?.firstName || ""} ${selectedRecipient?.lastName || ""}`.trim() ||
                      selectedRecipient?.name ||
                      "—"
                    }
                  />
                  <ReviewRow label="Country" value={selectedRecipient?.country || "—"} />
                </>
              ) : (
                <>
                  <ReviewRow label="Name" value={values.recipientName} />
                  <ReviewRow label="Account" value={values.recipientAccount} />
                  <ReviewRow label="Bank" value={values.bankName} />
                  <ReviewRow label="SWIFT" value={values.swiftCode} />
                  <ReviewRow label="Country" value={values.country} />
                </>
              )}
            </ReviewSection>

            {/* Warnings */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
              <div className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                <p>
                  International transfers may take up to 5 business days. Exchange rates are indicative and may vary at
                  time of processing.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <TCheckbox
                name="agreeTos"
                label="I agree to the international transfer terms and conditions."
                checked={values.agreeTos}
                onChange={handleChange}
                error={errors.agreeTos}
                touched={touched.agreeTos}
              />
              <TCheckbox
                name="agreeCompliance"
                label="I confirm this transfer complies with all applicable sanctions and regulations."
                checked={values.agreeCompliance}
                onChange={handleChange}
                error={errors.agreeCompliance}
                touched={touched.agreeCompliance}
              />
            </div>

            <TransactionErrorAlert
              error={submitError}
              onDismiss={() => setSubmitError(null)}
              onAction={(actionType) => {
                if (actionType === "edit_amount") setStep(2);
                else if (actionType === "retry") formik.handleSubmit();
              }}
            />
          </div>
        )}
      </StepContent>

      <WizardNav
        showBack={step > 0}
        onBack={step > 0 ? () => setStep(step - 1) : undefined}
        onNext={goNext}
        nextLabel={step === 3 ? "Confirm & Send" : "Continue"}
        loading={remittance.isPending || createRecipient.isPending}
      />

      {/* 3-Step Verification Code Modal / Mobile Bottom Sheet */}
      {verificationState && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:rounded-2xl sm:p-6">
            {(() => {
              const stepMeta =
                VERIFICATION_STEPS.find((s) => s.step === verificationState.currentStep) || VERIFICATION_STEPS[0];
              return (
                <>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        <KeyRound size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                          {stepMeta.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">{stepMeta.subtitle}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVerificationState(null)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Step progress pills */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {VERIFICATION_STEPS.map((s) => (
                      <div
                        key={s.step}
                        className={`rounded-lg px-2 py-1.5 text-center text-[11px] font-medium ${
                          s.step < verificationState.currentStep
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : s.step === verificationState.currentStep
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {s.key.toUpperCase()}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleRequestCode}
                      disabled={verificationState.requesting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      {verificationState.requesting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Mail size={14} />
                      )}
                      {verificationState.codeSent
                        ? "Resend Code to Email"
                        : `Send ${stepMeta.key.toUpperCase()} Code to Email`}
                    </button>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Enter {stepMeta.title}
                      </label>
                      <input
                        type="text"
                        value={verificationState.codeInput}
                        onChange={(e) =>
                          setVerificationState((prev) =>
                            prev ? { ...prev, codeInput: e.target.value, error: null } : null,
                          )
                        }
                        placeholder={`Enter ${stepMeta.key.toUpperCase()} code`}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {verificationState.error && (
                      <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                        {verificationState.error}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verificationState.verifying}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:text-sm"
                    >
                      {verificationState.verifying && <Loader2 size={15} className="animate-spin" />}
                      {verificationState.currentStep < 3 ? "Verify & Next Code" : "Verify & Complete Transfer"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pb-4 text-xs text-gray-400 dark:text-gray-500">
        <Shield size={12} />
        <span>Protected by bank-grade encryption. Regulated international transfer.</span>
      </div>
      <RequestLimitModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        defaultScope="international"
        currentLimits={internationalLimits}
      />
    </TransferLayout>
  );
};

export default InternationalTransfer;
