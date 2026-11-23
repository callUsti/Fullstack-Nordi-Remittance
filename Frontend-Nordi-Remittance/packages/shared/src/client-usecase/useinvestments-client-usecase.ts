// ============================================================================
// useInvestmentsDomain — Domain use-case hook for Investments
//
// Wraps raw @hooks/queries with response normalization and typed returns.
// Shared between apps/website and apps/mobile.
// ============================================================================

import { useMemo } from "react";
import {
  useInvestments,
  useInvestment,
  useInvestmentPortfolio,
  useInvestmentProducts,
  useInvestmentProduct,
  useInvestmentPerformance,
  useInvestmentTransactions,
  useCreateInvestment,
  useTopUpInvestment,
  useWithdrawInvestment,
  useCloseInvestment,
  useSetupRecurringInvestment,
  useCancelRecurringInvestment,
  useCryptoMarket,
  useStockMarket,
  useForexRates,
  useSwapAsset,
  useExchangeForex,
} from "../hooks/api-queries/useInvestments";
import { multiKeySort, topK, formatCurrency } from "../core/algo";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Response Unwrappers ─────────────────────────────────────────────────────
const extractArray = (d: unknown, ...keys: string[]): any[] => {
  if (Array.isArray(d)) return d;
  if (!d || typeof d !== "object") return [];
  const obj = d as Record<string, any>;
  for (const k of keys) {
    if (Array.isArray(obj[k])) return obj[k];
  }
  if (Array.isArray(obj.data)) return obj.data;
  if (obj.data && typeof obj.data === "object") {
    for (const k of keys) {
      if (Array.isArray(obj.data[k])) return obj.data[k];
    }
    if (Array.isArray(obj.data.data)) return obj.data.data;
  }
  return [];
};

const extractObject = (d: unknown, ...keys: string[]): Record<string, any> => {
  if (!d || typeof d !== "object") return {};
  const obj = d as Record<string, any>;
  for (const k of keys) {
    if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) return obj[k];
  }
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) return obj.data;
  return obj;
};

const extractPagination = (d: unknown): PaginationMeta | null => {
  if (!d || typeof d !== "object") return null;
  const obj = d as Record<string, any>;
  return obj.pagination || obj.data?.pagination || obj.meta || null;
};

// ============================================================================
// QUERIES
// ============================================================================

/** All investments for logged-in user */
export function useClientInvestments(filters?: {
  type?: InvestmentType;
  status?: InvestmentStatus;
  page?: number;
  limit?: number;
}) {
  const { data: raw, isLoading, error, refetch } = useInvestments(filters);

  const result = useMemo(() => {
    const investments = extractArray(raw, "investments", "portfolios", "accounts");
    const pagination = extractPagination(raw);
    return { investments, pagination };
  }, [raw]);

  return { ...result, isLoading, error, refetch };
}

/** Single investment detail */
export function useClientInvestment(investmentId: UUID) {
  const { data: raw, isLoading, error } = useInvestment(investmentId);
  const investment = useMemo(() => extractObject(raw, "investment", "asset", "account"), [raw]);
  return { investment, isLoading, error };
}

/** Portfolio summary with top holdings */
export function useClientPortfolio() {
  const { data: raw, isLoading, error, refetch } = useInvestmentPortfolio();

  const portfolio = useMemo(() => {
    const p = extractObject(raw, "portfolio", "summary");
    const holdings = extractArray(raw, "portfolios", "holdings", "assets");

    const topHoldings = topK(
      holdings.map((h: any) => ({
        id: h._id || h.portfolioId || h.id || h.symbol || "",
        name: h.assetName || h.name || h.symbol || "Asset",
        symbol: h.assetSymbol || h.symbol || "",
        type: h.assetType || h.type || "mutual_fund",
        quantity: h.quantity || 0,
        currentValue: h.currentValue || h.totalInvested || 0,
        unrealizedGain: h.unrealizedGainLoss || h.unrealizedGain || h.change || 0,
        unrealizedGainPct: h.unrealizedGainLossPercentage || h.unrealizedGainPercentage || 0,
        _raw: h,
      })),
      10,
      (a, b) => b.currentValue - a.currentValue,
    );

    const computedValue = topHoldings.reduce((s, h) => s + Number(h.currentValue || 0), 0);
    const computedGain = topHoldings.reduce((s, h) => s + Number(h.unrealizedGain || 0), 0);

    return {
      totalValue: p.totalValue || p.portfolioValue || p.currentValue || computedValue || 0,
      totalInvested: p.totalInvested || Math.max(0, computedValue - computedGain) || 0,
      totalReturns: p.totalReturns || p.totalGainLoss || computedGain || 0,
      returnPercentage: p.returnPercentage || p.returnPct || 0,
      holdings: topHoldings,
      _raw: p,
    };
  }, [raw]);

  return { portfolio, isLoading, error, refetch };
}

