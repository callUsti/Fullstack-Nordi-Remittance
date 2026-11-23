// ============================================================================
// useAccountsDomain — Domain use-case hook for Accounts, Wallets & Applications
//
// Wraps raw query hooks with response normalization, typed returns,
// and @core/algo utilities. Merges Wallets and AccountApplications so
// Savings, Current, Fixed Deposit, Personal, and Business accounts are
// always unified and identifiable across Dashboard and Accounts sub-pages.
// ============================================================================

import { useMemo } from "react";
import {
  useWallets,
  useWallet,
  useAccountSummary,
  useAccountLimits,
  useBalanceHistory,
  useBeneficiaries,
  useAddBeneficiary,
  useRemoveBeneficiary,
  useCreateWallet,
  useUpdateWallet,
  useCloseWallet,
  useAccountApplications,
  useApplyForAccount,
  useCancelApplication,
  useClosedWallets,
  useConsolidatedLimits,
  useCreditScore,
  useWalletProducts,
  useLinkCardToWallet,
  useUnlinkCardFromWallet,
  useSetCardFundingSource,
} from "../hooks/api-queries/useAccounts";
import { formatCurrency, maskSensitive } from "../core/algo";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Response Unwrappers ─────────────────────────────────────────────────────
const extractArray = (d: unknown, ...keys: string[]): any[] => {
  if (Array.isArray(d)) return d;
  if (!d || typeof d !== "object") return [];
  const obj = d as Record<string, any>;
  for (const k of keys) {
    if (Array.isArray(obj[k])) return obj[k];
  }
  if (Array.isArray(obj.data)) return obj.data;
  if (obj.data && typeof obj.data === "object") {
    for (const k of keys) {
      if (Array.isArray(obj.data[k])) return obj.data[k];
    }
    if (Array.isArray(obj.data.data)) return obj.data.data;
  }
  return [];
};

const extractObject = (d: unknown, ...keys: string[]): Record<string, any> => {
  if (!d || typeof d !== "object") return {};
  const obj = d as Record<string, any>;
  for (const k of keys) {
    if (obj[k] && typeof obj[k] === "object") return obj[k];
  }
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) return obj.data;
  return obj;
};

// ============================================================================
// DOMAIN TYPES + NORMALIZATION
// ============================================================================

export type ClientAccountType = "personal" | "business" | "savings" | "current" | "fixed_deposit";

export interface ClientWalletBalance {
  currency: string;
  amount: number;
}

export interface ClientWallet {
  id: string;
  walletNumber: string;
  type: ClientAccountType;
  walletType: ClientAccountType;
  typeLabel: string;
  displayName: string;
  nickname?: string;
  status: "active" | "suspended" | "frozen" | "closed" | "pending" | "approved" | "rejected";
  isPrimary: boolean;
  notes?: string;
  freezeReason?: string;
  balancesByCurrency: ClientWalletBalance[];
  rawTotalBalance: number;
  primaryCurrency: string;
  primaryCurrencyBalance: number;
  recentTransactionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastTransactionAt?: string;

  // AccountApplication identifying variables
  applicationId?: string;
  applicationStatus?: "pending" | "approved" | "rejected";
  isApplicationOnly?: boolean;

  // Savings specific
  initialDeposit?: number;
  goal?: string;
  autoSave?: boolean;
  autoSaveAmount?: number;

  // Current specific
  purpose?: "personal" | "business";
  businessName?: string;
  expectedMonthlyVolume?: number;
  overdraftRequested?: boolean;
  overdraftLimit?: number;

  // Fixed Deposit specific
  principal?: number;
  termMonths?: number;
  interestRate?: number;
  accruedInterest?: number;
  maturityDate?: string;
  autoRenew?: boolean;

  [key: string]: any;
}

export const ACCOUNT_CATEGORY_LABELS: Record<ClientAccountType, string> = {
  personal: "Personal Wallet",
  business: "Business Wallet",
  savings: "Savings Account",
  current: "Current Account",
  fixed_deposit: "Fixed Deposit",
};

function parseWalletType(rawType?: string): ClientAccountType {
  const t = String(rawType || "personal").toLowerCase();
  if (t === "savings") return "savings";
  if (t === "current" || t === "checking") return "current";
  if (t === "fixed_deposit" || t === "fixed-deposit" || t === "fixed") return "fixed_deposit";
  if (t === "business") return "business";
  return "personal";
}

