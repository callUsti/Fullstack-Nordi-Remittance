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

const StocksETFs: React.FC = () => {
  const [search, setSearch] = useState("");
  const { products: apiStocks, isLoading } = useClientInvestmentProducts({ type: "stock" as any });
  const { wallets } = useClientWallets();
  const createInvestment = useCreateInvestment();
  const { showToast } = useToastStore();

  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [shares, setShares] = useState("1");
  const [selectedWalletId, setSelectedWalletId] = useState("");

  const defaultWalletId = wallets[0]?._id || wallets[0]?.id || "";
  const walletIdToUse = selectedWalletId || defaultWalletId;

  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !shares || Number(shares) <= 0) {
      showToast("Enter a valid number of shares", "error");
      return;
    }
    const qty = Number(shares);
    const price = Number(selectedStock.price ?? selectedStock.currentPrice ?? 0);
    try {
      await createInvestment.mutateAsync({
        productId: selectedStock._id || selectedStock.id || selectedStock.assetId || selectedStock.symbol,
        quantity: qty,
        amount: qty * price,
        sourceAccountId: walletIdToUse,
      } as any);
      setSelectedStock(null);
      setShares("1");
    } catch {
      // handled by mutation onError
    }
  };

  const defaultStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 189.25, change: 2.34, pctChange: 1.25, marketCap: 2940000000000 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 141.8, change: -0.95, pctChange: -0.67, marketCap: 1790000000000 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 374.58, change: 4.12, pctChange: 1.11, marketCap: 2780000000000 },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.25, change: 1.56, pctChange: 0.88, marketCap: 1850000000000 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 248.42, change: -3.21, pctChange: -1.28, marketCap: 788000000000 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 495.22, change: 12.45, pctChange: 2.58, marketCap: 1220000000000 },
    { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 454.32, change: 2.18, pctChange: 0.48, marketCap: 425000000000 },
    { symbol: "QQQ", name: "Invesco QQQ Trust", price: 387.65, change: 3.42, pctChange: 0.89, marketCap: 198000000000 },
  ];

  const stocks = apiStocks.length > 0 ? apiStocks : defaultStocks;

  const filtered = useMemo(
    () =>
      stocks.filter(
        (s: any) =>
          !search ||
          (s.symbol ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (s.name ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [stocks, search],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Stocks & ETFs"
        subtitle="Trade stocks and exchange-traded funds"
        breadcrumbs={[
          { label: "Dashboard", href: "/customer/dashboard" },
          { label: "Investments", href: "/customer/investments" },
          { label: "Stocks & ETFs" },
        ]}
      />

      {isLoading ? (
        <>
          <StatsGridSkeleton count={3} />
          <TableSkeleton rows={6} />
        </>
      ) : (
        <motion.div variants={dashboardItemVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* ── Search ─────────────────────────────────────────────── */}
          <DashCard>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                placeholder="Search stocks or ETFs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs text-gray-900 transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 sm:text-sm"
              />
            </div>
          </DashCard>

          {/* ── Stocks Table ───────────────────────────────────────── */}
          <DashCard padding="none">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-6 sm:py-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">Market Quotes</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Real-time stock and ETF prices</p>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6">
                <EmptyState variant="search" title="No stocks found" description="Try a different search term." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                        Symbol
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                        Name
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                        Change
                      </th>
                      <th className="hidden px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell sm:text-xs">
                        Market Cap
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filtered.map((stock: any, idx: number) => {
                      const change = stock.change ?? 0;
                      const changePct = stock.pctChange ?? stock.changePercent ?? 0;
                      const positive = change >= 0;
                      return (
                        <tr
                          key={stock.symbol ?? idx}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30"
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">
                              {stock.symbol}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                            {stock.name}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                            {fmt(stock.price ?? 0)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {positive ? (
                                <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
                              ) : (
                                <TrendingDown size={12} className="text-rose-500 dark:text-rose-400" />
                              )}
                              <span
                                className={`text-xs font-medium sm:text-sm ${
                                  positive
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {positive ? "+" : ""}
                                {changePct.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td className="hidden whitespace-nowrap px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 sm:table-cell sm:text-sm">
                            {stock.marketCap ? fmtCompact(stock.marketCap) : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <motion.button
                              onClick={() => {
                                setSelectedStock(stock);
                                setShares("1");
                              }}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 sm:text-xs"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              Trade
                            </motion.button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </DashCard>

          {/* Trade Modal */}
          {selectedStock && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <DashCard className="w-full max-w-md">
                <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                  Buy {selectedStock.symbol} ({selectedStock.name})
                </h3>
                <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                  Market Price: {fmt(selectedStock.price ?? selectedStock.currentPrice ?? 0)} per share
                </p>
                <form onSubmit={handleTradeSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Quantity (Shares)
                    </label>
                    <input
                      type="number"
                      min={0.01}
                      step="any"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Estimated Total:{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {fmt(Number(shares || 0) * Number(selectedStock.price ?? selectedStock.currentPrice ?? 0))}
                    </strong>
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
                      onClick={() => setSelectedStock(null)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createInvestment.isPending}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createInvestment.isPending ? "Executing…" : "Confirm Order"}
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

export default StocksETFs;
