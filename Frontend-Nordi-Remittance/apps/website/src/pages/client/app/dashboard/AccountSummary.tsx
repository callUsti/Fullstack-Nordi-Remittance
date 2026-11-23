// ============================================================================
// ACCOUNT SUMMARY PANEL — Client Dashboard Top Section
// Modern Pinterest-Gallery / Bento Style with Bold Oversized Typography
// Displays Total Balances across all accounts + Savings, Current, Fixed Deposits
// and Wallets with full AccountApplication identifying variables.
// ============================================================================

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Eye,
  EyeOff,
  PiggyBank,
  Building2,
  Lock,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Plus,
  Star,
  Calendar,
  Percent,
  Target,
  ShieldCheck,
  Repeat,
  ChevronRight,
  Layers,
} from "lucide-react";
import { StatsGridSkeleton } from "@components/skeletons/Skeletons";
import { DashCard } from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants, cardRevealVariants } from "@core/animation/Animation";
import { useUIStore } from "@store/ui.store";

interface Props {
  data: AccountSummaryData;
  isLoading: boolean;
}

type CategoryFilter = "all" | "savings" | "current" | "fixed_deposit" | "personal";

const TYPE_META: Record<
  string,
  {
    label: string;
    badgeBg: string;
    accentBorder: string;
    gradientBar: string;
    iconBg: string;
    icon: React.ReactNode;
    route: string;
  }
> = {
  savings: {
    label: "Savings Account",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
    accentBorder: "hover:border-emerald-500/60 dark:hover:border-emerald-500/50",
    gradientBar: "from-emerald-500 via-teal-500 to-cyan-500",
    iconBg: "bg-emerald-600 text-white",
    icon: <PiggyBank size={20} />,
    route: "/customer/accounts/savings",
  },
  current: {
    label: "Current Account",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30",
    accentBorder: "hover:border-blue-500/60 dark:hover:border-blue-500/50",
    gradientBar: "from-blue-500 via-blue-500 to-blue-500",
    iconBg: "bg-blue-600 text-white",
    icon: <Building2 size={20} />,
    route: "/customer/accounts/current",
  },
  fixed_deposit: {
    label: "Fixed Deposit",
    badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
    accentBorder: "hover:border-amber-500/60 dark:hover:border-amber-500/50",
    gradientBar: "from-amber-500 via-orange-500 to-yellow-500",
    iconBg: "bg-amber-600 text-white",
    icon: <Lock size={20} />,
    route: "/customer/accounts/fixed-deposits",
  },
  business: {
    label: "Business Wallet",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30",
    accentBorder: "hover:border-blue-500/60 dark:hover:border-blue-500/50",
    gradientBar: "from-blue-500 via-rose-500 to-blue-500",
    iconBg: "bg-rose-600 text-white",
    icon: <Briefcase size={20} />,
    route: "/customer/accounts",
  },
  personal: {
    label: "Personal Wallet",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30",
    accentBorder: "hover:border-blue-500/60 dark:hover:border-blue-500/50",
    gradientBar: "from-blue-500 via-blue-500 to-blue-600",
    iconBg: "bg-blue-600 text-white",
    icon: <Wallet size={20} />,
    route: "/customer/accounts",
  },
};

