// ============================================================================
// MY ACCOUNTS — Spacious, high-contrast client accounts & wallets hub
// ============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Plus,
  Eye,
  EyeOff,
  ArrowUpRight,
  PiggyBank,
  Building2,
  Briefcase,
  Lock,
  Download,
  ChevronRight,
  X,
  ShieldCheck,
  Users,
  Loader2,
  Target,
  Percent,
  Calendar,
  Repeat,
  Archive,
  Sparkles,
} from "lucide-react";
import PageHeader from "@components/shared/PageHeader";
import { EmptyState } from "@components/shared/EmptyState";
import { StatsGridSkeleton, AccountListSkeleton } from "@components/skeletons";
import {
  useClientWallets,
  useClientAccountSummary,
  useClientClosedWallets,
  useCreateWallet,
  SUPPORTED_WALLET_CURRENCIES,
  type ClientWallet,
} from "../../client-usecase/useaccounts-client-usecase";
import { useAuthStore } from "@store/auth.store";
import { useUIStore } from "@store/ui.store";
import {
  PageContainer,
  StatCard,
  StatsGrid,
  DashCard,
  FilterPill,
  ActionButton,
  QuickLinkCard,
  QuickLinksGrid,
  StatusBadge,
} from "@components/shared/DashboardPrimitives";
import { dashboardItemVariants, cardRevealVariants } from "@core/animation/Animation";

/* eslint-disable @typescript-eslint/no-explicit-any */

const walletTypeIcons: Record<ClientWallet["type"], React.ReactNode> = {
  personal: <Wallet size={24} />,
  business: <Briefcase size={24} />,
  savings: <PiggyBank size={24} />,
  current: <Building2 size={24} />,
  fixed_deposit: <Lock size={24} />,
};

const walletTypeColors: Record<ClientWallet["type"], string> = {
  personal: "bg-blue-600",
  business: "bg-amber-600",
  savings: "bg-emerald-600",
  current: "bg-blue-600",
  fixed_deposit: "bg-amber-600",
};

const typeFilterLabels: Record<"all" | ClientWallet["type"], string> = {
  all: "All Accounts",
  personal: "Personal Wallets",
  current: "Current Accounts",
  savings: "Savings Accounts",
  fixed_deposit: "Fixed Deposits",
  business: "Business Wallets",
};