function buildDisplayName(
  type: ClientAccountType,
  opts: {
    nickname?: string;
    notes?: string;
    businessName?: string;
    goal?: string;
    termMonths?: number;
    purpose?: string;
    isPrimary?: boolean;
  },
): string {
  const cleanNotes =
    opts.notes && !String(opts.notes).startsWith("Created from approved application")
      ? opts.notes
      : undefined;
  if (opts.nickname && opts.nickname.trim()) return opts.nickname.trim();
  if (cleanNotes && cleanNotes.trim()) return cleanNotes.trim();
  if (type === "current" && opts.businessName) return `${opts.businessName} Current`;
  if (type === "savings" && opts.goal) return `${opts.goal} Savings`;
  if (type === "fixed_deposit" && opts.termMonths) return `${opts.termMonths}-Month Fixed Deposit`;
  if (type === "current" && opts.purpose === "business") return "Business Current Account";
  if (opts.isPrimary && type === "personal") return "Primary Personal Wallet";
  return ACCOUNT_CATEGORY_LABELS[type] || "Account";
}

export function normalizeApplication(a: any): AccountApplication & { id: string; _id?: string } {
  const id = String(a._id || a.id || "");
  const type = parseWalletType(a.type) as AccountApplicationType;
  return {
    ...a,
    id,
    _id: id,
    type,
    status: (a.status || "pending") as AccountApplicationStatus,
    currency: a.currency || "USD",
    nickname: a.nickname || undefined,
    submittedAt: a.submittedAt || a.createdAt || new Date().toISOString(),
    reviewedAt: a.reviewedAt,
    rejectionReason: a.rejectionReason,
    // Savings
    initialDeposit: Number(a.initialDeposit ?? 0),
    goal: a.goal || undefined,
    autoSave: Boolean(a.autoSave),
    autoSaveAmount: a.autoSaveAmount !== undefined ? Number(a.autoSaveAmount) : undefined,
    // Current
    purpose: a.purpose || "personal",
    businessName: a.businessName || undefined,
    expectedMonthlyVolume: a.expectedMonthlyVolume !== undefined ? Number(a.expectedMonthlyVolume) : undefined,
    overdraftRequested: Boolean(a.overdraftRequested),
    // Fixed Deposit
    principal: Number(a.principal ?? 0),
    termMonths: (Number(a.termMonths) || 12) as FixedDepositApplication["termMonths"],
    interestRate: Number(a.interestRate ?? (type === "savings" ? 2.75 : 5.25)),
    maturityDate: a.maturityDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: Boolean(a.autoRenew),
  };
}