/** Available investment products */
export function useClientInvestmentProducts(filters?: {
  type?: InvestmentType;
  minInvestment?: number;
  riskLevel?: "low" | "medium" | "high";
}) {
  const { data: raw, isLoading, error } = useInvestmentProducts(filters);
  const products = useMemo(
    () => extractArray(raw, "products", "assets", "plans", "investmentProducts"),
    [raw],
  );
  return { products, isLoading, error };
}

/** Investment product detail */
export function useClientInvestmentProduct(productId: UUID) {
  const { data: raw, isLoading, error } = useInvestmentProduct(productId);
  const product = useMemo(() => extractObject(raw, "product"), [raw]);
  return { product, isLoading, error };
}

/** Investment performance */
export function useClientInvestmentPerformance(investmentId: UUID, period?: "1M" | "3M" | "6M" | "1Y" | "ALL") {
  const { data: raw, isLoading, error } = useInvestmentPerformance(investmentId, period);

  const performance = useMemo(() => {
    const p = extractObject(raw, "performance");
    const dataPoints = extractArray(raw, "dataPoints", "history", "series");
    return { ...p, dataPoints };
  }, [raw]);

  return { performance, isLoading, error };
}

/** Investment transactions (paginated) */
export function useClientInvestmentTransactions(investmentId: UUID, params?: { page?: number; limit?: number }) {
  const { data: raw, isLoading, error } = useInvestmentTransactions(investmentId, params);

  const result = useMemo(() => {
    const transactions = extractArray(raw, "transactions");
    const pagination = extractPagination(raw);
    return { transactions, pagination };
  }, [raw]);

  return { ...result, isLoading, error };
}

// ============================================================================
// COMPUTED HELPERS
// ============================================================================

export function formatInvestmentValue(amount: number, currency = "USD") {
  return formatCurrency(amount, currency);
}

// ============================================================================
// LIVE CRYPTO (COINMARKETCAP), STOCKS & FOREX MARKET QUERIES
// ============================================================================

export function useClientCryptoMarket(refresh = false) {
  const { data: raw, isLoading, error, refetch } = useCryptoMarket(refresh);
  const market = useMemo(() => {
    const obj = extractObject(raw);
    const assets = extractArray(raw, "assets", "crypto", "coins");
    return {
      provider: obj.provider || "CoinMarketCap Live Feed",
      usingLiveKey: Boolean(obj.usingLiveKey),
      assets,
    };
  }, [raw]);
  return { ...market, isLoading, error, refetch };
}

export function useClientStockMarket(refresh = false) {
  const { data: raw, isLoading, error, refetch } = useStockMarket(refresh);
  const market = useMemo(() => {
    const obj = extractObject(raw);
    const stocks = extractArray(raw, "stocks");
    const etfs = extractArray(raw, "etfs");
    const assets = extractArray(raw, "assets");
    return {
      provider: obj.provider || "NASDAQ / NYSE Live Feed",
      usingLiveKey: Boolean(obj.usingLiveKey),
      stocks,
      etfs,
      assets: assets.length > 0 ? assets : [...stocks, ...etfs],
    };
  }, [raw]);
  return { ...market, isLoading, error, refetch };
}

export function useClientForexMarket(refresh = false) {
  const { data: raw, isLoading, error, refetch } = useForexRates(refresh);
  const market = useMemo(() => {
    const obj = extractObject(raw);
    const pairs = extractArray(raw, "pairs", "assets");
    const rates = (obj.rates || (raw as any)?.rates || {}) as Record<string, number>;
    return {
      provider: obj.provider || "Open ExchangeRate / ECB Interbank",
      baseCurrency: obj.baseCurrency || "USD",
      rates,
      pairs,
    };
  }, [raw]);
  return { ...market, isLoading, error, refetch };
}

// ============================================================================
// MUTATIONS (pass-through)
// ============================================================================

export {
  useCreateInvestment,
  useTopUpInvestment,
  useWithdrawInvestment,
  useCloseInvestment,
  useSetupRecurringInvestment,
  useCancelRecurringInvestment,
  useSwapAsset,
  useExchangeForex,
};
