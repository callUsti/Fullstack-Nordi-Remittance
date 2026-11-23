// ============================================================================
// API ERROR CATALOG & PARSER
// Maps every backend error code (E1001–E9004), HTTP status, and network
// condition to accurate, customer-friendly titles, messages, and next steps.
// ============================================================================

import axios from "axios";

export type ApiErrorSeverity = "error" | "warning" | "info";

export interface ApiErrorDescriptor {
  code: string;
  title: string;
  message: string;
  guidance?: string;
  severity: ApiErrorSeverity;
  retryable?: boolean;
  actionLabel?: string;
  actionType?: "edit_amount" | "kyc" | "signin" | "support" | "retry" | "cards";
}

export interface ParsedApiError extends ApiErrorDescriptor {
  rawMessage?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export const BACKEND_ERROR_CODES = {
  // Auth errors (1xxx)
  INVALID_CREDENTIALS: "E1001",
  TOKEN_EXPIRED: "E1002",
  TOKEN_INVALID: "E1003",
  UNAUTHORIZED: "E1004",
  FORBIDDEN: "E1005",
  ACCOUNT_LOCKED: "E1006",
  ACCOUNT_SUSPENDED: "E1007",
  EMAIL_NOT_VERIFIED: "E1008",
  TWO_FACTOR_REQUIRED: "E1009",
  TWO_FACTOR_INVALID: "E1010",
  SESSION_EXPIRED: "E1011",

  // Validation errors (2xxx)
  VALIDATION_ERROR: "E2001",
  INVALID_INPUT: "E2002",
  MISSING_REQUIRED_FIELD: "E2003",
  INVALID_FORMAT: "E2004",

  // User errors (3xxx)
  USER_NOT_FOUND: "E3001",
  USER_ALREADY_EXISTS: "E3002",
  EMAIL_ALREADY_EXISTS: "E3003",
  PHONE_ALREADY_EXISTS: "E3004",
  KYC_NOT_VERIFIED: "E3005",

  // Transaction errors (4xxx)
  INSUFFICIENT_BALANCE: "E4001",
  TRANSACTION_FAILED: "E4002",
  TRANSACTION_LIMIT_EXCEEDED: "E4003",
  INVALID_ACCOUNT: "E4004",
  DUPLICATE_TRANSACTION: "E4005",
  TRANSACTION_NOT_FOUND: "E4006",

  // Wallet errors (5xxx)
  WALLET_NOT_FOUND: "E5001",
  WALLET_SUSPENDED: "E5002",
  WALLET_FROZEN: "E5003",

  // Card errors (6xxx)
  CARD_NOT_FOUND: "E6001",
  CARD_BLOCKED: "E6002",
  CARD_EXPIRED: "E6003",

  // Loan errors (7xxx)
  LOAN_NOT_FOUND: "E7001",
  LOAN_APPLICATION_REJECTED: "E7002",

  // Security errors (8xxx)
  RATE_LIMIT_EXCEEDED: "E8001",
  FRAUD_DETECTED: "E8002",
  SUSPICIOUS_ACTIVITY: "E8003",
  IP_BLOCKED: "E8004",

  // Server errors (9xxx)
  INTERNAL_ERROR: "E9001",
  DATABASE_ERROR: "E9002",
  EXTERNAL_SERVICE_ERROR: "E9003",
  SERVICE_UNAVAILABLE: "E9004",
} as const;

const ERROR_CATALOG: Record<string, ApiErrorDescriptor> = {
  // ── Auth (1xxx) ──────────────────────────────────────────────────────────
  E1001: {
    code: "E1001",
    title: "Invalid Credentials",
    message: "The email or password you entered is incorrect.",
    guidance: "Check your credentials and try again, or reset your password.",
    severity: "error",
    retryable: true,
  },
  E1002: {
    code: "E1002",
    title: "Session Timed Out",
    message: "Your access token has expired.",
    guidance: "Please sign in again to continue securely.",
    severity: "warning",
    actionLabel: "Sign In Again",
    actionType: "signin",
  },
  E1003: {
    code: "E1003",
    title: "Invalid Session",
    message: "Your session token could not be verified.",
    guidance: "Sign out and sign back in to refresh your session.",
    severity: "warning",
    actionLabel: "Sign In Again",
    actionType: "signin",
  },
  E1004: {
    code: "E1004",
    title: "Authentication Required",
    message: "You must be signed in to complete this action.",
    guidance: "Please sign in and try again.",
    severity: "warning",
    actionLabel: "Sign In",
    actionType: "signin",
  },
  E1005: {
    code: "E1005",
    title: "Access Denied",
    message: "You do not have permission to perform this operation.",
    guidance: "If you believe this is a mistake, please contact support.",
    severity: "error",
    actionLabel: "Contact Support",
    actionType: "support",
  },
  E1006: {
    code: "E1006",
    title: "Account Locked",
    message: "Your account has been temporarily locked for your security.",
    guidance: "Please contact customer support or wait for the lock period to expire.",
    severity: "error",
    actionLabel: "Contact Support",
    actionType: "support",
  },
  E1007: {
    code: "E1007",
    title: "Account Suspended",
    message: "Your account is currently suspended and cannot send or receive funds.",
    guidance: "Reach out to our compliance or support team to restore access.",
    severity: "error",
    actionLabel: "Contact Support",
    actionType: "support",
  },
  E1008: {
    code: "E1008",
    title: "Email Not Verified",
    message: "Please verify your email address before making transfers.",
    guidance: "Check your inbox for the verification link or request a new one.",
    severity: "warning",
  },
  E1009: {
    code: "E1009",
    title: "Two-Factor Authentication Required",
    message: "Additional verification is needed to authorize this action.",
    guidance: "Enter the verification code sent to your device.",
    severity: "info",
  },
  E1010: {
    code: "E1010",
    title: "Invalid Verification Code",
    message: "The 2FA or security code you entered is incorrect or expired.",
    guidance: "Request a fresh code and check each digit carefully.",
    severity: "error",
    retryable: true,
  },
  E1011: {
    code: "E1011",
    title: "Session Expired",
    message: "Your session has expired due to inactivity.",
    guidance: "Please sign in again to continue your transaction.",
    severity: "warning",
    actionLabel: "Sign In Again",
    actionType: "signin",
  },

  // ── Validation (2xxx) ────────────────────────────────────────────────────
  E2001: {
    code: "E2001",
    title: "Invalid Transfer Details",
    message: "Some of the information provided did not pass validation.",
    guidance: "Review the highlighted fields and try again.",
    severity: "warning",
    retryable: true,
  },
  E2002: {
    code: "E2002",
    title: "Invalid Input",
    message: "One or more entered values are not valid.",
    guidance: "Double-check the amount, account number, or recipient details.",
    severity: "warning",
    retryable: true,
  },
  E2003: {
    code: "E2003",
    title: "Missing Required Information",
    message: "A required field is missing from your request.",
    guidance: "Make sure all required fields and confirmations are completed.",
    severity: "warning",
    retryable: true,
  },
  E2004: {
    code: "E2004",
    title: "Invalid Format",
    message: "One of the fields is not in the expected format.",
    guidance: "Check SWIFT/routing codes, account numbers, or currency formats.",
    severity: "warning",
    retryable: true,
  },

  // ── User & KYC (3xxx) ────────────────────────────────────────────────────
  E3001: {
    code: "E3001",
    title: "Account Not Found",
    message: "We could not find the requested user or recipient profile.",
    guidance: "Verify the recipient details and try again.",
    severity: "error",
  },
  E3002: {
    code: "E3002",
    title: "Account Already Exists",
    message: "An account with these details already exists.",
    severity: "warning",
  },
  E3003: {
    code: "E3003",
    title: "Email Already Registered",
    message: "This email address is already linked to an existing account.",
    severity: "warning",
  },
  E3004: {
    code: "E3004",
    title: "Phone Already Registered",
    message: "This phone number is already linked to an existing account.",
    severity: "warning",
  },
  E3005: {
    code: "E3005",
    title: "Identity Verification (KYC) Required",
    message: "Your identity verification must be approved before you can complete this transfer.",
    guidance: "Complete or check your KYC verification status in Settings.",
    severity: "warning",
    actionLabel: "Verify Identity",
    actionType: "kyc",
  },

  // ── Transactions (4xxx) ──────────────────────────────────────────────────
  E4001: {
    code: "E4001",
    title: "Insufficient Funds",
    message: "Your selected wallet does not have enough available balance (including transfer fees).",
    guidance: "Lower the transfer amount, choose another wallet, or add funds first.",
    severity: "warning",
    retryable: true,
    actionLabel: "Edit Amount",
    actionType: "edit_amount",
  },
  E4002: {
    code: "E4002",
    title: "Transaction Failed",
    message: "We could not process this transaction at this time.",
    guidance: "No funds were debited. Review your details and try again.",
    severity: "error",
    retryable: true,
    actionLabel: "Try Again",
    actionType: "retry",
  },
  E4003: {
    code: "E4003",
    title: "Transfer Limit Exceeded",
    message: "This transfer exceeds your allowed transaction or daily limit.",
    guidance: "Try a smaller amount or upgrade your KYC tier to raise your limits.",
    severity: "warning",
    actionLabel: "Edit Amount",
    actionType: "edit_amount",
  },
  E4004: {
    code: "E4004",
    title: "Invalid Destination Account",
    message: "The recipient account or bank details could not be verified.",
    guidance: "Confirm the account number, routing/SWIFT code, and bank name.",
    severity: "error",
    retryable: true,
  },
  E4005: {
    code: "E4005",
    title: "Duplicate Transaction Detected",
    message: "An identical transfer was recently submitted.",
    guidance: "Please wait a moment and check your transaction history before retrying to avoid duplicate charges.",
    severity: "warning",
  },
  E4006: {
    code: "E4006",
    title: "Transaction Not Found",
    message: "We could not locate that transaction record.",
    severity: "error",
  },

  // ── Wallets (5xxx) ───────────────────────────────────────────────────────
  E5001: {
    code: "E5001",
    title: "Wallet Not Found",
    message: "The selected source wallet could not be found.",
    guidance: "Refresh your accounts and select an active wallet.",
    severity: "error",
    retryable: true,
  },
  E5002: {
    code: "E5002",
    title: "Wallet Suspended",
    message: "This wallet is currently suspended and cannot be used for transfers.",
    guidance: "Select another wallet or contact support for assistance.",
    severity: "error",
    actionLabel: "Contact Support",
    actionType: "support",
  },
  E5003: {
    code: "E5003",
    title: "Wallet Frozen",
    message: "This wallet is frozen and outgoing transfers are temporarily disabled.",
    guidance: "Unfreeze your wallet in Wallet Settings or contact support.",
    severity: "error",
    actionLabel: "Contact Support",
    actionType: "support",
  },

  // ── Cards (6xxx) ─────────────────────────────────────────────────────────
  E6001: {
    code: "E6001",
    title: "Card Not Found",
    message: "The selected card could not be found.",
    guidance: "Check your active cards and try again.",
    severity: "error",
    actionLabel: "Manage Cards",
    actionType: "cards",
  },
  E6002: {
    code: "E6002",
    title: "Card Blocked",
    message: "This card is currently blocked and cannot be used.",
    guidance: "Unblock your card in Card Management or use another payment method.",
    severity: "error",
    actionLabel: "Manage Cards",
    actionType: "cards",
  },
  E6003: {
    code: "E6003",
    title: "Card Expired",
    message: "This card has expired and can no longer be used for payments.",
    guidance: "Please add or select a valid card.",
    severity: "warning",
    actionLabel: "Manage Cards",
    actionType: "cards",
  },

  // ── Loans (7xxx) ─────────────────────────────────────────────────────────
  E7001: {
    code: "E7001",
    title: "Loan Not Found",
    message: "The requested loan record could not be found.",
    severity: "error",
  },
  E7002: {
    code: "E7002",
    title: "Loan Application Rejected",
    message: "Your loan application did not meet the current eligibility criteria.",
    guidance: "Review your profile or contact support for more details.",
    severity: "warning",
  },

  // ── Security & Rate Limiting (8xxx) ──────────────────────────────────────
  E8001: {
    code: "E8001",
    title: "Too Many Requests",
    message: "You've made too many attempts in a short time.",
    guidance: "Please wait a minute and try again.",
    severity: "warning",
    retryable: true,
    actionLabel: "Try Again",
    actionType: "retry",
  },
  E8002: {
    code: "E8002",
    title: "Security Hold — Possible Fraud",
    message: "This transaction was flagged by our automated fraud protection.",
    guidance: "For your protection, please contact support to verify and release this transfer.",
    severity: "error",
    actionLabel: "Contact Support",
    actionType: "support",
  },
  E8003: {
    code: "E8003",
    title: "Unusual Activity Detected",
    message: "We noticed unusual activity on this request and paused it for review.",
    guidance: "Verify your identity or contact customer support.",
    severity: "error",
    actionLabel: "Contact Support",
    actionType: "support",
  },
  E8004: {
    code: "E8004",
    title: "Access Restricted",
    message: "Requests from your current network or IP address are restricted.",
    guidance: "Disable any VPN/proxy or contact support if this persists.",
    severity: "error",
    actionLabel: "Contact Support",
    actionType: "support",
  },

  // ── Server / External (9xxx) ─────────────────────────────────────────────
  E9001: {
    code: "E9001",
    title: "Unexpected Server Error",
    message: "Something went wrong on our end while processing your request.",
    guidance: "Please try again in a moment. If it persists, contact support.",
    severity: "error",
    retryable: true,
    actionLabel: "Try Again",
    actionType: "retry",
  },
  E9002: {
    code: "E9002",
    title: "Temporary System Issue",
    message: "We're experiencing a temporary database issue.",
    guidance: "Please try again shortly.",
    severity: "error",
    retryable: true,
    actionLabel: "Try Again",
    actionType: "retry",
  },
  E9003: {
    code: "E9003",
    title: "Partner Bank / Provider Unavailable",
    message: "A banking or payment partner did not respond in time.",
    guidance: "Please retry in a few moments.",
    severity: "warning",
    retryable: true,
    actionLabel: "Try Again",
    actionType: "retry",
  },
  E9004: {
    code: "E9004",
    title: "Service Temporarily Unavailable",
    message: "This service is currently undergoing maintenance or high load.",
    guidance: "Please try again in a few minutes.",
    severity: "warning",
    retryable: true,
    actionLabel: "Try Again",
    actionType: "retry",
  },
};

function formatCurrencyAmount(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value ?? "");
}