export function normalizeWallet(w: any, linkedApp?: any): ClientWallet {
  const rawBalances =
    w.balances instanceof Map
      ? Object.fromEntries(w.balances)
      : typeof w.balances === "object" && w.balances !== null
        ? w.balances
        : {};

  let balancesByCurrency: ClientWalletBalance[] = Object.entries(rawBalances).map(([currency, amount]) => ({
    currency,
    amount: Number(amount) || 0,
  }));

  if (balancesByCurrency.length === 0 && w.balance !== undefined) {
    balancesByCurrency = [{ currency: w.currency || "USD", amount: Number(w.balance) || 0 }];
  }

  let rawTotalBalance = balancesByCurrency.reduce((sum, b) => sum + b.amount, 0);

  const type = parseWalletType(w.walletType || w.accountType || w.type || linkedApp?.type);
  const initialDeposit = Number(w.initialDeposit ?? linkedApp?.initialDeposit ?? 0);
  const principal = Number(w.principal ?? linkedApp?.principal ?? 0);
  const fallbackDeposit = initialDeposit || principal || 0;

  if (rawTotalBalance === 0 && fallbackDeposit > 0) {
    const curr = linkedApp?.currency || balancesByCurrency[0]?.currency || w.currency || "USD";
    balancesByCurrency = [{ currency: curr, amount: fallbackDeposit }];
    rawTotalBalance = fallbackDeposit;
  }

  const primary = balancesByCurrency[0];
  const rawNotes = w.notes ? String(w.notes) : undefined;
  const cleanNotes =
    rawNotes && !rawNotes.startsWith("Created from approved application") ? rawNotes : undefined;
  const nickname = w.nickname || linkedApp?.nickname || cleanNotes || undefined;
  const goal = w.goal || linkedApp?.goal || undefined;
  const purpose = w.purpose || linkedApp?.purpose || undefined;
  const businessName = w.businessName || linkedApp?.businessName || undefined;
  const expectedMonthlyVolume =
    w.expectedMonthlyVolume !== undefined
      ? Number(w.expectedMonthlyVolume)
      : linkedApp?.expectedMonthlyVolume !== undefined
        ? Number(linkedApp.expectedMonthlyVolume)
        : undefined;
  const overdraftRequested = Boolean(w.overdraftRequested ?? linkedApp?.overdraftRequested ?? (w.overdraftLimit > 0));
  const termMonths = Number(w.termMonths ?? linkedApp?.termMonths ?? 0) || undefined;
  const interestRate =
    w.interestRate !== undefined
      ? Number(w.interestRate)
      : linkedApp?.interestRate !== undefined
        ? Number(linkedApp.interestRate)
        : type === "savings"
          ? 2.75
          : undefined;
  const maturityDate = w.maturityDate || linkedApp?.maturityDate || undefined;
  const autoRenew = Boolean(w.autoRenew ?? linkedApp?.autoRenew);
  const autoSave = Boolean(w.autoSave ?? linkedApp?.autoSave);
  const autoSaveAmount =
    w.autoSaveAmount !== undefined
      ? Number(w.autoSaveAmount)
      : linkedApp?.autoSaveAmount !== undefined
        ? Number(linkedApp.autoSaveAmount)
        : undefined;

  const displayName = buildDisplayName(type, {
    nickname,
    notes: cleanNotes,
    businessName,
    goal,
    termMonths,
    purpose,
    isPrimary: Boolean(w.isPrimary),
  });

  return {
    id: String(w._id || w.id || ""),
    walletNumber: String(w.walletNumber || w.accountNumber || "0000"),
    type,
    walletType: type,
    typeLabel: ACCOUNT_CATEGORY_LABELS[type],
    displayName,
    nickname,
    status: w.status || "active",
    isPrimary: Boolean(w.isPrimary),
    notes: cleanNotes,
    freezeReason: w.freezeReason,
    balancesByCurrency,
    rawTotalBalance,
    primaryCurrency: primary?.currency || linkedApp?.currency || w.currency || "USD",
    primaryCurrencyBalance: primary?.amount ?? rawTotalBalance,
    recentTransactionsCount: w.recentTransactionsCount ?? 0,
    createdAt: w.createdAt || linkedApp?.submittedAt,
    updatedAt: w.updatedAt,
    lastTransactionAt: w.lastTransactionAt,
    applicationId: String(w.applicationId || linkedApp?._id || linkedApp?.id || "") || undefined,
    applicationStatus: w.applicationStatus || linkedApp?.status,
    isApplicationOnly: false,
    initialDeposit: initialDeposit || undefined,
    goal,
    autoSave,
    autoSaveAmount,
    purpose,
    businessName,
    expectedMonthlyVolume,
    overdraftRequested,
    overdraftLimit: Number(w.overdraftLimit || 0),
    principal: principal || undefined,
    termMonths,
    interestRate,
    accruedInterest: Number(w.accruedInterest || 0),
    maturityDate,
    autoRenew,
  };
}