const formatCurrency = (amount: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${(Number(amount) || 0).toFixed(2)}`;
  }
};

// ─── New Wallet Modal ────────────────────────────────────────────────────────
const NewWalletModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [walletType, setWalletType] = useState<"personal" | "business">("personal");
  const [currency, setCurrency] = useState<string>("USD");
  const [nickname, setNickname] = useState<string>("");
  const createWallet = useCreateWallet();

  const handleSubmit = () => {
    createWallet.mutate(
      { walletType, currency: currency as Currency, ...(nickname.trim() ? { nickname: nickname.trim() } : {}) } as any,
      {
        onSuccess: () => {
          setNickname("");
          onClose();
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-t-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:rounded-3xl sm:p-8"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">Create New Wallet</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Instantly open a multi-currency Personal or Business wallet
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Wallet Nickname (optional)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Travel Wallet, Operations Account"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Wallet Type
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  {(["personal", "business"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setWalletType(t)}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition-all sm:text-base ${
                        walletType === t
                          ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-400"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      {t} Wallet
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Primary Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-400"
                >
                  {SUPPORTED_WALLET_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {createWallet.isError && (
                <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  {(createWallet.error as any)?.response?.data?.message || "Couldn't create wallet. Try again."}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={createWallet.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:opacity-95 disabled:opacity-60 sm:text-base"
              >
                {createWallet.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {createWallet.isPending ? "Creating Wallet..." : "Create Wallet"}
              </button>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Looking for Savings, Current, or Fixed Deposit instead?{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Apply directly from the Bank Account Products section below.
                </span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MyAccounts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const showBalances = useUIStore((s) => s.preferences.showBalances);
  const toggleShowBalances = useUIStore((s) => s.toggleShowBalances);
  const [selectedType, setSelectedType] = useState<"all" | ClientWallet["type"]>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const { wallets, isLoading: walletsLoading } = useClientWallets();
  const { summary, isLoading: summaryLoading } = useClientAccountSummary();
  const { closedWallets = [] } = useClientClosedWallets();

  const isLoading = walletsLoading || summaryLoading;

  const filteredWallets = selectedType === "all" ? wallets : wallets.filter((w) => w.type === selectedType);

  const accountTypes: Array<"all" | ClientWallet["type"]> = [
    "all",
    "personal",
    "current",
    "savings",
    "fixed_deposit",
    "business",
  ];

  const currentAndPersonalTotal = (summary.currentBalance || 0) + (summary.personalBalance || 0);

  return (
    <PageContainer>
      <NewWalletModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Header */}
      <motion.div variants={dashboardItemVariants}>
        <PageHeader
          title="My Accounts & Wallets"
          subtitle={user?.firstName ? `Welcome back, ${user.firstName}` : undefined}
          description="Manage your Personal, Business, Current, Savings, and Fixed Deposit accounts in one place."
          breadcrumbs={[{ label: "Dashboard", href: "/customer/dashboard" }, { label: "My Accounts" }]}
          actions={
            <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
              <ActionButton
                label={showBalances ? "Hide Balances" : "Show Balances"}
                icon={showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
                variant="secondary"
                onClick={() => toggleShowBalances()}
              />
              <ActionButton label="New Wallet" icon={<Plus size={16} />} onClick={() => setModalOpen(true)} />
            </div>
          }
        />
      </motion.div>

      {/* 4 Total Aggregated Cards across all accounts */}
      {isLoading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <StatsGrid cols={4}>
          <StatCard
            label={`Total Combined (${summary.primaryCurrency})`}
            value={showBalances ? formatCurrency(summary.totalBalance, summary.primaryCurrency) : "••••••"}
            change={`${summary.walletsCount || wallets.length || 0} Total Active Accounts`}
            icon={<Wallet size={22} />}
            iconColor="bg-blue-600"
            index={0}
          />
          <StatCard
            label="Current & Wallets"
            value={showBalances ? formatCurrency(currentAndPersonalTotal, summary.primaryCurrency) : "••••••"}
            change={`In: ${showBalances ? formatCurrency(summary.incoming, summary.primaryCurrency) : "•••"} · Out: ${showBalances ? formatCurrency(summary.outgoing, summary.primaryCurrency) : "•••"}`}
            icon={<Building2 size={22} />}
            iconColor="bg-blue-600"
            positive
            index={1}
          />
          <StatCard
            label="Savings Total"
            value={showBalances ? formatCurrency(summary.savingsBalance || 0, summary.primaryCurrency) : "••••••"}
            change="Up to 4.25% APY Yield"
            icon={<PiggyBank size={22} />}
            iconColor="bg-emerald-600"
            positive
            index={2}
          />
          <StatCard
            label="Fixed Deposits"
            value={showBalances ? formatCurrency(summary.fixedDepositBalance || 0, summary.primaryCurrency) : "••••••"}
            change="Locked Term Principal"
            icon={<Lock size={22} />}
            iconColor="bg-amber-600"
            index={3}
          />
        </StatsGrid>
      )}

      {/* Filter Tabs */}
      <motion.div
        className="scrollbar-hide mb-6 flex gap-2.5 overflow-x-auto pb-2"
        variants={dashboardItemVariants}
      >
        {accountTypes.map((type) => {
          const count = type === "all" ? wallets.length : wallets.filter((w) => w.type === type).length;
          return (
            <FilterPill
              key={type}
              label={`${typeFilterLabels[type]} (${count})`}
              active={selectedType === type}
              onClick={() => setSelectedType(type)}
            />
          );
        })}
      </motion.div>

      {/* Account & Wallet Cards — Spacious & High Readability */}
      {isLoading ? (
        <AccountListSkeleton count={3} />
      ) : filteredWallets.length === 0 ? (
        <EmptyState
          title="No Accounts Found"
          description={
            selectedType === "all"
              ? "You don't have any accounts yet. Add your first wallet or apply for a Savings, Current, or Fixed Deposit account."
              : `No ${typeFilterLabels[selectedType]} found. Open one in seconds below.`
          }
          action={{
            label:
              selectedType === "savings"
                ? "Apply for Savings Account"
                : selectedType === "current"
                  ? "Apply for Current Account"
                  : selectedType === "fixed_deposit"
                    ? "Open Fixed Deposit"
                    : "Create New Wallet",
            onClick: () => {
              if (selectedType === "savings") navigate("/customer/accounts/savings");
              else if (selectedType === "current") navigate("/customer/accounts/current");
              else if (selectedType === "fixed_deposit") navigate("/customer/accounts/fixed-deposits");
              else setModalOpen(true);
            },
          }}
        />
      ) : (
        <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredWallets.map((wallet, index) => {
            const typeColor = walletTypeColors[wallet.type] || walletTypeColors.personal;
            const typeIcon = walletTypeIcons[wallet.type] || walletTypeIcons.personal;
            const isAppOnly = Boolean(wallet.isApplicationOnly || wallet.id.startsWith("app-"));
            const detailRoute = isAppOnly
              ? wallet.type === "savings"
                ? "/customer/accounts/savings"
                : wallet.type === "current"
                  ? "/customer/accounts/current"
                  : "/customer/accounts/fixed-deposits"
              : `/customer/accounts/${wallet.id}`;

            return (
              <motion.div
                key={wallet.id || index}
                custom={index}
                variants={cardRevealVariants}
                initial="hidden"
                animate="visible"
              >
                <DashCard
                  className="flex h-full cursor-pointer flex-col justify-between overflow-hidden border-gray-200/90 transition-all hover:border-blue-400 hover:shadow-lg dark:border-gray-800 dark:hover:border-blue-600"
                  padding="none"
                  hover
                >
                  <div>
                    <div className={`h-2.5 ${typeColor}`} />
                    <div className="p-6 sm:p-7" onClick={() => navigate(detailRoute)}>
                      {/* Top Header */}
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className={`rounded-2xl bg-blue-600 p-3.5 ${typeColor} text-white shadow-md`}>
                            {typeIcon}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {wallet.typeLabel}
                              </span>
                              {wallet.isPrimary && (
                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                  Primary
                                </span>
                              )}
                            </div>
                            <h3 className="mt-1.5 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                              {wallet.displayName}
                            </h3>
                            <p className="mt-0.5 font-mono text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                              {isAppOnly
                                ? `Ref ${wallet.walletNumber}`
                                : `Acct •••• ${wallet.walletNumber.slice(-4)}`}{" "}
                              · {wallet.primaryCurrency}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={wallet.status} />
                      </div>

                      {/* Balance Box */}
                      <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50/90 p-4 dark:border-gray-800/80 dark:bg-gray-800/60 sm:p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {isAppOnly ? "Requested Initial Deposit" : "Available Balance"}
                        </p>
                        {wallet.balancesByCurrency.length <= 1 ? (
                          <p className="mt-1.5 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            {showBalances
                              ? formatCurrency(wallet.primaryCurrencyBalance, wallet.primaryCurrency)
                              : "••••••"}
                          </p>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                            {wallet.balancesByCurrency.map((b) => (
                              <span
                                key={b.currency}
                                className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl"
                              >
                                {showBalances ? formatCurrency(b.amount, b.currency) : "••••••"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Account Application Identifiable Metadata */}
                      {(wallet.goal ||
                        wallet.interestRate !== undefined ||
                        wallet.termMonths !== undefined ||
                        wallet.purpose ||
                        wallet.businessName ||
                        wallet.autoSave ||
                        wallet.overdraftRequested) && (
                        <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
                          {wallet.goal && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-3 dark:bg-emerald-950/25">
                              <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-emerald-700 dark:text-emerald-400">
                                <Target size={13} /> Savings Goal
                              </p>
                              <p className="mt-1 truncate font-medium text-gray-900 dark:text-white">{wallet.goal}</p>
                            </div>
                          )}
                          {wallet.interestRate !== undefined && wallet.interestRate > 0 && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-50/60 p-3 dark:bg-amber-950/25">
                              <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-amber-700 dark:text-amber-400">
                                <Percent size={13} /> Interest Rate
                              </p>
                              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                {wallet.interestRate}% p.a.
                              </p>
                            </div>
                          )}
                          {wallet.termMonths !== undefined && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-50/60 p-3 dark:bg-amber-950/25">
                              <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-amber-700 dark:text-amber-400">
                                <Calendar size={13} /> Lock Term
                              </p>
                              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                {wallet.termMonths} Months
                              </p>
                            </div>
                          )}
                          {wallet.autoSave && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-3 dark:bg-emerald-950/25">
                              <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-emerald-700 dark:text-emerald-400">
                                <Repeat size={13} /> Auto-Save
                              </p>
                              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                {wallet.autoSaveAmount
                                  ? formatCurrency(wallet.autoSaveAmount, wallet.primaryCurrency)
                                  : "Enabled"}
                              </p>
                            </div>
                          )}
                          {(wallet.businessName || wallet.purpose) && (
                            <div className="rounded-xl border border-blue-500/20 bg-blue-50/60 p-3 dark:bg-blue-950/25">
                              <p className="text-xs font-medium uppercase text-blue-700 dark:text-blue-400">Purpose</p>
                              <p className="mt-1 truncate font-medium capitalize text-gray-900 dark:text-white">
                                {wallet.businessName || wallet.purpose}
                              </p>
                            </div>
                          )}
                          {wallet.overdraftRequested && (
                            <div className="rounded-xl border border-blue-500/20 bg-blue-50/60 p-3 dark:bg-blue-950/25">
                              <p className="text-xs font-medium uppercase text-blue-700 dark:text-blue-400">
                                Overdraft
                              </p>
                              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                {wallet.overdraftLimit
                                  ? formatCurrency(wallet.overdraftLimit, wallet.primaryCurrency)
                                  : "Enabled"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-1">
                        {!isAppOnly && (
                          <motion.button
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/customer/send/domestic");
                            }}
                          >
                            <ArrowUpRight size={16} />
                            Transfer
                          </motion.button>
                        )}
                        <motion.button
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(detailRoute);
                          }}
                        >
                          {isAppOnly ? "View Application" : "Account Details"}
                          <ChevronRight size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </DashCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Bank Account Products Banner — Quick Apply for Savings, Current, Fixed Deposit */}
      <motion.div variants={dashboardItemVariants} className="mt-10">
        <DashCard padding="lg" className="bg-blue-600 text-white">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-100">
                <Sparkles size={14} /> Bank Account Products
              </span>
              <h3 className="mt-3 text-xl font-semibold sm:text-2xl">
                Open a Savings, Current, or Fixed Deposit Account
              </h3>
              <p className="mt-2 text-sm text-blue-100 sm:text-base">
                Apply for specialized bank accounts tailored to your financial goals. Once approved by our team, your
                new account appears automatically alongside your wallets.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/customer/accounts/savings")}
                className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-blue-700 shadow-sm transition-all hover:bg-blue-50"
              >
                + Savings Account
              </button>
              <button
                onClick={() => navigate("/customer/accounts/current")}
                className="rounded-xl bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/25"
              >
                + Current Account
              </button>
              <button
                onClick={() => navigate("/customer/accounts/fixed-deposits")}
                className="rounded-xl bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/25"
              >
                + Fixed Deposit
              </button>
              <button
                onClick={() => navigate("/customer/accounts/applications")}
                className="rounded-xl border border-white/30 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
              >
                Track Applications
              </button>
            </div>
          </div>
        </DashCard>
      </motion.div>

      {/* Closed Wallets History (if any) */}
      {closedWallets.length > 0 && (
        <motion.div variants={dashboardItemVariants} className="mt-8">
          <DashCard padding="lg">
            <div className="mb-4 flex items-center gap-2.5">
              <Archive size={20} className="text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                Archived / Closed Accounts ({closedWallets.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {closedWallets.map((cw) => (
                <div
                  key={cw.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cw.displayName}</p>
                    <p className="font-mono text-xs text-gray-500">
                      •••• {cw.walletNumber.slice(-4)} · {cw.typeLabel}
                    </p>
                  </div>
                  <StatusBadge status="closed" />
                </div>
              ))}
            </div>
          </DashCard>
        </motion.div>
      )}

      {/* Quick Links */}
      <div className="mt-8">
        <QuickLinksGrid>
          <QuickLinkCard
            label="Savings Account"
            icon={<PiggyBank size={22} />}
            route="/customer/accounts/savings"
            iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
          />
          <QuickLinkCard
            label="Current Account"
            icon={<Building2 size={22} />}
            route="/customer/accounts/current"
            iconColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
          />
          <QuickLinkCard
            label="Fixed Deposits"
            icon={<Briefcase size={22} />}
            route="/customer/accounts/fixed-deposits"
            iconColor="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
          />
          <QuickLinkCard
            label="Statements"
            icon={<Download size={22} />}
            route="/customer/accounts/statements"
            iconColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
          />
          <QuickLinkCard
            label="Account Limits"
            icon={<ShieldCheck size={22} />}
            route="/customer/accounts/limits"
            iconColor="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50"
          />
          <QuickLinkCard
            label="Beneficiaries"
            icon={<Users size={22} />}
            route="/customer/accounts/beneficiaries"
            iconColor="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50"
          />
        </QuickLinksGrid>
      </div>
    </PageContainer>
  );
};

export default MyAccounts;
