// ============================================================================
// TRANSFER LIMITS BANNER, LIVE EXCEEDED WARNING & LIMIT CHANGE REQUEST MODAL
// ============================================================================

import React, { useState } from "react";
import { Shield, SlidersHorizontal, AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react";
import {
  useRequestLimitChange,
  type ScopeLimitInfo,
  type LimitChangeRequestItem,
} from "@hooks/useTransferLimits";
import { parseApiError } from "@core/errors/apiErrors";

const fmt = (n: number) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface TransferLimitsCardProps {
  scope: "domestic" | "international";
  limits?: ScopeLimitInfo;
  pendingRequests?: LimitChangeRequestItem[];
  onOpenRequestModal: () => void;
}

export const TransferLimitsCard: React.FC<TransferLimitsCardProps> = ({
  scope,
  limits,
  pendingRequests = [],
  onOpenRequestModal,
}) => {
  const defaults: ScopeLimitInfo =
    scope === "domestic"
      ? {
          perTransaction: 25000,
          daily: 500000,
          monthly: 2000000,
          dailyUsed: 0,
          monthlyUsed: 0,
          dailyRemaining: 500000,
          monthlyRemaining: 2000000,
        }
      : {
          perTransaction: 5000000,
          daily: 10000000,
          monthly: 50000000,
          dailyUsed: 0,
          monthlyUsed: 0,
          dailyRemaining: 10000000,
          monthlyRemaining: 50000000,
        };

  const active = limits || defaults;
  const hasPending = pendingRequests.some((r) => r.scope === scope && r.status === "pending");

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-700/70 dark:bg-slate-800/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            {scope === "domestic" ? "Domestic" : "International"} Transfer Limits
          </span>
          {active.isCustom && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Custom
            </span>
          )}
          {hasPending && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Request Pending
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenRequestModal}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
        >
          <SlidersHorizontal size={12} />
          Apply to Adjust Limit
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-900/60">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Per Transaction Max</p>
          <p className="font-semibold text-slate-900 dark:text-white">${fmt(active.perTransaction)}</p>
        </div>
        <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-900/60">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Daily Limit (Remaining)</p>
          <p className="font-semibold text-slate-900 dark:text-white">
            ${fmt(active.daily)}{" "}
            <span className="text-[11px] font-normal text-slate-500">
              (${fmt(active.dailyRemaining)} left)
            </span>
          </p>
        </div>
        <div className="rounded-lg bg-white px-3 py-2 dark:bg-slate-900/60">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly Limit (Remaining)</p>
          <p className="font-semibold text-slate-900 dark:text-white">
            ${fmt(active.monthly)}{" "}
            <span className="text-[11px] font-normal text-slate-500">
              (${fmt(active.monthlyRemaining)} left)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

interface LimitExceededWarningProps {
  amount: number;
  limits?: ScopeLimitInfo;
  scope: "domestic" | "international";
  onApplyLimit: () => void;
}

export const LimitExceededWarning: React.FC<LimitExceededWarningProps> = ({
  amount,
  limits,
  scope,
  onApplyLimit,
}) => {
  if (!limits || !amount || amount <= 0) return null;

  let reason: string | null = null;
  if (amount > limits.perTransaction) {
    reason = `Your current ${scope} per-transaction limit is $${fmt(limits.perTransaction)}. You cannot send more than $${fmt(limits.perTransaction)} in a single transfer.`;
  } else if (amount > limits.dailyRemaining) {
    reason = `This transfer exceeds your remaining daily ${scope} limit of $${fmt(limits.dailyRemaining)} (out of $${fmt(limits.daily)}/day).`;
  } else if (amount > limits.monthlyRemaining) {
    reason = `This transfer exceeds your remaining monthly ${scope} limit of $${fmt(limits.monthlyRemaining)} (out of $${fmt(limits.monthly)}/month).`;
  }

  if (!reason) return null;

  return (
    <div
      role="alert"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-rose-900 dark:border-rose-700/60 dark:bg-rose-950/30 dark:text-rose-200"
    >
      <div className="flex items-start gap-2.5 text-xs">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
        <div>
          <p className="font-semibold">Transfer Limit Exceeded</p>
          <p className="mt-0.5 opacity-90">{reason}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onApplyLimit}
        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
      >
        Request Limit Increase
      </button>
    </div>
  );
};

interface RequestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultScope: "domestic" | "international";
  currentLimits?: ScopeLimitInfo;
}

export const RequestLimitModal: React.FC<RequestLimitModalProps> = ({
  isOpen,
  onClose,
  defaultScope,
  currentLimits,
}) => {
  const [scope, setScope] = useState<"domestic" | "international">(defaultScope);
  const [action, setAction] = useState<"increase" | "decrease">("increase");
  const [perTransaction, setPerTransaction] = useState(
    currentLimits ? String(currentLimits.perTransaction) : "",
  );
  const [daily, setDaily] = useState(currentLimits ? String(currentLimits.daily) : "");
  const [monthly, setMonthly] = useState(currentLimits ? String(currentLimits.monthly) : "");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useRequestLimitChange();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    mutation.mutate(
      {
        scope,
        action,
        perTransaction: perTransaction ? Number(perTransaction) : undefined,
        daily: daily ? Number(daily) : undefined,
        monthly: monthly ? Number(monthly) : undefined,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (err) => {
          const parsed = parseApiError(err);
          setErrorMsg(parsed.message);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:rounded-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Apply for Transfer Limit Adjustment
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Request an increase or decrease for your account limits
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Limit Request Submitted
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your {scope} limit {action} request has been sent to our admin team for review.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Transfer Type
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as "domestic" | "international")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Request Type
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as "increase" | "decrease")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="increase">Increase Limit</option>
                  <option value="decrease">Decrease Limit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  Per Transaction ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={perTransaction}
                  onChange={(e) => setPerTransaction(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  Daily Limit ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={daily}
                  onChange={(e) => setDaily(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  Monthly Limit ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  placeholder="e.g. 2000000"
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Reason (optional)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Business supplier payments or lower daily cap for security"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {errorMsg}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Submit Application
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