export function applicationToClientWallet(app: any): ClientWallet {
  const norm = normalizeApplication(app);
  const type = parseWalletType(norm.type);
  const amount =
    type === "savings"
      ? Number((norm as SavingsAccountApplication).initialDeposit || 0)
      : type === "fixed_deposit"
        ? Number((norm as FixedDepositApplication).principal || 0)
        : 0;
  const currency = norm.currency || "USD";
  const displayName = buildDisplayName(type, {
    nickname: norm.nickname,
    businessName: (norm as CurrentAccountApplication).businessName,
    goal: (norm as SavingsAccountApplication).goal,
    termMonths: (norm as FixedDepositApplication).termMonths,
    purpose: (norm as CurrentAccountApplication).purpose,
    isPrimary: false,
  });

  const shortRef = norm.id ? norm.id.slice(-6).toUpperCase() : "0000";

  return {
    id: norm.id,
    walletNumber: `APP-${shortRef}`,
    type,
    walletType: type,
    typeLabel: ACCOUNT_CATEGORY_LABELS[type],
    displayName,
    nickname: norm.nickname,
    status: norm.status === "approved" ? "active" : norm.status,
    isPrimary: false,
    notes: norm.nickname,
    balancesByCurrency: [{ currency, amount }],
    rawTotalBalance: amount,
    primaryCurrency: currency,
    primaryCurrencyBalance: amount,
    recentTransactionsCount: 0,
    createdAt: norm.submittedAt,
    applicationId: norm.id,
    applicationStatus: norm.status,
    isApplicationOnly: true,
    initialDeposit: (norm as SavingsAccountApplication).initialDeposit,
    goal: (norm as SavingsAccountApplication).goal,
    autoSave: (norm as SavingsAccountApplication).autoSave,
    autoSaveAmount: (norm as SavingsAccountApplication).autoSaveAmount,
    purpose: (norm as CurrentAccountApplication).purpose,
    businessName: (norm as CurrentAccountApplication).businessName,
    expectedMonthlyVolume: (norm as CurrentAccountApplication).expectedMonthlyVolume,
    overdraftRequested: (norm as CurrentAccountApplication).overdraftRequested,
    principal: (norm as FixedDepositApplication).principal,
    termMonths: (norm as FixedDepositApplication).termMonths,
    interestRate: (norm as FixedDepositApplication).interestRate ?? (type === "savings" ? 2.75 : undefined),
    maturityDate: (norm as FixedDepositApplication).maturityDate,
    autoRenew: (norm as FixedDepositApplication).autoRenew,
  };
}

export function mergeWalletsAndApplications(rawWallets: any[], rawApplications: any[]): ClientWallet[] {
  const normalizedApps = rawApplications.map(normalizeApplication);
  const usedAppIds = new Set<string>();

  const walletsList = rawWallets.map((w: any) => {
    const rawNotes = String(w.notes || "");
    const appIdMatch = rawNotes.match(/application\s+([a-f0-9]{24})/i);
    const wType = parseWalletType(w.walletType || w.accountType || w.type);

    const linkedApp =
      (w.applicationId && normalizedApps.find((a) => a.id === String(w.applicationId))) ||
      (appIdMatch && normalizedApps.find((a) => a.id === appIdMatch[1])) ||
      normalizedApps.find(
        (a) =>
          a.type === wType &&
          !usedAppIds.has(a.id) &&
          (a.status === "approved" || a.status === "pending"),
      );

    if (linkedApp) {
      usedAppIds.add(linkedApp.id);
    }

    return normalizeWallet(w, linkedApp);
  });

  // Also include any non-rejected AccountApplications that don't yet have a corresponding wallet
  for (const app of normalizedApps) {
    if (!usedAppIds.has(app.id) && app.status !== "rejected") {
      walletsList.push(applicationToClientWallet(app));
      usedAppIds.add(app.id);
    }
  }

  return walletsList;
}

