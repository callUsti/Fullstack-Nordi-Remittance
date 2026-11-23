// ============================================================================
// TRANSACTION ERROR ALERT & INSUFFICIENT FUNDS WARNING
// Customer-friendly error notices mapped from backend error codes (E1001–E9004)
// and live balance warnings for transfer forms.
// ============================================================================

import React from "react";
import { AlertTriangle, AlertCircle, Info, X, ArrowRight } from "lucide-react";
import type { ParsedApiError } from "@core/errors/apiErrors";

interface TransactionErrorAlertProps {
  error: ParsedApiError | string | null;
  onAction?: (actionType?: ParsedApiError["actionType"]) => void;
  onDismiss?: () => void;
  className?: string;
}

export const TransactionErrorAlert: React.FC<TransactionErrorAlertProps> = ({
  error,
  onAction,
  onDismiss,
  className = "",
}) => {
  if (!error) return null;

  const parsed: ParsedApiError =
    typeof error === "string"
      ? {
          code: "ERROR",
          title: "Transfer Could Not Be Completed",
          message: error,
          severity: "error",
        }
      : error;

  const styles =
    parsed.severity === "warning"
      ? {
          wrap: "border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200",
          icon: <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />,
          badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
          btn: "bg-amber-600 hover:bg-amber-700 text-white",
        }
      : parsed.severity === "info"
        ? {
            wrap: "border-blue-200 bg-blue-50/90 text-blue-900 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-200",
            icon: <Info size={18} className="mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />,
            badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
            btn: "bg-blue-600 hover:bg-blue-700 text-white",
          }
        : {
            wrap: "border-rose-200 bg-rose-50/90 text-rose-900 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-200",
            icon: <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />,
            badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
            btn: "bg-rose-600 hover:bg-rose-700 text-white",
          };

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 shadow-xs transition-all ${styles.wrap} ${className}`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">{parsed.title}</h4>
            {parsed.code && (
              <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${styles.badge}`}>
                {parsed.code}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed opacity-95">{parsed.message}</p>
          {parsed.guidance && (
            <p className="text-xs leading-relaxed opacity-80">{parsed.guidance}</p>
          )}
          {parsed.actionLabel && onAction && (
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => onAction(parsed.actionType)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${styles.btn}`}
              >
                {parsed.actionLabel}
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className="rounded-md p-1 opacity-60 hover:opacity-100"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

interface InsufficientFundsWarningProps {
  totalRequired: number;
  available: number;
  shortfall: number;
  currency?: string;
}

export const InsufficientFundsWarning: React.FC<InsufficientFundsWarningProps> = ({
  totalRequired,
  available,
  shortfall,
  currency = "USD",
}) => {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      role="status"
      className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200"
    >
      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="space-y-1 text-xs leading-relaxed">
        <p className="font-semibold">Insufficient Wallet Balance</p>
        <p>
          Total required (amount + fee) is{" "}
          <span className="font-semibold">
            {currency} {fmt(totalRequired)}
          </span>
          , which exceeds your available balance of{" "}
          <span className="font-semibold">
            {currency} {fmt(available)}
          </span>{" "}
          by{" "}
          <span className="font-semibold text-rose-700 dark:text-rose-300">
            {currency} {fmt(shortfall)}
          </span>
          .
        </p>
        <p className="opacity-85">
          Reduce the transfer amount, lower the charges, or select a wallet with sufficient funds before continuing.
        </p>
      </div>
    </div>
  );
};

