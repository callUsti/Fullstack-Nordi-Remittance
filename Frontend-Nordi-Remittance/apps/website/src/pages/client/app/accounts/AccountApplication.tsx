// ============================================================================
// ACCOUNT APPLICATIONS — Client hub page for all Savings, Current & Fixed Deposit applications
// ============================================================================

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PiggyBank, Building2, Lock, ChevronRight, Clock, CheckCircle2, XCircle, FileText, Plus } from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { PageContainer, FilterPill, StatCard, StatsGrid, DashCard } from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants } from "@core/animation/Animation";
import { SHOW_APPLICATION_DEV_PREVIEW } from "@store/account.store";
import { ACCOUNT_TYPE_LABELS } from "@domain/types/Accounts.types";
import { useClientAccountApplications } from "../../client-usecase/useaccounts-client-usecase";
import { ApplicationStatusCard } from "../../components/application-status-card";

const fmt = (n: number, c = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c, minimumFractionDigits: 2 }).format(n);
  } catch {
    return `${c} ${(Number(n) || 0).toFixed(2)}`;
  }
};

const typeIcons: Record<AccountApplicationType, React.ReactNode> = {
  savings: <PiggyBank size={18} />,
  current: <Building2 size={18} />,
  fixed_deposit: <Lock size={18} />,
};

const typeRoutes: Record<AccountApplicationType, string> = {
  savings: "/customer/accounts/savings",
  current: "/customer/accounts/current",
  fixed_deposit: "/customer/accounts/fixed-deposits",
};

function fieldsFor(app: AccountApplication): Array<{ label: string; value: string }> {
  if (app.type === "savings") {
    return [
      { label: "Account Type", value: "Savings Account" },
      { label: "Currency", value: app.currency },
      { label: "Initial Deposit", value: fmt(app.initialDeposit, app.currency) },
      { label: "Savings Goal", value: app.goal || "General Savings" },
    ];
  }
  if (app.type === "current") {
    return [
      { label: "Account Type", value: "Current Account" },
      { label: "Purpose", value: app.purpose === "business" ? app.businessName || "Business" : "Personal" },
      { label: "Currency", value: app.currency },
      { label: "Overdraft", value: app.overdraftRequested ? "Requested ($5,000)" : "Standard" },
    ];
  }
  return [
    { label: "Account Type", value: "Fixed Deposit" },
    { label: "Principal", value: fmt(app.principal, app.currency) },
    { label: "Lock Term", value: `${app.termMonths} Months` },
    { label: "Locked Rate", value: `${app.interestRate}% p.a.` },
  ];
}

const AccountApplications: React.FC = () => {
  const navigate = useNavigate();
  const { applications = [] } = useClientAccountApplications();
  const [statusFilter, setStatusFilter] = useState<"all" | AccountApplicationStatus>("all");

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    }),
    [applications],
  );

  const filtered = useMemo(
    () => (statusFilter === "all" ? applications : applications.filter((a) => a.status === statusFilter)),
    [applications, statusFilter],
  );

  return (
    <PageContainer>
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="Account Applications"
          subtitle="Apply for new bank accounts and track every Savings, Current, and Fixed Deposit application"
          breadcrumbs={[
            { label: "Dashboard", href: "/customer/dashboard" },
            { label: "Accounts", href: "/customer/accounts" },
            { label: "Applications" },
          ]}
        />
      </motion.div>

      <StatsGrid cols={4}>
        <StatCard
          label="Total Applications"
          value={String(stats.total)}
          icon={<FileText size={22} />}
          iconColor="bg-blue-600"
        />
        <StatCard
          label="Pending Review"
          value={String(stats.pending)}
          icon={<Clock size={22} />}
          iconColor="bg-amber-600"
        />
        <StatCard
          label="Approved & Opened"
          value={String(stats.approved)}
          icon={<CheckCircle2 size={22} />}
          iconColor="bg-emerald-600"
        />
        <StatCard
          label="Declined"
          value={String(stats.rejected)}
          icon={<XCircle size={22} />}
          iconColor="bg-rose-600"
        />
      </StatsGrid>

      {/* Quick Apply Cards for All 3 Bank Account Types */}
      <DashCard padding="lg" className="mb-8">
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          Apply for a New Bank Account
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            onClick={() => navigate("/customer/accounts/savings")}
            className="group cursor-pointer rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-5 transition-all hover:border-emerald-500 hover:shadow-md dark:bg-emerald-950/20"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-emerald-600 p-3 text-white shadow-sm">
                <PiggyBank size={22} />
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                4.25% APY
              </span>
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">Savings Account</h4>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Goal-based savings with daily interest calculation and optional auto-save.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Plus size={16} /> Apply Now <ChevronRight size={15} />
            </div>
          </div>

          <div
            onClick={() => navigate("/customer/accounts/current")}
            className="group cursor-pointer rounded-2xl border border-blue-500/20 bg-blue-50/50 p-5 transition-all hover:border-blue-500 hover:shadow-md dark:bg-blue-950/20"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-blue-600 p-3 text-white shadow-sm">
                <Building2 size={22} />
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Personal & Business
              </span>
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">Current Account</h4>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Everyday checking with high transaction limits and optional overdraft protection.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Plus size={16} /> Apply Now <ChevronRight size={15} />
            </div>
          </div>

          <div
            onClick={() => navigate("/customer/accounts/fixed-deposits")}
            className="group cursor-pointer rounded-2xl border border-amber-500/20 bg-amber-50/50 p-5 transition-all hover:border-amber-500 hover:shadow-md dark:bg-amber-950/20"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-amber-600 p-3 text-white shadow-sm">
                <Lock size={22} />
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Up to 6.5% p.a.
              </span>
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">Fixed Deposit</h4>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Lock in guaranteed yields over 3 to 36 months with automatic rollover options.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <Plus size={16} /> Apply Now <ChevronRight size={15} />
            </div>
          </div>
        </div>
      </DashCard>

      {/* Filter Tabs */}
      <motion.div className="mb-6 flex gap-2.5 overflow-x-auto pb-2" variants={dashboardItemVariants}>
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <FilterPill
            key={s}
            label={`${s.charAt(0).toUpperCase() + s.slice(1)} (${s === "all" ? stats.total : stats[s]})`}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </motion.div>

      {applications.length === 0 ? (
        <EmptyState
          title="No Applications Submitted Yet"
          description="Select one of the account products above to apply for a Savings, Current, or Fixed Deposit account."
          action={{ label: "Apply for Savings Account", onClick: () => navigate("/customer/accounts/savings") }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No Matching Applications" description={`You have no ${statusFilter} applications.`} />
      ) : (
        <div className="space-y-5">
          {filtered.map((app) => (
            <div key={app.id}>
              <button
                onClick={() => navigate(typeRoutes[app.type])}
                className="mb-2.5 flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                {typeIcons[app.type]}
                {ACCOUNT_TYPE_LABELS[app.type]}
                {app.nickname ? ` · ${app.nickname}` : ""}
                <ChevronRight size={15} />
              </button>
              <ApplicationStatusCard
                application={app}
                fields={fieldsFor(app)}
                showDevPreview={SHOW_APPLICATION_DEV_PREVIEW}
              />
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default AccountApplications;
