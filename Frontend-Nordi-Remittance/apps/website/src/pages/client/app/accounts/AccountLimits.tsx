// ============================================================================
// ACCOUNT LIMITS — Spacious KYC tier & daily/monthly transaction limit bands
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownLeft, Zap } from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { PageContainer, DashCard } from "@components/shared/DashboardPrimitives";
import { StatsGridSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import { useClientAccountLimits } from "../../client-usecase/useaccounts-client-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

const fmt = (n: number, c = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c, minimumFractionDigits: 0 }).format(n);
  } catch {
    return `${c} ${(Number(n) || 0).toLocaleString()}`;
  }
};

const UsageBar: React.FC<{ label: string; band: AccountLimitBand; currency?: string; icon: React.ReactNode }> = ({
  label,
  band,
  currency = "USD",
  icon,
}) => {
  const pct = band.limit > 0 ? Math.min(100, Math.round((band.used / band.limit) * 100)) : 0;
  const isHigh = pct >= 90;
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-800/40">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-sm font-medium text-gray-800 dark:text-gray-200 sm:text-base">
          {icon}
          {label}
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
          {fmt(band.used, currency)} <span className="font-normal text-gray-400">/ {fmt(band.limit, currency)}</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-rose-500" : "bg-blue-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
        <span>{pct}% utilized</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {fmt(band.remaining, currency)} remaining
        </span>
      </div>
    </div>
  );
};

const AccountLimits: React.FC = () => {
  const { daily, monthly, perTransaction, kycStatus, walletLimits, isLoading } = useClientAccountLimits();
  const isApproved = kycStatus === "approved" || kycStatus === "verified";

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Account Limits"
          subtitle="Monitor your daily, monthly, and per-transaction limits across all accounts"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Accounts", href: "/customer/accounts" },
            { label: "Limits" },
          ]}
        />
      </motion.div>

      {isLoading ? (
        <StatsGridSkeleton count={2} />
      ) : (
        <>
          <DashCard
            padding="lg"
            className={`mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${
              isApproved
                ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30"
                : "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30"
            }`}
          >
            <div className="flex items-center gap-4">
              {isApproved ? (
                <div className="rounded-2xl bg-emerald-600 p-3.5 text-white shadow-sm">
                  <ShieldCheck size={26} />
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-500 p-3.5 text-white shadow-sm">
                  <ShieldAlert size={26} />
                </div>
              )}
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  KYC Verification Status: <span className="capitalize">{kycStatus}</span>
                </p>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                  {isApproved
                    ? "Your account is verified and enjoys maximum daily and monthly transfer limits."
                    : "Complete your identity verification to unlock higher daily and monthly limits."}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/80 px-5 py-3 text-right dark:bg-gray-900/70">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Zap size={13} className="text-blue-500" /> Max Per Transaction
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{fmt(perTransaction)}</p>
            </div>
          </DashCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashCard padding="lg">
              <h3 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                Daily Transaction Limits
              </h3>
              <div className="space-y-4">
                {daily && (
                  <>
                    <UsageBar
                      label="Daily Outbound Transfers"
                      band={daily.transfer}
                      icon={<ArrowUpRight size={18} className="text-blue-500" />}
                    />
                    <UsageBar
                      label="Daily Withdrawals"
                      band={daily.withdrawal}
                      icon={<ArrowDownLeft size={18} className="text-blue-500" />}
                    />
                  </>
                )}
              </div>
            </DashCard>

            <DashCard padding="lg">
              <h3 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                Monthly Transaction Limits
              </h3>
              <div className="space-y-4">
                {monthly && (
                  <>
                    <UsageBar
                      label="Monthly Outbound Transfers"
                      band={monthly.transfer}
                      icon={<ArrowUpRight size={18} className="text-blue-500" />}
                    />
                    <UsageBar
                      label="Monthly Withdrawals"
                      band={monthly.withdrawal}
                      icon={<ArrowDownLeft size={18} className="text-blue-500" />}
                    />
                  </>
                )}
              </div>
            </DashCard>
          </div>

          {walletLimits.length > 0 && (
            <DashCard padding="none" className="mt-8">
              <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  Per-Wallet Custom Limit Rules
                </h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {walletLimits.map((l: any, i: number) => (
                  <div key={l._id || i} className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-base font-medium capitalize text-gray-900 dark:text-white">
                        {l.limitType} · {l.category}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        Resets {l.resetDate ? new Date(l.resetDate).toLocaleDateString() : "Automatically"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                        {fmt(l.usedAmount || 0, l.currency)} / {fmt(l.amount, l.currency)}
                      </p>
                      <p className="mt-0.5 text-xs font-medium uppercase text-emerald-600 dark:text-emerald-400">
                        {l.isActive ? "Active Rule" : "Inactive"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DashCard>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default AccountLimits;