function normalizeLedgerEntry(e: any) {
  return {
    id: e._id || e.id || "",
    entryType: e.entryType as "debit" | "credit",
    amount: Number(e.amount) || 0,
    currency: e.currency || "USD",
    balance: Number(e.balance) || 0,
    description: e.description || "",
    createdAt: e.createdAt,
    accountingDate: e.accountingDate,
    isReversed: !!e.isReversed,
    transaction: e.transaction,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/** All wallets + account applications for logged-in user, normalized & merged */
export function useClientWallets() {
  const { data: raw, isLoading: walletsLoading, error, refetch } = useWallets();
  const { data: appsRaw, isLoading: appsLoading } = useAccountApplications();

  const wallets = useMemo(() => {
    const rawWallets = extractArray(raw, "wallets");
    const embeddedApps = extractArray(raw, "applications");
    const separateApps = extractArray(appsRaw, "applications");
    const allApps = separateApps.length > 0 ? separateApps : embeddedApps;
    return mergeWalletsAndApplications(rawWallets, allApps);
  }, [raw, appsRaw]);

  const cached = useMemo(() => !!(raw && typeof raw === "object" && (raw as any).cached), [raw]);

  return { wallets, isLoading: walletsLoading || appsLoading, error, refetch, cached };
}

/** Single wallet detail: wallet + its limit doc + last 10 ledger entries */
export function useClientWalletDetail(walletId: UUID) {
  const { data: raw, isLoading, error, refetch } = useWallet(walletId);

  const wallet = useMemo(() => {
    const w = extractObject(raw, "wallet");
    return Object.keys(w).length ? normalizeWallet(w) : null;
  }, [raw]);

  const limit = useMemo(() => {
    const l = (raw as any)?.limits;
    return l && typeof l === "object" ? (l as AccountLimit) : null;
  }, [raw]);

  const recentEntries = useMemo(() => extractArray(raw, "recentEntries").map(normalizeLedgerEntry), [raw]);

  return { wallet, limit, recentEntries, isLoading, error, refetch };
}

/** Account summary / aggregated stats for the dashboard */
export function useClientAccountSummary() {
  const { data: raw, isLoading, error } = useAccountSummary();
  const { wallets: mergedWallets, isLoading: walletsLoading } = useClientWallets();

  const wallets = useMemo(() => {
    if (mergedWallets.length > 0) return mergedWallets;
    const rawWallets = extractArray(raw, "wallets");
    const rawApps = extractArray(raw, "applications");
    return mergeWalletsAndApplications(rawWallets, rawApps);
  }, [mergedWallets, raw]);

  const summary = useMemo(() => {
    const s = extractObject(raw, "summary");
    const computedTotal = wallets.reduce((acc, w) => acc + (w.rawTotalBalance || 0), 0);
    const savingsBalance = wallets
      .filter((w) => w.type === "savings")
      .reduce((acc, w) => acc + (w.rawTotalBalance || 0), 0);
    const currentBalance = wallets
      .filter((w) => w.type === "current")
      .reduce((acc, w) => acc + (w.rawTotalBalance || 0), 0);
    const fixedDepositBalance = wallets
      .filter((w) => w.type === "fixed_deposit")
      .reduce((acc, w) => acc + (w.rawTotalBalance || 0), 0);
    const personalBalance = wallets
      .filter((w) => w.type === "personal" || w.type === "business")
      .reduce((acc, w) => acc + (w.rawTotalBalance || 0), 0);
    return {
      totalBalance: Math.max(Number(s.totalBalance || 0), computedTotal),
      savingsBalance,
      currentBalance,
      fixedDepositBalance,
      personalBalance,
      primaryCurrency: s.primaryCurrency || wallets[0]?.primaryCurrency || "USD",
      walletsCount: Math.max(Number(s.walletsCount || 0), wallets.length),
      incoming: Number(s.monthlyStats?.incoming ?? 0),
      outgoing: Number(s.monthlyStats?.outgoing ?? 0),
      netFlow: Number(s.monthlyStats?.netFlow ?? 0),
      transactionCount: Number(s.monthlyStats?.transactionCount ?? 0),
    };
  }, [raw, wallets]);

  const recentTransactions = useMemo(() => extractArray(raw, "recentTransactions"), [raw]);

  return { summary, wallets, recentTransactions, isLoading: isLoading || walletsLoading, error };
}

/** Account limits: daily/monthly usage bands + per-wallet limit docs + KYC status */
export function useClientAccountLimits() {
  const { data: raw, isLoading, error } = useAccountLimits();

  const limits = useMemo(() => extractObject(raw, "limits"), [raw]);
  const kycStatus: string = useMemo(() => (raw as any)?.kycStatus || "pending", [raw]);
  const walletLimits = useMemo(() => extractArray(raw, "walletLimits"), [raw]);

  return {
    daily: (limits.daily as { transfer: AccountLimitBand; withdrawal: AccountLimitBand } | undefined) || null,
    monthly: (limits.monthly as { transfer: AccountLimitBand; withdrawal: AccountLimitBand } | undefined) || null,
    perTransaction: limits.perTransaction ?? 0,
    kycStatus,
    walletLimits,
    isLoading,
    error,
  };
}

/** Ledger / balance history for a wallet, with real pagination + filters */
export function useClientBalanceHistory(
  walletId: UUID,
  params?: { page?: number; limit?: number; startDate?: string; endDate?: string; type?: "debit" | "credit" },
) {
  const { data: raw, isLoading, error, refetch } = useBalanceHistory(walletId, params);

  const entries = useMemo(() => extractArray(raw, "data", "entries").map(normalizeLedgerEntry), [raw]);

  const pagination = useMemo(() => {
    const p = (raw as any)?.pagination || {};
    const limit = p.limit ?? params?.limit ?? 50;
    const total = p.total ?? p.totalItems ?? p.count ?? entries.length;
    return {
      page: p.page ?? params?.page ?? 1,
      limit,
      total,
      totalPages: p.totalPages ?? Math.max(1, Math.ceil(total / Math.max(limit, 1))),
    };
  }, [raw, params, entries.length]);

  return { entries, pagination, isLoading, error, refetch };
}

/** Beneficiaries list */
export function useClientBeneficiaries() {
  const { data: raw, isLoading, error, refetch } = useBeneficiaries();
  const beneficiaries = useMemo(
    () =>
      extractArray(raw, "beneficiaries").map((b: any) => ({
        ...b,
        id: String(b.id || b._id || ""),
      })) as Beneficiary[],
    [raw],
  );
  return { beneficiaries, isLoading, error, refetch };
}

/** Account Applications list — normalized with `id` and enriched with live wallet info */
export function useClientAccountApplications() {
  const { data: raw, isLoading, error, refetch } = useAccountApplications();
  const { data: walletsRaw } = useWallets();

  const applications = useMemo(() => {
    const rawApps = extractArray(raw, "applications").map(normalizeApplication);
    const rawWallets = extractArray(walletsRaw, "wallets").map((w) => normalizeWallet(w));

    return rawApps.map((app: any) => {
      const matchingWallet = rawWallets.find(
        (w) =>
          w.applicationId === app.id ||
          (app.walletId && w.id === String(app.walletId)) ||
          (w.type === app.type && (!app.nickname || w.nickname === app.nickname)),
      );
      return {
        ...app,
        walletId: app.walletId || matchingWallet?.id,
        walletNumber: app.walletNumber || matchingWallet?.walletNumber,
        walletBalance: matchingWallet?.rawTotalBalance,
      };
    });
  }, [raw, walletsRaw]);

  return { applications, isLoading, error, refetch };
}

/** Closed wallets history */
export function useClientClosedWallets() {
  const { data: raw, isLoading, error, refetch } = useClosedWallets();
  const closedWallets = useMemo(() => extractArray(raw, "wallets").map((w) => normalizeWallet(w)), [raw]);
  return { closedWallets, isLoading, error, refetch };
}

/** Consolidated account limits across all user wallets */
export function useClientConsolidatedLimits() {
  const { data: raw, isLoading, error, refetch } = useConsolidatedLimits();
  const consolidated = useMemo(() => extractObject(raw, "consolidatedLimits", "limits"), [raw]);
  return { consolidated, isLoading, error, refetch };
}

/** User calculated credit score */
export function useClientCreditScore() {
  const { data: raw, isLoading, error, refetch } = useCreditScore();
  const score = useMemo(() => (raw as any)?.creditScore ?? (raw as any)?.score ?? 720, [raw]);
  return { score, isLoading, error, refetch };
}

/** Products linked to a specific wallet */
export function useClientWalletProducts(walletId?: UUID) {
  const { data: raw, isLoading, error, refetch } = useWalletProducts(walletId);
  const products = useMemo(() => {
    const p = extractObject(raw, "products");
    return {
      cards: extractArray(p, "cards"),
      loans: extractArray(p, "loans"),
      investments: extractArray(p, "investments"),
    };
  }, [raw]);
  return { products, isLoading, error, refetch };
}

// ============================================================================
// MUTATIONS (pass-through with same API)
// ============================================================================

export {
  useAddBeneficiary,
  useRemoveBeneficiary,
  useCreateWallet,
  useUpdateWallet,
  useCloseWallet,
  useApplyForAccount,
  useCancelApplication,
  useLinkCardToWallet,
  useUnlinkCardFromWallet,
  useSetCardFundingSource,
};

// ============================================================================
// COMPUTED HELPERS
// ============================================================================

/** Format a wallet balance with currency symbol */
export function useFormattedBalance(amount: number, currency = "USD") {
  return formatCurrency(amount, currency);
}

/** Mask a wallet/account number for display */
export function useMaskedNumber(num?: string) {
  return maskSensitive(num || "", 4);
}

/** Every currency balance on a wallet, formatted, e.g. "$1,240.00 · ₦82,000.00" */
export function formatWalletBalances(wallet: Pick<ClientWallet, "balancesByCurrency">): string {
  if (!wallet.balancesByCurrency.length) return formatCurrency(0, "USD");
  return wallet.balancesByCurrency.map((b) => formatCurrency(b.amount, b.currency)).join(" · ");
}

/** Supported wallet currencies */
export const SUPPORTED_WALLET_CURRENCIES: Currency[] = [
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "KES",
  "GHS",
  "ZAR",
  "CAD",
  "AUD",
] as Currency[];
