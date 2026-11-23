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

const MarketInsights: React.FC = () => {
  const { products: productsData, isLoading: pLoading } = useClientInvestmentProducts();
  const { portfolio, isLoading: portLoading } = useClientPortfolio();
  const isLoading = pLoading || portLoading;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeArticle, setActiveArticle] = useState<any | null>(null);

  const defaultInsights = [
    {
      title: "Fed Holds Rates Steady Amid Inflation Concerns",
      summary:
        "The Federal Reserve kept interest rates unchanged at its latest meeting, signaling a cautious approach as inflation remains above target. Markets responded positively with major indices closing higher.",
      category: "Macro Economy",
      date: "2026-02-25",
      source: "Nordi Research",
    },
    {
      title: "Tech Sector Rally: AI Stocks Lead the Charge",
      summary:
        "Technology stocks surged this week, led by strong earnings from AI-focused companies. NVIDIA and Microsoft posted record revenues, driving the Nasdaq to new highs.",
      category: "Equities",
      date: "2026-02-24",
      source: "Market Desk",
    },
    {
      title: "Emerging Market Bonds Offer Attractive Yields",
      summary:
        "With yields in developed markets remaining compressed, emerging market bonds are attracting attention from income-seeking investors. Our analysts recommend selective exposure.",
      category: "Fixed Income",
      date: "2026-02-23",
      source: "Fixed Income Team",
    },
    {
      title: "Gold Prices Hit 6-Month High on Geopolitical Tensions",
      summary:
        "Safe-haven demand pushed gold prices to their highest level in six months. Analysts suggest maintaining a 5-10% portfolio allocation to precious metals as a hedge.",
      category: "Commodities",
      date: "2026-02-22",
      source: "Nordi Research",
    },
    {
      title: "ESG Investing: Green Bonds Outperform in Q1",
      summary:
        "Sustainable investing continues to gain traction as green bonds outperformed traditional corporate bonds in the first quarter. New ESG-focused funds saw record inflows.",
      category: "ESG",
      date: "2026-02-21",
      source: "ESG Desk",
    },
    {
      title: "Real Estate Investment Trusts: A Comeback Story",
      summary:
        "REITs are showing signs of recovery after a challenging period. Commercial real estate fundamentals are improving, with occupancy rates climbing back to pre-pandemic levels.",
      category: "Real Estate",
      date: "2026-02-20",
      source: "Market Desk",
    },
  ];

  const insights = useMemo(() => {
    const dynamicInsights = productsData.slice(0, 3).map((p: any) => ({
      title: `${p.name || p.symbol || "Asset"} — ${p.category || p.type || "Market"} Update`,
      summary:
        p.description ||
        `Current valuation at ${fmt(p.price ?? p.nav ?? p.minInvestment ?? 100)} with projected yield of ${p.returns ?? p.yield ?? p.annualReturn ?? 8.5}% p.a.`,
      category: p.category || "Equities",
      date: p.updatedAt || new Date().toISOString(),
      source: "Nordi Live Feed",
    }));
    return [...dynamicInsights, ...defaultInsights];
  }, [productsData]);

  const categories = useMemo(() => {
    const cats = [...new Set(insights.map((a) => a.category))];
    return ["all", ...cats];
  }, [insights]);

  const filtered = useMemo(
    () => (selectedCategory === "all" ? insights : insights.filter((a) => a.category === selectedCategory)),
    [insights, selectedCategory],
  );

  const categoryColors: Record<string, string> = {
    "Macro Economy": "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
    Equities: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
    "Fixed Income": "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
    Commodities: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
    ESG: "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400",
    "Real Estate": "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400",
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Market Insights"
        subtitle="Stay informed with the latest market analysis"
        icon={<Lightbulb size={20} />}
        breadcrumbs={[
          { label: "Dashboard", href: "/customer/dashboard" },
          { label: "Investments", href: "/customer/investments" },
          { label: "Market Insights" },
        ]}
      />

      {isLoading ? (
        <>
          <StatsGridSkeleton count={3} />
          <TableSkeleton rows={4} />
        </>
      ) : (
        <motion.div variants={dashboardItemVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* ── Category Filter ────────────────────────────────────── */}
          <DashCard>
            <div className="flex flex-wrap items-center gap-2">
              <Tag size={14} className="text-gray-400 dark:text-gray-500" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 text-[10px] font-medium capitalize transition-colors sm:text-xs ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat === "all" ? "All Topics" : cat}
                </button>
              ))}
            </div>
          </DashCard>

          {/* ── Insights Cards ─────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Newspaper size={40} />}
              title="No insights available"
              description="Check back later for the latest market analysis."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((article, i) => (
                <DashCard key={i} hover>
                  <div className="flex h-full flex-col">
                    {/* Category Badge + Date */}
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs ${
                          categoryColors[article.category] ??
                          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs">
                        <CalendarDays size={10} />
                        {formatDate(article.date)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                      {article.title}
                    </h3>

                    {/* Summary */}
                    <p className="mb-4 line-clamp-3 flex-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                      {article.summary}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs">{article.source}</span>
                      <motion.button
                        onClick={() => setActiveArticle(article)}
                        className="flex items-center gap-1 text-[10px] font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 sm:text-xs"
                        whileHover={{ x: 2 }}
                      >
                        Read More <ChevronRight size={12} />
                      </motion.button>
                    </div>
                  </div>
                </DashCard>
              ))}
            </div>
          )}

          {/* Article Reader Modal */}
          {activeArticle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <DashCard className="w-full max-w-lg">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    {activeArticle.category}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(activeArticle.date)}</span>
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">{activeArticle.title}</h3>
                <p className="mb-4 text-xs leading-relaxed text-gray-600 dark:text-gray-300 sm:text-sm">
                  {activeArticle.summary}
                </p>
                {portfolio?.totalValue > 0 && (
                  <div className="mb-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <strong>Portfolio Context:</strong> Your current portfolio stands at {fmt(portfolio.totalValue)} (
                    {pct(portfolio.returnPercentage || 0)} return).
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveArticle(null)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </DashCard>
            </div>
          )}
        </motion.div>
      )}
    </PageContainer>
  );
};

export default MarketInsights;
