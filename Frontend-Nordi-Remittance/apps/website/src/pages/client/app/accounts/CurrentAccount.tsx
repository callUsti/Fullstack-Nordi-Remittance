// ============================================================================
// CURRENT ACCOUNT — Client Current Accounts & Applications (Spacious UI)
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, Repeat, ShieldCheck, TrendingUp, Plus, X, ArrowUpRight, ChevronRight, Loader2 } from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { PageContainer, DashCard, StatCard, StatsGrid, StatusBadge } from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { SHOW_APPLICATION_DEV_PREVIEW } from "@store/account.store";
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
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors";
const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

const ApplyForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { mutate: applyForCurrent, isPending } = useApplyForAccount();
  const [form, setForm] = useState({
    nickname: "",
    currency: "USD",
    purpose: "personal" as "personal" | "business",
    businessName: "",
    expectedMonthlyVolume: "",
    overdraftRequested: false,
  });

  const canSubmit = form.purpose === "personal" || form.businessName.trim() !== "";

  const submit = () => {
    applyForCurrent(
      {
        type: "current",
        currency: form.currency,
        nickname: form.nickname || undefined,
        purpose: form.purpose,
        businessName: form.purpose === "business" ? form.businessName : undefined,
        expectedMonthlyVolume: Number(form.expectedMonthlyVolume) || undefined,
        overdraftRequested: form.overdraftRequested,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <DashCard padding="lg" className="mb-8 border-blue-500/30">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
            Apply for a Current Account
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            High-limit everyday checking for personal or registered business operations
          </p>
        </div>
        <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={20} />
        </button>
      </div>
      <div className="space-y-5">
        <div>
          <label className={labelCls}>Account Purpose</label>
          <div className="grid grid-cols-2 gap-4">
            {(["personal", "business"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, purpose: p }))}
                className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-all sm:text-base ${
                  form.purpose === p
                    ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-400"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {p} Current Account
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Account Nickname (optional)</label>
            <input
              className={inputCls}
              placeholder="e.g. Daily Checking, Payroll Account"
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

        {form.purpose === "business" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Registered Business Name</label>
              <input
                className={inputCls}
                placeholder="Registered company or entity name"
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Expected Monthly Volume ({form.currency})</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                placeholder="0.00"
                value={form.expectedMonthlyVolume}
                onChange={(e) => setForm((f) => ({ ...f, expectedMonthlyVolume: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
              Request Overdraft Protection ($5,000 Limit)
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              Allows your current account to cover approved payments beyond your available balance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, overdraftRequested: !f.overdraftRequested }))}
            className={`h-7 w-12 shrink-0 rounded-full transition-colors ${form.overdraftRequested ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            <span
              className={`block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${form.overdraftRequested ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50 sm:text-base"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {isPending ? "Submitting Application..." : "Submit Current Account Application"}
        </button>
      </div>
    </DashCard>
  );
};

const CurrentAccount: React.FC = () => {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const { wallets = [] } = useClientWallets();
  const { applications: allApplications = [] } = useClientAccountApplications();
  const currentWallets = wallets.filter((w) => w.type === "current" && !w.isApplicationOnly);
  const applications = allApplications.filter((a) => a.type === "current");
  const approved = applications.filter((a) => a.status === "approved");

  const totalCurrentBalance = currentWallets.reduce(
    (sum, w) => sum + (w.rawTotalBalance || w.primaryCurrencyBalance || 0),
    0,
  );
  const activeCount = Math.max(currentWallets.length, approved.length);
  const overdraftCount = Math.max(
    currentWallets.filter((w) => w.overdraftRequested).length,
    approved.filter((a) => a.type === "current" && a.overdraftRequested).length,
  );

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Current Accounts"
          subtitle="Manage your everyday banking, high-volume wires, and business transactions"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Accounts", href: "/customer/accounts" },
            { label: "Current" },
          ]}
          actions={
            !applying && (
              <button
                onClick={() => setApplying(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-md transition-all hover:opacity-95"
              >
                <Plus size={18} /> Apply for Current Account
              </button>
            )
          }
        />
      </motion.div>

      {applying && <ApplyForm onClose={() => setApplying(false)} />}

      <StatsGrid cols={3}>
        <StatCard
          label="Total Current Balance"
          value={fmt(totalCurrentBalance)}
          icon={<Building2 size={22} />}
          iconColor="bg-blue-600"
        />
        <StatCard
          label="Active Current Accounts"
          value={String(activeCount)}
          icon={<ShieldCheck size={22} />}
          iconColor="bg-amber-600"
        />
        <StatCard
          label="Overdraft Enabled"
          value={String(overdraftCount)}
          icon={<TrendingUp size={22} />}
          iconColor="bg-blue-600"
        />
      </StatsGrid>

      {/* Active Current Accounts */}
      {currentWallets.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-base font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Your Active Current Accounts ({currentWallets.length})
          </h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {currentWallets.map((wallet) => (
              <DashCard key={wallet.id} className="overflow-hidden border-blue-500/25" padding="none" hover>
                <div className="p-6 sm:p-7">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="rounded-2xl bg-blue-600 p-3.5 text-white shadow-md">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
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

                  <div className="mb-5 rounded-2xl bg-blue-50/70 p-4 dark:bg-blue-950/30 sm:p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      Available Current Balance
                    </p>
                    <p className="mt-1.5 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                      {fmt(wallet.primaryCurrencyBalance, wallet.primaryCurrency)}
                    </p>
                  </div>

                  <div className="mb-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Purpose</p>
                      <p className="mt-1 truncate font-medium capitalize text-gray-900 dark:text-white">
                        {wallet.businessName || wallet.purpose || "Personal"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Overdraft</p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">
                        {wallet.overdraftRequested
                          ? wallet.overdraftLimit
                            ? fmt(wallet.overdraftLimit, wallet.primaryCurrency)
                            : "Enabled"
                          : "Standard"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Monthly Volume</p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">
                        {wallet.expectedMonthlyVolume
                          ? fmt(wallet.expectedMonthlyVolume, wallet.primaryCurrency)
                          : "Unlimited"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate("/customer/send/domestic")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      <ArrowUpRight size={16} /> Send Money
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

      <DashCard padding="lg" className="mb-8 mt-8">
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          Current Account Features
        </h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex gap-3.5 rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/40">
            <Repeat size={22} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Unlimited daily transfers and bill payments designed for frequent personal and commercial use.
            </p>
          </div>
          <div className="flex gap-3.5 rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/40">
            <TrendingUp size={22} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Optional overdraft line up to <strong className="text-gray-900 dark:text-white">$5,000</strong> upon
              application approval.
            </p>
          </div>
          <div className="flex gap-3.5 rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/40">
            <Building2 size={22} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Dedicated business naming and higher monthly transaction thresholds for corporate entities.
            </p>
          </div>
        </div>
      </DashCard>

      {applications.length === 0 && currentWallets.length === 0 && !applying ? (
        <EmptyState
          title="No Current Accounts Yet"
          description="Open a personal or business current account for your daily transactions."
          action={{ label: "Apply for Current Account", onClick: () => setApplying(true) }}
        />
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            Current Account Applications ({applications.length})
          </h3>
          {applications.map((app) =>
            app.type === "current" ? (
              <ApplicationStatusCard
                key={app.id}
                application={app}
                showDevPreview={SHOW_APPLICATION_DEV_PREVIEW}
                fields={[
                  { label: "Nickname", value: app.nickname || app.businessName || "Current Account" },
                  { label: "Purpose", value: app.purpose === "business" ? app.businessName || "Business" : "Personal" },
                  { label: "Currency", value: app.currency },
                  { label: "Overdraft", value: app.overdraftRequested ? "Requested" : "Standard" },
                ]}
              />
            ) : null,
          )}
        </div>
      ) : null}
    </PageContainer>
  );
};

export default CurrentAccount;
