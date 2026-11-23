// ============================================================================
// INVESTMENT SUB-PAGES — Overview · Mutual Funds · Stocks & ETFs · Fixed Income · Market Insights
// Dark-mode-first, border-only cards (no shadow-sm), responsive typography
// ============================================================================

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
} from "../../client-usecase/useinvestments-client-usecase";
import { useUIStore } from "@store/ui.store";

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

const InvestmentOverview: React.FC = () => {
  const navigate = useNavigate();
  const show = useUIStore((s) => s.preferences.showBalances);
  const { portfolio, isLoading: pLoading } = useClientPortfolio();
  const { investments, isLoading: iLoading } = useClientInvestments();
  const isLoading = pLoading || iLoading;

  const totalValue = portfolio?.totalValue ?? 0;
  const totalReturns = portfolio?.totalReturns ?? 0;
  const returnPct = portfolio?.returnPercentage ?? (portfolio?._raw as any)?.dailyChangePercent ?? 0;

  // Dynamic allocation breakdown computed from real holdings
  const allocation = useMemo(() => {
    const rawAlloc = (portfolio?._raw as any)?.allocation;
    if (Array.isArray(rawAlloc) && rawAlloc.length > 0) return rawAlloc;

    const list = investments.length > 0 ? investments : portfolio?.holdings || [];
    if (list.length === 0) return [];

    const colorMap: Record<string, string> = {
      Equities: "bg-blue-500 dark:bg-blue-400",
      "Fixed Income": "bg-emerald-500 dark:bg-emerald-400",
      "Mutual Funds": "bg-amber-500 dark:bg-amber-400",
      Other: "bg-blue-500 dark:bg-blue-400",
    };

    const groups: Record<string, number> = {};
    let sum = 0;
    for (const item of list) {
      const val = Number(item.currentValue ?? item.amount ?? item.totalInvested ?? 0);
      const rawType = String(item.assetType ?? item.type ?? item.category ?? "").toLowerCase();
      const label =
        rawType.includes("stock") || rawType.includes("equit") || rawType.includes("etf")
          ? "Equities"
          : rawType.includes("bond") || rawType.includes("fixed") || rawType.includes("treasury")
            ? "Fixed Income"
            : rawType.includes("mutual") || rawType.includes("fund")
              ? "Mutual Funds"
              : "Other";
      groups[label] = (groups[label] || 0) + val;
      sum += val;
    }

    if (sum <= 0) return [];
    return Object.entries(groups).map(([label, val]) => ({
      label,
      pct: Math.round((val / sum) * 100),
      color: colorMap[label] || colorMap.Other,
    }));
  }, [investments, portfolio]);

  return (
    <PageContainer>
      <PageHeader
        title="Investment Overview"
        subtitle="Track your portfolio performance"
        breadcrumbs={[
          { label: "Dashboard", href: "/customer/dashboard" },
          { label: "Investments", href: "/customer/investments" },
          { label: "Overview" },
        ]}
        actions={
          <motion.button
            onClick={() => navigate("/customer/investments/mutual-funds")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 sm:text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={16} /> Invest
          </motion.button>
        }
      />

      {isLoading ? (
        <>
          <StatsGridSkeleton count={4} />
          <ChartSkeleton />
        </>
      ) : (
        <motion.div variants={dashboardItemVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* ── Stats ──────────────────────────────────────────────── */}
          <StatsGrid cols={4}>
            <StatCard
              label="Portfolio Value"
              value={show ? fmt(totalValue) : "••••••"}
              icon={<PieChart size={20} />}
              iconColor="bg-blue-600"
              change={returnPct ? pct(returnPct) : undefined}
              positive={returnPct >= 0}
              index={0}
            />
            <StatCard
              label="Total Returns"
              value={show ? fmt(totalReturns) : "••••••"}
              icon={totalReturns >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              iconColor={totalReturns >= 0 ? "bg-emerald-600" : "bg-rose-600"}
              index={1}
            />
            <StatCard
              label="Today's Change"
              value={show ? pct((portfolio?._raw as any)?.dailyChangePercent ?? 0) : "••"}
              icon={<BarChart3 size={20} />}
              iconColor="bg-blue-600"
              index={2}
            />
            <StatCard
              label="Holdings"
              value={String(investments.length)}
              icon={<Layers size={20} />}
              iconColor="bg-amber-600"
              index={3}
            />
          </StatsGrid>

          {/* ── Portfolio Allocation ───────────────────────────────── */}
          <DashCard>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                  Portfolio Allocation
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Distribution across asset classes</p>
              </div>
              <PieChart size={18} className="text-gray-400 dark:text-gray-500" />
            </div>

            {allocation.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                No asset allocation data yet. Invest in a product to see your portfolio breakdown.
              </p>
            ) : (
              <div className="space-y-3">
                {allocation.map((item: any, idx: number) => (
                  <div key={idx}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-gray-700 dark:text-gray-300 sm:text-sm">{item.label}</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white sm:text-sm">{item.pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                      <motion.div
                        className={`h-2 rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{
                          duration: 0.7,
                          delay: idx * 0.1,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashCard>

          {/* ── Holdings List ──────────────────────────────────────── */}
          <DashCard padding="none">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-6 sm:py-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Your Holdings</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                All active investment positions
              </p>
            </div>

            {investments.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Briefcase size={40} />}
                  title="No investments yet"
                  description="Start building your portfolio by exploring mutual funds, stocks, or fixed income products."
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {investments.map((inv: any, i: number) => {
                  const ret = inv.returnPercentage ?? inv.returns ?? inv.change ?? 0;
                  const positive = ret >= 0;
                  return (
                    <div
                      key={inv._id ?? inv.id ?? i}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 sm:px-6 sm:py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            positive
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                          }`}
                        >
                          {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                            {inv.name ?? inv.productName ?? "Investment"}
                          </p>
                          <p className="text-[10px] capitalize text-gray-500 dark:text-gray-400 sm:text-xs">
                            {inv.type ?? inv.category ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">
                          {show ? fmt(inv.currentValue ?? inv.amount ?? 0) : "••••••"}
                        </p>
                        <p
                          className={`text-[10px] font-medium sm:text-xs ${
                            positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {pct(ret)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DashCard>
        </motion.div>
      )}
    </PageContainer>
  );
};

export default InvestmentOverview;