/**
 * Parses any Axios, backend structured, or runtime error into a rich customer-facing notice.
 */
export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { error?: { code?: string; message?: string; details?: Record<string, unknown> }; message?: string }
      | undefined;

    const code = data?.error?.code;
    const rawMessage = data?.error?.message || data?.message || error.message;
    const details = data?.error?.details;

    // Network / Timeout errors (no HTTP response)
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return {
          code: "TIMEOUT",
          title: "Request Timed Out",
          message: "The server took too long to respond.",
          guidance: "Check your transaction history before retrying so you don't submit twice.",
          severity: "warning",
          retryable: true,
          actionLabel: "Try Again",
          actionType: "retry",
          rawMessage,
        };
      }
      return {
        code: "NETWORK_ERROR",
        title: "Connection Lost",
        message: "We couldn't reach the server. Please check your internet connection.",
        guidance: "Reconnect to the internet and try again.",
        severity: "warning",
        retryable: true,
        actionLabel: "Try Again",
        actionType: "retry",
        rawMessage,
      };
    }

    // Match structured backend error code
    if (code && ERROR_CATALOG[code]) {
      const entry = ERROR_CATALOG[code];
      let message = rawMessage || entry.message;

      // Enrich E4001 Insufficient Balance with exact numbers if available
      if (
        code === BACKEND_ERROR_CODES.INSUFFICIENT_BALANCE &&
        details &&
        details.required !== undefined &&
        details.available !== undefined
      ) {
        message = `You need ${formatCurrencyAmount(details.required)} (including fees), but your selected wallet only has ${formatCurrencyAmount(details.available)} available.`;
      }

      return {
        ...entry,
        message,
        rawMessage,
        status,
        details,
      };
    }

    // Fallback by HTTP status
    if (status === 401) {
      return { ...ERROR_CATALOG.E1011, rawMessage, status, details };
    }
    if (status === 403) {
      return { ...ERROR_CATALOG.E1005, message: rawMessage || ERROR_CATALOG.E1005.message, rawMessage, status, details };
    }
    if (status === 409) {
      return { ...ERROR_CATALOG.E4005, message: rawMessage || ERROR_CATALOG.E4005.message, rawMessage, status, details };
    }
    if (status === 429) {
      return { ...ERROR_CATALOG.E8001, rawMessage, status, details };
    }
    if (status && status >= 500) {
      return { ...ERROR_CATALOG.E9001, rawMessage, status, details };
    }

    return {
      code: code || `HTTP_${status || 400}`,
      title: "Unable to Complete Request",
      message: rawMessage || "Please review your details and try again.",
      guidance: "If this continues, contact customer support.",
      severity: "error",
      retryable: true,
      rawMessage,
      status,
      details,
    };
  }

  if (error instanceof Error) {
    return {
      code: "CLIENT_ERROR",
      title: "Something Went Wrong",
      message: error.message || "An unexpected error occurred.",
      severity: "error",
      retryable: true,
      rawMessage: error.message,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    title: "Unexpected Error",
    message: "An unexpected error occurred. Please try again.",
    severity: "error",
    retryable: true,
  };
}

export interface InsufficientFundsCheck {
  insufficient: boolean;
  totalRequired: number;
  available: number;
  shortfall: number;
  currency: string;
}

/**
 * Checks whether amount + fee exceeds the selected wallet's available balance.
 */
export function checkInsufficientFunds(
  amount: unknown,
  fee: unknown,
  availableBalance: unknown,
  currency = "USD",
): InsufficientFundsCheck {
  const numAmount = Math.max(0, Number(amount) || 0);
  const numFee = Math.max(0, Number(fee) || 0);
  const totalRequired = Math.round((numAmount + numFee) * 100) / 100;
  const available = Math.max(0, Number(availableBalance) || 0);
  const insufficient = numAmount > 0 && totalRequired > available;
  const shortfall = insufficient ? Math.round((totalRequired - available) * 100) / 100 : 0;

  return {
    insufficient,
    totalRequired,
    available,
    shortfall,
    currency,
  };
}

