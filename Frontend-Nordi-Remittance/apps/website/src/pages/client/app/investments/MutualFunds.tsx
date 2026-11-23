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

const MutualFunds: React.FC = () => {
  const { products: allProducts, isLoading } = useClientInvestmentProducts({ type: "mutual_fund" as any });
  const { wallets } = useClientWallets();
  const createInvestment = useCreateInvestment();
  const { showToast } = useToastStore();

  const matchedProducts = allProducts.filter(
    (p: any) => p.type === "mutual_fund" || p.category === "mutual_funds" || p.assetType === "mutual_fund",
  );
  const products = matchedProducts.length > 0 ? matchedProducts : allProducts;

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedFund, setSelectedFund] = useState<any | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const defaultWalletId = wallets[0]?._id || wallets[0]?.id || "";
  const walletIdToUse = selectedWalletId || defaultWalletId;

  const handleInvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund || !investAmount || Number(investAmount) <= 0) {
      showToast("Please enter a valid investment amount", "error");
      return;
    }
    const minInv = Number(selectedFund.minInvestment ?? selectedFund.minimumInvestment ?? 0);
    if (Number(investAmount) < minInv) {
      showToast(`Minimum investment is ${fmt(minInv)}`, "error");
      return;
    }
    const nav = Number(selectedFund.nav ?? selectedFund.netAssetValue ?? selectedFund.price ?? 1);
    const quantity = Math.max(1, Number((Number(investAmount) / (nav > 0 ? nav : 1)).toFixed(4)));
    try {
      await createInvestment.mutateAsync({
        productId: selectedFund._id || selectedFund.id || selectedFund.assetId || selectedFund.name,
        amount: Number(investAmount),
        sourceAccountId: walletIdToUse,
        quantity,
      } as any);
      setSelectedFund(null);
      setInvestAmount("");
    } catch {
      // handled by mutation onError
    }
  };

  const defaultFunds = [
    {
      name: "Nordi Growth Fund",
      category: "Equity",
      risk: "high",
      returns: 14.5,
      minInvestment: 500,
      nav: 45.32,
      rating: 4,
    },
    {
      name: "Nordi Balanced Fund",
      category: "Hybrid",
      risk: "medium",
      returns: 9.8,
      minInvestment: 1000,
      nav: 28.67,
      rating: 5,
    },
    {
      name: "Nordi Income Fund",
      category: "Debt",
      risk: "low",
      returns: 6.2,
      minInvestment: 250,
      nav: 15.44,
      rating: 4,
    },
    {
      name: "Nordi Index Fund",
      category: "Index",
      risk: "medium",
      returns: 12.1,
      minInvestment: 100,
      nav: 120.89,
      rating: 3,
    },
    {
      name: "Nordi Small Cap",
      category: "Equity",
      risk: "high",
      returns: 18.3,
      minInvestment: 2000,
      nav: 62.15,
      rating: 5,
    },
    {
      name: "Nordi Liquid Fund",
      category: "Debt",
      risk: "low",
      returns: 4.5,
      minInvestment: 100,
      nav: 10.02,
      rating: 3,
    },
  ];

  const display = products.length > 0 ? products : defaultFunds;

  const filtered = useMemo(
    () =>
      display.filter(
        (f: any) =>
          (riskFilter === "all" || f.risk === riskFilter || f.riskLevel === riskFilter) &&
          (!search || (f.name ?? "").toLowerCase().includes(search.toLowerCase())),
      ),
    [display, riskFilter, search],
  );

  const riskColors: Record<string, string> = {
    low: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
    medium: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
    high: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400",
  };

  return (
    <PageContainer>
      <PageHeader
        title="Mutual Funds"
        subtitle="Explore and invest in mutual funds"
        breadcrumbs={[
          { label: "Dashboard", href: "/customer/dashboard" },
          { label: "Investments", href: "/customer/investments" },
          { label: "Mutual Funds" },
        ]}
      />

      {isLoading ? (
        <>
          <StatsGridSkeleton count={3} />
          <TableSkeleton rows={4} />
        </>
      ) : (
        <motion.div variants={dashboardItemVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* ── Search & Filter ────────────────────────────────────── */}
          <DashCard>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="relative w-full flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  placeholder="Search funds..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs text-gray-900 transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 sm:text-sm"
                />
              </div>
              <div className="flex shrink-0 gap-2">
                {["all", "low", "medium", "high"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    className={`rounded-xl px-3 py-2 text-[10px] font-medium capitalize transition-colors sm:text-xs ${
                      riskFilter === r
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    {r === "all" ? "All Risk" : r}
                  </button>
                ))}
              </div>
            </div>
          </DashCard>

          {/* ── Fund Cards ─────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <EmptyState variant="search" title="No funds found" description="Try adjusting your search or filters." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((fund: any, i: number) => {
                const risk = fund.risk ?? fund.riskLevel ?? "medium";
                const rating = fund.rating ?? fund.starRating ?? 4;
                return (
                  <DashCard key={fund.id ?? fund._id ?? i} hover>
                    <div className="flex h-full flex-col">
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                            {fund.name ?? "Mutual Fund"}
                          </h3>
                          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
                            {fund.category ?? fund.type ?? "—"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize sm:text-xs ${
                            riskColors[risk] ?? riskColors.medium
                          }`}
                        >
                          {risk}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="mb-3 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            size={12}
                            className={
                              si < rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"
                            }
                          />
                        ))}
                        <span className="ml-1 text-[10px] text-gray-500 dark:text-gray-400">({rating}/5)</span>
                      </div>

                      {/* Data Grid */}
                      <div className="mb-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-gray-50 p-2 text-center dark:bg-gray-800">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Returns</p>
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:text-sm">
                            +{fund.returns ?? fund.annualReturn ?? 0}%
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2 text-center dark:bg-gray-800">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">NAV</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                            ${fund.nav ?? fund.netAssetValue ?? 0}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2 text-center dark:bg-gray-800">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Min</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                            ${fund.minInvestment ?? fund.minimumInvestment ?? 0}
                          </p>
                        </div>
                      </div>

                      {/* Invest Button */}
                      <motion.button
                        onClick={() => {
                          setSelectedFund(fund);
                          setInvestAmount(String(fund.minInvestment ?? fund.minimumInvestment ?? 500));
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

          {/* Invest Modal */}
          {selectedFund && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <DashCard className="w-full max-w-md">
                <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                  Invest in {selectedFund.name}
                </h3>
                <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                  NAV: ${selectedFund.nav ?? selectedFund.netAssetValue ?? 10} • Min:{" "}
                  {fmt(selectedFund.minInvestment ?? selectedFund.minimumInvestment ?? 100)}
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
                      onClick={() => setSelectedFund(null)}
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

export default MutualFunds;
