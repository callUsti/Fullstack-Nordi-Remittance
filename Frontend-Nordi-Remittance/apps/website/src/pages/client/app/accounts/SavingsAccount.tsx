// ============================================================================
// SAVINGS ACCOUNT — Client Savings Accounts & Applications (Spacious UI)
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  PiggyBank,
  Percent,
  ShieldCheck,
  Repeat,
  Plus,
  X,
  Target,
  ArrowUpRight,
  ChevronRight,
  Loader2,
} from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { PageContainer, DashCard, StatCard, StatsGrid, StatusBadge } from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { SHOW_APPLICATION_DEV_PREVIEW } from "@store/account.store";
import { SAVINGS_INTEREST_RATE } from "../../../../domain/types/Accounts.types";
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
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition-colors";
const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

const ApplyForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { mutate: applyForSavings, isPending } = useApplyForAccount();
  const [form, setForm] = useState({
    nickname: "",
    currency: "USD",
    initialDeposit: "",
    goal: "",
    autoSave: false,
    autoSaveAmount: "",
  });

  const canSubmit = Number(form.initialDeposit) > 0;

  const submit = () => {
    applyForSavings(
      {
        type: "savings",
        currency: form.currency,
        nickname: form.nickname || undefined,
        initialDeposit: Number(form.initialDeposit) || 0,
        goal: form.goal || undefined,
        autoSave: form.autoSave,
        autoSaveAmount: form.autoSave ? Number(form.autoSaveAmount) || undefined : undefined,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <DashCard padding="lg" className="mb-8 border-emerald-500/30">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
            Apply for a Savings Account
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Earn {SAVINGS_INTEREST_RATE}% APY with goal tracking and optional automated deposits
          </p>
        </div>
        <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={20} />
        </button>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Account Nickname (optional)</label>
            <input
              className={inputCls}
              placeholder="e.g. Rainy Day Fund, Home Downpayment"
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Account Currency</label>
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Initial Deposit Amount</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              placeholder="0.00"
              value={form.initialDeposit}
              onChange={(e) => setForm((f) => ({ ...f, initialDeposit: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Savings Goal (optional)</label>
            <input
              className={inputCls}
              placeholder="e.g. Emergency fund, new car, tuition"
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">Enable Recurring Auto-Save</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              Automatically transfer a fixed amount into this savings account periodically once opened.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, autoSave: !f.autoSave }))}
            className={`h-7 w-12 shrink-0 rounded-full transition-colors ${form.autoSave ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            <span
              className={`block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${form.autoSave ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {form.autoSave && (
          <div>
            <label className={labelCls}>Auto-Save Periodic Amount ({form.currency})</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              placeholder="0.00"
              value={form.autoSaveAmount}
              onChange={(e) => setForm((f) => ({ ...f, autoSaveAmount: e.target.value }))}
            />
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50 sm:text-base"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {isPending ? "Submitting Application..." : "Submit Savings Application"}
        </button>
      </div>
    </DashCard>
  );
};

const SavingsAccount: React.FC = () => {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const { wallets = [] } = useClientWallets();
  const { applications: allApplications = [] } = useClientAccountApplications();
  const savingsWallets = wallets.filter((w) => w.type === "savings" && !w.isApplicationOnly);
  const applications = allApplications.filter((a) => a.type === "savings");
  const approved = applications.filter((a) => a.status === "approved");

  const totalSavedBalance =
    savingsWallets.length > 0
      ? savingsWallets.reduce((sum, w) => sum + (w.rawTotalBalance || w.primaryCurrencyBalance || 0), 0)
      : approved.reduce((s, a) => s + (a.type === "savings" ? a.initialDeposit : 0), 0);

  const activeCount = Math.max(savingsWallets.length, approved.length);

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Savings Accounts"
          subtitle="Grow your money with competitive interest rates and goal-based savings"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Accounts", href: "/customer/accounts" },
            { label: "Savings" },
          ]}
          actions={
            !applying && (
              <button
                onClick={() => setApplying(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-md transition-all hover:opacity-95"
              >
                <Plus size={18} /> Apply for Savings Account
              </button>
            )
          }
        />
      </motion.div>

      {applying && <ApplyForm onClose={() => setApplying(false)} />}

      <StatsGrid cols={3}>
        <StatCard
          label="Total Saved Balance"
          value={fmt(totalSavedBalance)}
          icon={<PiggyBank size={22} />}
          iconColor="bg-emerald-600"
        />
        <StatCard
          label="Annual Interest Rate"
          value={`${SAVINGS_INTEREST_RATE}% p.a.`}
          icon={<Percent size={22} />}
          iconColor="bg-blue-600"
        />
        <StatCard
          label="Active Savings Accounts"
          value={String(activeCount)}
          icon={<ShieldCheck size={22} />}
          iconColor="bg-amber-600"
        />
      </StatsGrid>

      {/* Active Savings Wallets */}
      {savingsWallets.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-base font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Your Active Savings Accounts ({savingsWallets.length})
          </h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {savingsWallets.map((wallet) => (
              <DashCard key={wallet.id} className="overflow-hidden border-emerald-500/25" padding="none" hover>
                <div className="p-6 sm:p-7">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="rounded-2xl bg-emerald-600 p-3.5 text-white shadow-md">
                        <PiggyBank size={24} />
                      </div>
                      <div>
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
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

                  <div className="mb-5 rounded-2xl bg-emerald-50/70 p-4 dark:bg-emerald-950/30 sm:p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Available Savings Balance
                    </p>
                    <p className="mt-1.5 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                      {fmt(wallet.primaryCurrencyBalance, wallet.primaryCurrency)}
                    </p>
                  </div>

                  <div className="mb-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        <Target size={13} className="text-emerald-500" /> Goal
                      </p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">{wallet.goal || "General Savings"}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        <Percent size={13} className="text-emerald-500" /> APY Rate
                      </p>
                      <p className="mt-1 font-medium text-emerald-600 dark:text-emerald-400">
                        {wallet.interestRate ?? SAVINGS_INTEREST_RATE}% p.a.
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        <Repeat size={13} className="text-emerald-500" /> Auto-Save
                      </p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">
                        {wallet.autoSave
                          ? wallet.autoSaveAmount
                            ? fmt(wallet.autoSaveAmount, wallet.primaryCurrency)
                            : "Enabled"
                          : "Off"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate("/customer/send/domestic")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                    >
                      <ArrowUpRight size={16} /> Transfer Funds
                    </button>
                    <button
                      onClick={() => navigate(`/customer/accounts/${wallet.id}`)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      Account Ledger <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </DashCard>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <DashCard padding="lg" className="mb-8 mt-8">
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          Savings Account Benefits
        </h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex gap-3.5 rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/40">
            <Percent size={22} className="mt-0.5 shrink-0 text-emerald-500" />
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Earns <strong className="text-gray-900 dark:text-white">{SAVINGS_INTEREST_RATE}% APY</strong>, calculated
              daily on your closing balance and paid out monthly.
            </p>
          </div>
          <div className="flex gap-3.5 rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/40">
            <Repeat size={22} className="mt-0.5 shrink-0 text-emerald-500" />
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Flexible goal-based savings with automated recurring transfers from your primary wallet.
            </p>
          </div>
          <div className="flex gap-3.5 rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/40">
            <ShieldCheck size={22} className="mt-0.5 shrink-0 text-emerald-500" />
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Zero monthly maintenance fees and no minimum balance required to keep your account active.
            </p>
          </div>
        </div>
      </DashCard>

      {applications.length === 0 && savingsWallets.length === 0 && !applying ? (
        <EmptyState
          title="No Savings Accounts Yet"
          description="Open a high-yield savings account to start earning interest on your deposits."
          action={{ label: "Apply for Savings Account", onClick: () => setApplying(true) }}
        />
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Savings Account Applications ({applications.length})
          </h3>
          {applications.map((app) =>
            app.type === "savings" ? (
              <ApplicationStatusCard
                key={app.id}
                application={app}
                showDevPreview={SHOW_APPLICATION_DEV_PREVIEW}
                fields={[
                  { label: "Nickname", value: app.nickname || "Savings Account" },
                  { label: "Currency", value: app.currency },
                  { label: "Initial Deposit", value: fmt(app.initialDeposit, app.currency) },
                  { label: "Savings Goal", value: app.goal || "General Savings" },
                ]}
              />
            ) : null,
          )}
        </div>
      ) : null}
    </PageContainer>
  );
};

export default SavingsAccount;
