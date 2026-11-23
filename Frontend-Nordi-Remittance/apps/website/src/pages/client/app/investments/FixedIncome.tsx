// ============================================================================
// INVESTMENT SUB-PAGES — Overview · Mutual Funds · Stocks & ETFs · Fixed Income · Market Insights
// Dark-mode-first, border-only cards (no shadow-sm), responsive typography
// ============================================================================

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Clock,
  ChevronRight,
  Plus,
  Search,
  Globe,
  Lightbulb,
  Briefcase,
  Star,
  BookOpen,
  Newspaper,
  Tag,
  CalendarDays,
} from "@constants/icons";

import { PageContainer, DashCard, StatCard, StatsGrid, StatusBadge } from "@components/shared/DashboardPrimitives";
import PageHeader from "@components/shared/PageHeader";
import EmptyState from "@components/shared/EmptyState";
import { StatsGridSkeleton, TableSkeleton, ChartSkeleton } from "@components/skeletons";
import { dashboardItemVariants } from "@core/animation/Animation";
import {
  useClientInvestments,
  useClientInvestmentProducts,
  useClientPortfolio,
  useClientInvestmentPerformance,
  useCreateInvestment,
} from "../../client-usecase/useinvestments-client-usecase";
import { useClientWallets } from "../../client-usecase/useaccounts-client-usecase";
import { useUIStore } from "@store/ui.store";
import { useToastStore } from "@store/toast.store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const fmtCompact = (n: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const FixedIncome: React.FC = () => {
  const { products: apiProducts, isLoading } = useClientInvestmentProducts({ type: "fixed_income" as any });
  const { wallets } = useClientWallets();
  const createInvestment = useCreateInvestment();
  const { showToast } = useToastStore();

  const [selectedBond, setSelectedBond] = useState<any | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const defaultWalletId = wallets[0]?._id || wallets[0]?.id || "";
  const walletIdToUse = selectedWalletId || defaultWalletId;

  const handleInvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBond || !investAmount || Number(investAmount) <= 0) {
      showToast("Enter a valid investment amount", "error");
      return;
    }
    const minInv = Number(selectedBond.minInvestment ?? selectedBond.minimumInvestment ?? 0);
    if (Number(investAmount) < minInv) {
      showToast(`Minimum investment is ${fmt(minInv)}`, "error");
      return;
    }
    try {
      await createInvestment.mutateAsync({
        productId: selectedBond._id || selectedBond.id || selectedBond.assetId || selectedBond.name,
        amount: Number(investAmount),
        quantity: 1,
        sourceAccountId: walletIdToUse,
      } as any);
      setSelectedBond(null);
      setInvestAmount("");
    } catch {
      // handled by mutation onError
    }
  };

  const defaultBonds = [
    {
      name: "US Treasury 10Y",
      type: "Government Bond",
      yield: 4.25,
      tenure: "10 years",
      minInvestment: 1000,
      rating: "AAA",
      risk: "low",
    },
    {
      name: "Nordi Fixed Deposit",
      type: "Fixed Deposit",
      yield: 5.1,
      tenure: "1 year",
      minInvestment: 500,
      rating: "AA+",
      risk: "low",
    },
    {
      name: "Corporate Bond Fund",
      type: "Corporate Bond",
      yield: 6.8,
      tenure: "5 years",
      minInvestment: 5000,
      rating: "A+",
      risk: "medium",
    },
    {
      name: "Municipal Bond Fund",
      type: "Municipal Bond",
      yield: 3.9,
      tenure: "7 years",
      minInvestment: 2500,
      rating: "AA",
      risk: "low",
    },
    {
      name: "High Yield Bond ETF",
      type: "High Yield Bond",
      yield: 8.2,
      tenure: "3 years",
      minInvestment: 1000,
      rating: "BBB",
      risk: "high",
    },
    {
      name: "Nordi Recurring Deposit",
      type: "Recurring Deposit",
      yield: 5.5,
      tenure: "2 years",
      minInvestment: 100,
      rating: "AA+",
      risk: "low",
    },
  ];

  const products = apiProducts.length > 0 ? apiProducts : defaultBonds;

  const [riskFilter, setRiskFilter] = useState("all");

  const filtered = useMemo(
    () => products.filter((p: any) => riskFilter === "all" || (p.risk ?? p.riskLevel ?? "low") === riskFilter),
    [products, riskFilter],
  );

  const ratingColors: Record<string, string> = {
    AAA: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
    "AA+": "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
    AA: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
    "A+": "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
    A: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
    BBB: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
    BB: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400",
  };

  return (
    <PageContainer>
      <PageHeader
        title="Fixed Income"
        subtitle="Bonds, fixed deposits, and other stable instruments"
        breadcrumbs={[
          { label: "Dashboard", href: "/customer/dashboard" },
          { label: "Investments", href: "/customer/investments" },
          { label: "Fixed Income" },
        ]}
      />

      {isLoading ? (
        <>
          <StatsGridSkeleton count={3} />
          <TableSkeleton rows={4} />
        </>
      ) : (
        <motion.div variants={dashboardItemVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* ── Filter Pills ───────────────────────────────────────── */}
          <DashCard>
            <div className="flex flex-wrap items-center gap-2">
              <Shield size={14} className="text-gray-400 dark:text-gray-500" />
              <span className="mr-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">Risk:</span>
              {["all", "low", "medium", "high"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`rounded-xl px-3 py-1.5 text-[10px] font-medium capitalize transition-colors sm:text-xs ${
                    riskFilter === r
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {r === "all" ? "All" : r}
                </button>
              ))}
            </div>
          </DashCard>

          {/* ── Bond / FD Cards ────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <EmptyState variant="search" title="No products found" description="Try adjusting your risk filter." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((bond: any, i: number) => {
                const bondRating = bond.rating ?? bond.creditRating ?? "—";
                return (
                  <DashCard key={bond.id ?? bond._id ?? i} hover>
                    <div className="flex h-full flex-col">
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                            {bond.name ?? "Fixed Income Product"}
                          </h3>
                          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                            {bond.type ?? bond.category ?? "Bond"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs ${
                            ratingColors[bondRating] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {bondRating}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="mb-4 flex-1 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                            <TrendingUp size={12} /> Yield
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:text-sm">
                            {bond.yield ?? bond.interestRate ?? 0}% p.a.
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                            <Clock size={12} /> Tenure
                          </span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                            {bond.tenure ?? bond.maturityPeriod ?? "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                            <DollarSign size={12} /> Min Investment
                          </span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                            {fmt(bond.minInvestment ?? bond.minimumInvestment ?? 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                            <Shield size={12} /> Risk
                          </span>
                          <StatusBadge status={bond.risk ?? bond.riskLevel ?? "low"} />
                        </div>
                      </div>

                      {/* Invest Button */}
                      <motion.button
                        onClick={() => {
                          setSelectedBond(bond);
                          setInvestAmount(String(bond.minInvestment ?? bond.minimumInvestment ?? 500));
                        }}
                        className="mt-auto w-full rounded-xl bg-blue-600 py-2.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 sm:text-sm"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Invest Now
                      </motion.button>
                    </div>
                  </DashCard>
                );
              })}
            </div>
          )}

          {/* Fixed Income Investment Modal */}
          {selectedBond && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <DashCard className="w-full max-w-md">
                <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                  Invest in {selectedBond.name}
                </h3>
                <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                  Yield: {selectedBond.yield ?? selectedBond.interestRate ?? 0}% p.a. • Tenure:{" "}
                  {selectedBond.tenure ?? selectedBond.maturityPeriod ?? "—"}
                </p>
                <form onSubmit={handleInvestSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  {wallets.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Source Wallet
                      </label>
                      <select
                        value={walletIdToUse}
                        onChange={(e) => setSelectedWalletId(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      >
                        {wallets.map((w: any) => {
                          const wid = w._id || w.id;
                          return (
                            <option key={wid} value={wid}>
                              {w.name || `${w.currency || "USD"} Wallet`} ({fmt(w.balance ?? w.availableBalance ?? 0)})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBond(null)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createInvestment.isPending}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createInvestment.isPending ? "Processing…" : "Confirm Investment"}
                    </button>
                  </div>
                </form>
              </DashCard>
            </div>
          )}
        </motion.div>
      )}
    </PageContainer>
  );
};

export default FixedIncome;