const AccountSummaryPanel: React.FC<Props> = ({ data, isLoading }) => {
  const navigate = useNavigate();
  const showBalances = useUIStore((s) => s.preferences.showBalances);
  const [localShow, setLocalShow] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const showBalance = showBalances && localShow;

  const {
    totalBalance = 0,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    savingsBalance = 0,
    savingsCount = 0,
    currentBalance = 0,
    currentCount = 0,
    fixedDepositBalance = 0,
    fixedDepositCount = 0,
    wallets = [],
  } = data;

  const formatMoney = (v: number, currency = "USD") => {
    if (!showBalance) return "••••••";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(v) || 0);
    } catch {
      return `$${(Number(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  // Compute totals directly from wallets if any sub-total wasn't pre-populated
  const computedTotals = useMemo(() => {
    const sav = wallets.filter((w) => w.type === "savings");
    const cur = wallets.filter((w) => w.type === "current" || w.type === "personal" || w.type === "business");
    const fd = wallets.filter((w) => w.type === "fixed_deposit");

    const savSum = savingsBalance || sav.reduce((s, w) => s + (Number(w.balance) || 0), 0);
    const curSum = currentBalance || cur.reduce((s, w) => s + (Number(w.balance) || 0), 0);
    const fdSum = fixedDepositBalance || fd.reduce((s, w) => s + (Number(w.balance) || 0), 0);
    const grandTotal = Math.max(totalBalance, savSum + curSum + fdSum);

    return {
      grandTotal,
      savSum,
      savCount: savingsCount || sav.length,
      curSum,
      curCount: currentCount || cur.length,
      fdSum,
      fdCount: fixedDepositCount || fd.length,
    };
  }, [wallets, totalBalance, savingsBalance, savingsCount, currentBalance, currentCount, fixedDepositBalance, fixedDepositCount]);

  const filteredWallets = useMemo(() => {
    if (activeFilter === "all") return wallets;
    if (activeFilter === "personal") {
      return wallets.filter((w) => w.type === "personal" || w.type === "business");
    }
    return wallets.filter((w) => w.type === activeFilter);
  }, [wallets, activeFilter]);

  if (isLoading) return <StatsGridSkeleton count={4} />;

  return (
    <motion.div variants={dashboardItemVariants} className="space-y-6">
      {/* =====================================================================
          1. FOUR BOLD HERO TOTAL CARDS — Entire Amount Across All Accounts
          ===================================================================== */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 touch-pan-x scrollbar-hide xl:grid xl:grid-cols-4 xl:gap-4 xl:overflow-visible xl:pb-0">
        {/* Card 1: Total Portfolio Balance across ALL accounts */}
        <motion.div
          variants={cardRevealVariants}
          custom={0}
          whileHover={{ y: -3 }}
          onClick={() => navigate("/customer/accounts")}
          className="group relative min-w-[82%] shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-600 p-5 text-white transition-all sm:min-w-[47%] sm:p-6 xl:min-w-0 xl:shrink"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-blue-100 backdrop-blur-sm">
              <Layers size={12} /> Total Balance
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLocalShow(!localShow);
              }}
              className="rounded-xl bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
              title={showBalance ? "Hide balances" : "Show balances"}
            >
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <p className="truncate font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {formatMoney(computedTotals.grandTotal)}
          </p>
          <p className="mt-1 text-xs font-medium text-blue-100/90">
            Combined across all {wallets.length} active {wallets.length === 1 ? "account" : "accounts"}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/15 pt-3 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/20 px-2 py-0.5 text-emerald-200">
              <ArrowDownLeft size={12} /> In: {formatMoney(monthlyIncome)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-400/20 px-2 py-0.5 text-rose-200">
              <ArrowUpRight size={12} /> Out: {formatMoney(monthlyExpenses)}
            </span>
          </div>
        </motion.div>

        {/* Card 2: Current & Everyday Wallets Total */}
        <motion.div
          variants={cardRevealVariants}
          custom={1}
          whileHover={{ y: -3 }}
          onClick={() => navigate("/customer/accounts/current")}
          className="group relative min-w-[82%] shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500/60 sm:min-w-[47%] sm:p-6 xl:min-w-0 xl:shrink"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              <Building2 size={12} /> Current & Wallets
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <CreditCard size={18} />
            </div>
          </div>

          <p className="truncate font-mono text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {formatMoney(computedTotals.curSum)}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {computedTotals.curCount} {computedTotals.curCount === 1 ? "account" : "accounts"} · Everyday & Business
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
            <span className="font-medium text-gray-500 dark:text-gray-400">
              30d Inflow:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">{formatMoney(monthlyIncome)}</strong>
            </span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform dark:text-blue-400">
              View <ChevronRight size={14} />
            </span>
          </div>
        </motion.div>

        {/* Card 3: Savings Accounts Total */}
        <motion.div
          variants={cardRevealVariants}
          custom={2}
          whileHover={{ y: -3 }}
          onClick={() => navigate("/customer/accounts/savings")}
          className="group relative min-w-[82%] shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-emerald-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-500/60 sm:min-w-[47%] sm:p-6 xl:min-w-0 xl:shrink"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <PiggyBank size={12} /> Savings Total
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>

          <p className="truncate font-mono text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {formatMoney(computedTotals.savSum)}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {computedTotals.savCount} {computedTotals.savCount === 1 ? "savings account" : "savings accounts"} · 2.75%
            p.a.
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Goal-based & Auto-save
            </span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform dark:text-emerald-400">
              Savings <ChevronRight size={14} />
            </span>
          </div>
        </motion.div>

        {/* Card 4: Fixed Deposits Total & Active Accounts */}
        <motion.div
          variants={cardRevealVariants}
          custom={3}
          whileHover={{ y: -3 }}
          onClick={() => navigate("/customer/accounts/fixed-deposits")}
          className="group relative min-w-[82%] shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-amber-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-amber-500/60 sm:min-w-[47%] sm:p-6 xl:min-w-0 xl:shrink"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
              <Lock size={12} /> Fixed Deposits
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Percent size={18} />
            </div>
          </div>

          <p className="truncate font-mono text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {formatMoney(computedTotals.fdSum)}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {computedTotals.fdCount} {computedTotals.fdCount === 1 ? "locked deposit" : "locked deposits"} · Up to 6.1%
            APY
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Total Accounts: <strong className="text-gray-900 dark:text-white">{wallets.length}</strong>
            </span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform dark:text-amber-400">
              Deposits <ChevronRight size={14} />
            </span>
          </div>
        </motion.div>
      </div>

      {/* =====================================================================
          2. PINTEREST-STYLE MODERN GALLERY — All User Accounts & Sub-Links
          ===================================================================== */}
      <DashCard className="overflow-hidden !p-5 sm:!p-6">
        {/* Header + Filter Pills + Sub-Link Shortcuts */}
        <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                My Accounts Portfolio
              </h2>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                {wallets.length} {wallets.length === 1 ? "Account" : "Accounts"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              Personal wallets, Savings, Current, and Fixed Deposit accounts — identified by nickname, purpose, goal &
              term
            </p>
          </div>

          {/* Sub-links quick navigation bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/customer/accounts/savings")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/80"
            >
              <PiggyBank size={14} /> Savings
            </button>
            <button
              onClick={() => navigate("/customer/accounts/current")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/80"
            >
              <Building2 size={14} /> Current
            </button>
            <button
              onClick={() => navigate("/customer/accounts/fixed-deposits")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/80"
            >
              <Lock size={14} /> Fixed Deposits
            </button>
            <button
              onClick={() => navigate("/customer/accounts/applications")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/80"
            >
              <Sparkles size={14} /> Applications
            </button>
            <button
              onClick={() => navigate("/customer/accounts")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <Plus size={14} /> All Accounts
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {(
            [
              { id: "all", label: `All Accounts (${wallets.length})` },
              { id: "personal", label: `Wallets (${wallets.filter((w) => w.type === "personal" || w.type === "business").length})` },
              { id: "savings", label: `Savings (${computedTotals.savCount})` },
              { id: "current", label: `Current (${wallets.filter((w) => w.type === "current").length})` },
              { id: "fixed_deposit", label: `Fixed Deposits (${computedTotals.fdCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all sm:text-sm ${
                activeFilter === tab.id
                  ? "bg-blue-600 text-white dark:bg-blue-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pinterest Masonry / Bento Grid */}
        {filteredWallets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-gray-800">
            <p className="text-base font-medium text-gray-900 dark:text-white">
              No {activeFilter === "all" ? "" : activeFilter.replace("_", " ")} accounts found yet
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              Open a Savings, Current, or Fixed Deposit account in seconds.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => navigate("/customer/accounts/savings")}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                + Open Savings
              </button>
              <button
                onClick={() => navigate("/customer/accounts/current")}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                + Open Current
              </button>
              <button
                onClick={() => navigate("/customer/accounts/fixed-deposits")}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700"
              >
                + Open Fixed Deposit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 touch-pan-x scrollbar-hide sm:block sm:columns-2 sm:space-y-4 sm:overflow-visible sm:pb-0 xl:columns-3">
            <AnimatePresence mode="popLayout">
              {filteredWallets.map((wallet, index) => {
                const meta = TYPE_META[wallet.type] || TYPE_META.personal;
                const acctLast4 = String(wallet.accountNumber || "0000").slice(-4);
                const targetRoute = wallet.isApplicationOnly
                  ? meta.route
                  : wallet.type === "savings" || wallet.type === "current" || wallet.type === "fixed_deposit"
                    ? `/customer/accounts/${wallet.id}`
                    : `/customer/accounts/${wallet.id}`;

                return (
                  <motion.div
                    key={wallet.id || index}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    onClick={() => navigate(targetRoute)}
                    className={`group relative min-w-[84%] shrink-0 snap-start break-inside-avoid cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 transition-all duration-200 dark:border-gray-800 dark:bg-gray-900/90 sm:min-w-0 ${meta.accentBorder}`}
                  >
                    {/* Top Gradient Accent Bar */}
                    <div className={`h-2 w-full ${meta.gradientBar}`} />

                    <div className="p-5">
                      {/* Top Row: Category Badge + Status/Primary */}
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.badgeBg}`}>
                          {meta.icon}
                          {wallet.typeLabel || meta.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {wallet.isPrimary && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-300">
                              <Star size={11} className="fill-current" /> Primary
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                              wallet.status === "active" || wallet.status === "approved"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : wallet.status === "pending"
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {wallet.status || "active"}
                          </span>
                        </div>
                      </div>

                      {/* Account Name / Nickname & Account Number */}
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                          {wallet.nickname || wallet.name || meta.label}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                          <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                            •••• {acctLast4}
                          </span>
                          <span>•</span>
                          <span>{wallet.currency || "USD"} Account</span>
                          {wallet.businessName && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {wallet.businessName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Oversized Bold Balance Display */}
                      <div className="mb-4 rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-950/60">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          {wallet.type === "fixed_deposit"
                            ? "Locked Principal Balance"
                            : wallet.type === "savings"
                              ? "Savings Balance"
                              : "Available Balance"}
                        </p>
                        <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                          {formatMoney(wallet.balance, wallet.currency)}
                        </p>

                        {/* Multi-currency pills if holding more than 1 currency */}
                        {wallet.balancesByCurrency && wallet.balancesByCurrency.length > 1 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2.5 dark:border-gray-800">
                            {wallet.balancesByCurrency.map((b) => (
                              <span
                                key={b.currency}
                                className="rounded-lg bg-gray-100 px-2 py-0.5 font-mono text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                              >
                                {formatMoney(b.amount, b.currency)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── Account Application Identifying Variables (Pinterest Metadata Tiles) ── */}
                      {wallet.type === "savings" && (
                        <div className="mb-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-emerald-50/70 p-2.5 dark:bg-emerald-950/30">
                            <p className="flex items-center gap-1 text-[10px] font-medium uppercase text-emerald-700/70 dark:text-emerald-400/70">
                              <Target size={11} /> Savings Goal
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-emerald-900 dark:text-emerald-200 sm:text-sm">
                              {wallet.goal || "General Savings"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-emerald-50/70 p-2.5 dark:bg-emerald-950/30">
                            <p className="flex items-center gap-1 text-[10px] font-medium uppercase text-emerald-700/70 dark:text-emerald-400/70">
                              <Percent size={11} /> Interest Rate
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200 sm:text-sm">
                              {wallet.interestRate ?? 2.75}% APY
                            </p>
                          </div>
                          {wallet.initialDeposit !== undefined && wallet.initialDeposit > 0 && (
                            <div className="rounded-xl bg-gray-100/80 p-2.5 dark:bg-gray-800/60">
                              <p className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
                                Initial Deposit
                              </p>
                              <p className="mt-0.5 font-mono text-xs font-medium text-gray-900 dark:text-white">
                                {formatMoney(wallet.initialDeposit, wallet.currency)}
                              </p>
                            </div>
                          )}
                          <div className="rounded-xl bg-gray-100/80 p-2.5 dark:bg-gray-800/60">
                            <p className="flex items-center gap-1 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
                              <Repeat size={11} /> Auto-Save
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-gray-900 dark:text-white">
                              {wallet.autoSave
                                ? wallet.autoSaveAmount
                                  ? formatMoney(wallet.autoSaveAmount, wallet.currency)
                                  : "Enabled"
                                : "Manual"}
                            </p>
                          </div>
                        </div>
                      )}

                      {wallet.type === "current" && (
                        <div className="mb-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-blue-50/70 p-2.5 dark:bg-blue-950/30">
                            <p className="text-[10px] font-medium uppercase text-blue-700/70 dark:text-blue-400/70">
                              Purpose
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold capitalize text-blue-900 dark:text-blue-200 sm:text-sm">
                              {wallet.purpose === "business"
                                ? wallet.businessName || "Business"
                                : "Personal Checking"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-blue-50/70 p-2.5 dark:bg-blue-950/30">
                            <p className="flex items-center gap-1 text-[10px] font-medium uppercase text-blue-700/70 dark:text-blue-400/70">
                              <ShieldCheck size={11} /> Overdraft
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-blue-900 dark:text-blue-200 sm:text-sm">
                              {wallet.overdraftRequested || (wallet.overdraftLimit && wallet.overdraftLimit > 0)
                                ? wallet.overdraftLimit
                                  ? formatMoney(wallet.overdraftLimit, wallet.currency)
                                  : "Enabled"
                                : "Standard"}
                            </p>
                          </div>
                          {wallet.expectedMonthlyVolume !== undefined && wallet.expectedMonthlyVolume > 0 && (
                            <div className="col-span-2 rounded-xl bg-gray-100/80 p-2.5 dark:bg-gray-800/60">
                              <p className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
                                Expected Monthly Volume
                              </p>
                              <p className="mt-0.5 font-mono text-xs font-medium text-gray-900 dark:text-white">
                                {formatMoney(wallet.expectedMonthlyVolume, wallet.currency)} / month
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {wallet.type === "fixed_deposit" && (
                        <div className="mb-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-amber-50/70 p-2.5 dark:bg-amber-950/30">
                            <p className="flex items-center gap-1 text-[10px] font-medium uppercase text-amber-700/70 dark:text-amber-400/70">
                              <Percent size={11} /> Locked Rate
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200 sm:text-sm">
                              {wallet.interestRate ?? 5.25}% p.a.
                            </p>
                          </div>
                          <div className="rounded-xl bg-amber-50/70 p-2.5 dark:bg-amber-950/30">
                            <p className="flex items-center gap-1 text-[10px] font-medium uppercase text-amber-700/70 dark:text-amber-400/70">
                              <Calendar size={11} /> Term Length
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200 sm:text-sm">
                              {wallet.termMonths ?? 12} Months
                            </p>
                          </div>
                          {wallet.maturityDate && (
                            <div className="rounded-xl bg-gray-100/80 p-2.5 dark:bg-gray-800/60">
                              <p className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
                                Maturity Date
                              </p>
                              <p className="mt-0.5 text-xs font-medium text-gray-900 dark:text-white">
                                {new Date(wallet.maturityDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div className="rounded-xl bg-gray-100/80 p-2.5 dark:bg-gray-800/60">
                            <p className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">
                              Rollover
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-gray-900 dark:text-white">
                              {wallet.autoRenew ? "Auto-Renew On" : "Payout at Maturity"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between border-t border-gray-200/70 pt-3 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(meta.route);
                          }}
                          className="text-xs font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                          Open {meta.label} Hub
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(targetRoute);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 dark:bg-gray-800 dark:hover:bg-blue-500"
                        >
                          Manage <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </DashCard>
    </motion.div>
  );
};

export default AccountSummaryPanel;
