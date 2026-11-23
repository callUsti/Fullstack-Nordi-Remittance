// ============================================================================
// ApplicationStatusCard — Spacious, high-contrast status card for Account Applications
// ============================================================================

import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, XCircle, Trash2, ArrowUpRight, Tag, Wallet } from "lucide-react";
import { DashCard } from "@components/shared/DashboardPrimitives";
import { useCancelApplication } from "../client-usecase/useaccounts-client-usecase";

const statusStyles: Record<
  AccountApplication["status"],
  { bg: string; text: string; border: string; icon: React.ReactNode; label: string }
> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200/80 dark:border-amber-800/60",
    icon: <Clock size={16} />,
    label: "Pending Admin Review",
  },
  approved: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/80 dark:border-emerald-800/60",
    icon: <CheckCircle2 size={16} />,
    label: "Approved & Active",
  },
  rejected: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200/80 dark:border-rose-800/60",
    icon: <XCircle size={16} />,
    label: "Declined",
  },
};

interface Props {
  application: AccountApplication & {
    walletId?: string;
    walletNumber?: string;
    walletBalance?: number;
  };
  fields: Array<{ label: string; value: string }>;
  showDevPreview?: boolean;
}

export const ApplicationStatusCard: React.FC<Props> = ({ application, fields }) => {
  const navigate = useNavigate();
  const { mutate: cancelApplication, isPending: isCancelling } = useCancelApplication();
  const style = statusStyles[application.status] || statusStyles.pending;

  const accountTitle =
    application.nickname ||
    (application.type === "current" && application.businessName ? application.businessName : undefined) ||
    (application.type === "savings" && application.goal ? application.goal : undefined) ||
    (application.type === "savings"
      ? "Savings Account"
      : application.type === "current"
        ? "Current Account"
        : "Fixed Deposit Account");

  return (
    <DashCard padding="lg" className="border-gray-200/90 transition-all hover:shadow-md dark:border-gray-800">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium sm:text-sm ${style.bg} ${style.text} ${style.border}`}
          >
            {style.icon}
            {style.label}
          </span>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-blue-500" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">{accountTitle}</h4>
          </div>
          {application.walletNumber && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 font-mono text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Wallet size={13} />
              Acct •••• {String(application.walletNumber).slice(-4)}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
          Submitted {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : "Recently"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((f) => (
          <div
            key={f.label}
            className="rounded-2xl border border-gray-100 bg-gray-50/90 p-4 dark:border-gray-800/80 dark:bg-gray-800/50"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{f.label}</p>
            <p className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">{f.value}</p>
          </div>
        ))}
      </div>

      {application.status === "rejected" && application.rejectionReason && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <span className="font-medium">Admin Review Note: </span>
          {application.rejectionReason}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        {application.status === "pending" ? (
          <button
            disabled={isCancelling}
            onClick={() => {
              if (confirm("Withdraw this application?")) cancelApplication(application.id);
            }}
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 sm:text-sm"
          >
            <Trash2 size={15} /> {isCancelling ? "Withdrawing..." : "Withdraw Application"}
          </button>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500 sm:text-sm">
            {application.reviewedAt
              ? `Reviewed on ${new Date(application.reviewedAt).toLocaleDateString()}`
              : application.status === "approved"
                ? "Account active and ready for transactions"
                : "Application closed"}
          </span>
        )}

        {application.walletId && (
          <button
            onClick={() => navigate(`/customer/accounts/${application.walletId}`)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:text-sm"
          >
            Open Account Details <ArrowUpRight size={15} />
          </button>
        )}
      </div>
    </DashCard>
  );
};
