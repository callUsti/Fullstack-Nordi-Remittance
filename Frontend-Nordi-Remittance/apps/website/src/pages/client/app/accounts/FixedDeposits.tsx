// ============================================================================
// FIXED DEPOSITS — Client Fixed Deposit Accounts & Applications (Spacious UI)
// ============================================================================

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Percent, Shield, Plus, X, Calendar, Repeat, ChevronRight, Loader2 } from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { PageContainer, DashCard, StatCard, StatsGrid, StatusBadge } from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { SHOW_APPLICATION_DEV_PREVIEW } from "@store/account.store";
import { FIXED_DEPOSIT_RATES } from "@domain/types/Accounts.types";
import {
  SUPPORTED_WALLET_CURRENCIES,
  useClientWallets,
  useClientAccountApplications,
  useApplyForAccount,
} from "../../client-usecase/useaccounts-client-usecase";
import { ApplicationStatusCard } from "../../components/application-status-card";

const fmt = (n: number, c = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c, minimumFractionDigits: 2 }).format(n);
  } catch {
    return `${c} ${(Number(n) || 0).toFixed(2)}`;
  }
};

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-colors";
const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

const TERM_OPTIONS: FixedDepositApplication["termMonths"][] = [3, 6, 12, 24, 36];

const ApplyForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { mutate: applyForFixedDeposit, isPending } = useApplyForAccount();
  const [form, setForm] = useState({
    nickname: "",
    currency: "USD",
    principal: "",
    termMonths: 12 as FixedDepositApplication["termMonths"],
    autoRenew: false,
  });

  const rate = FIXED_DEPOSIT_RATES[form.termMonths];
  const principalNum = Number(form.principal) || 0;
  const projectedInterest = useMemo(
    () => (principalNum * rate * form.termMonths) / (100 * 12),
    [principalNum, rate, form.termMonths],
  );
  const maturityDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + form.termMonths);
    return d;
  }, [form.termMonths]);

  const canSubmit = principalNum > 0;

  const submit = () => {
    applyForFixedDeposit(
      {
        type: "fixed_deposit",
        currency: form.currency,
        nickname: form.nickname || undefined,
        principal: principalNum,
        termMonths: form.termMonths,
        interestRate: rate,
        maturityDate: maturityDate.toISOString(),
        autoRenew: form.autoRenew,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <DashCard padding="lg" className="mb-8 border-amber-500/30">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">Open a Fixed Deposit</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Lock in a guaranteed high yield up to 6.5% p.a. over your chosen term
          </p>
        </div>
        <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={20} />
        </button>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Deposit Label / Nickname (optional)</label>
            <input
              className={inputCls}
              placeholder="e.g. 12-Month Treasury Lock"
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Deposit Currency</label>
            <select
              className={inputCls}
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            >
              {SUPPORTED_WALLET_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Principal Amount ({form.currency})</label>
          <input
            type="number"
            min={0}
            className={inputCls}
            placeholder="0.00"
            value={form.principal}
            onChange={(e) => setForm((f) => ({ ...f, principal: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelCls}>Lock-In Term Length</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {TERM_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, termMonths: t }))}
                className={`rounded-xl border px-3 py-3 text-center transition-all ${
                  form.termMonths === t
                    ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-400 dark:bg-amber-950/50 dark:text-amber-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <p className="text-sm font-semibold sm:text-base">{t} Months</p>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{FIXED_DEPOSIT_RATES[t]}% APY</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">Auto-Renew at Maturity</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              Automatically roll principal and earned interest into a new term upon maturity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, autoRenew: !f.autoRenew }))}
            className={`h-7 w-12 shrink-0 rounded-full transition-colors ${form.autoRenew ? "bg-amber-500" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            <span
              className={`block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${form.autoRenew ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {/* Live projection */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            Projected Maturity Summary
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/80 p-3.5 dark:bg-gray-900/60">
              <p className="text-xs font-medium uppercase text-amber-700/80 dark:text-amber-400">Guaranteed Rate</p>
              <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">{rate}% p.a.</p>
            </div>
            <div className="rounded-xl bg-white/80 p-3.5 dark:bg-gray-900/60">
              <p className="text-xs font-medium uppercase text-amber-700/80 dark:text-amber-400">Projected Interest</p>
              <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                +{fmt(projectedInterest, form.currency)}
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-3.5 dark:bg-gray-900/60">
              <p className="text-xs font-medium uppercase text-amber-700/80 dark:text-amber-400">Maturity Date</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {maturityDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50 sm:text-base"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {isPending ? "Submitting Application..." : "Submit Fixed Deposit Application"}
        </button>
      </div>
    </DashCard>
  );
};

const FixedDeposits: React.FC = () => {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const { wallets = [] } = useClientWallets();
  const { applications: allApplications = [] } = useClientAccountApplications();
  const fixedWallets = wallets.filter((w) => w.type === "fixed_deposit" && !w.isApplicationOnly);
  const applications = allApplications.filter((a) => a.type === "fixed_deposit") as FixedDepositApplication[];
  const approved = applications.filter((a) => a.status === "approved");

  const totalFixedBalance =
    fixedWallets.length > 0
      ? fixedWallets.reduce((sum, w) => sum + (w.rawTotalBalance || w.primaryCurrencyBalance || w.principal || 0), 0)
      : approved.reduce((s, a) => s + a.principal, 0);

  const avgRate =
    fixedWallets.length > 0
      ? fixedWallets.reduce((s, w) => s + (w.interestRate || 6.0), 0) / fixedWallets.length
      : approved.length > 0
        ? approved.reduce((s, a) => s + a.interestRate, 0) / approved.length
        : 6.0;

  const activeCount = Math.max(fixedWallets.length, approved.length);

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Fixed Deposits"
          subtitle="Lock in a high interest rate and earn guaranteed returns over a fixed term"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Accounts", href: "/customer/accounts" },
            { label: "Fixed Deposits" },
          ]}
          actions={
            !applying && (
              <button
                onClick={() => setApplying(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-medium text-white shadow-md transition-all hover:opacity-95"
              >
                <Plus size={18} /> Open Fixed Deposit
              </button>
            )
          }
        />
      </motion.div>

      {applying && <ApplyForm onClose={() => setApplying(false)} />}

      <StatsGrid cols={3}>
        <StatCard
          label="Total Fixed Deposits"
          value={fmt(totalFixedBalance)}
          icon={<Lock size={22} />}
          iconColor="bg-amber-600"
        />
        <StatCard
          label="Average Locked Rate"
          value={`${avgRate.toFixed(2)}% p.a.`}
          icon={<Percent size={22} />}
          iconColor="bg-emerald-600"
        />
        <StatCard
          label="Active Term Deposits"
          value={String(activeCount)}
          icon={<Shield size={22} />}
          iconColor="bg-blue-600"
        />
      </StatsGrid>

      {/* Active Fixed Deposit Wallets */}
      {fixedWallets.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-base font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Your Active Fixed Deposits ({fixedWallets.length})
          </h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {fixedWallets.map((wallet) => (
              <DashCard key={wallet.id} className="overflow-hidden border-amber-500/25" padding="none" hover>
                <div className="p-6 sm:p-7">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="rounded-2xl bg-amber-600 p-3.5 text-white shadow-md">
                        <Lock size={24} />
                      </div>
                      <div>
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          {wallet.typeLabel}
                        </span>
                        <h4 className="mt-1.5 text-xl font-semibold text-gray-900 dark:text-white">
                          {wallet.displayName}
                        </h4>
                        <p className="font-mono text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                          Acct •••• {wallet.walletNumber.slice(-4)} · {wallet.primaryCurrency}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={wallet.status} />
                  </div>

                  <div className="mb-5 rounded-2xl bg-amber-50/70 p-4 dark:bg-amber-950/30 sm:p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Locked Principal Balance
                    </p>
                    <p className="mt-1.5 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                      {fmt(wallet.primaryCurrencyBalance || wallet.principal || 0, wallet.primaryCurrency)}
                    </p>
                  </div>

                  <div className="mb-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        <Percent size={13} className="text-amber-500" /> Rate
                      </p>
                      <p className="mt-1 font-medium text-amber-600 dark:text-amber-400">
                        {wallet.interestRate ?? 6.0}% p.a.
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        <Calendar size={13} className="text-amber-500" /> Term
                      </p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">
                        {wallet.termMonths ? `${wallet.termMonths} mos` : "12 mos"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Matures</p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">
                        {wallet.maturityDate ? new Date(wallet.maturityDate).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        <Repeat size={13} className="text-amber-500" /> Rollover
                      </p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">
                        {wallet.autoRenew ? "Auto-Renew" : "Manual"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/customer/accounts/${wallet.id}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
                  >
                    View Deposit Certificate & Ledger <ChevronRight size={16} />
                  </button>
                </div>
              </DashCard>
            ))}
          </div>
        </div>
      )}

      <DashCard padding="lg" className="mb-8 mt-8">
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          Guaranteed Fixed Deposit Yields by Term
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {TERM_OPTIONS.map((t) => (
            <div
              key={t}
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 text-center dark:border-gray-700 dark:bg-gray-800/40"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t} Months
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {FIXED_DEPOSIT_RATES[t]}%
              </p>
              <p className="mt-0.5 text-xs text-gray-400">per annum</p>
            </div>
          ))}
        </div>
      </DashCard>

      {applications.length === 0 && fixedWallets.length === 0 && !applying ? (
        <EmptyState
          title="No Fixed Deposits Yet"
          description="Lock in a guaranteed rate with a fixed deposit. Choose your term and earn predictable returns."
          action={{ label: "Open Fixed Deposit", onClick: () => setApplying(true) }}
        />
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Fixed Deposit Applications ({applications.length})
          </h3>
          {applications.map((app) => (
            <ApplicationStatusCard
              key={app.id}
              application={app}
              showDevPreview={SHOW_APPLICATION_DEV_PREVIEW}
              fields={[
                { label: "Nickname", value: app.nickname || "Fixed Deposit" },
                { label: "Principal", value: fmt(app.principal, app.currency) },
                { label: "Term", value: `${app.termMonths} Months` },
                { label: "Locked Rate", value: `${app.interestRate}% p.a.` },
              ]}
            />
          ))}
        </div>
      ) : null}
    </PageContainer>
  );
};

export default FixedDeposits;
