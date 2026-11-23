import { ApiEndpoints } from "../../core/api/endpoint";
// ============================================================================
// INVESTMENTS API - Savings and investment endpoints
// ============================================================================

import apiClient, { ApiResponse, PaginatedResponse } from "../../core/api/client";


// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface InvestmentFilters {
  type?: InvestmentType;
  status?: InvestmentStatus;
  page?: number;
  limit?: number;
}

// ============================================================================
// INVESTMENTS API FUNCTIONS
// ============================================================================

export const InvestmentsRepository = {
  // ==========================================================================
  // INVESTMENT MANAGEMENT
  // ==========================================================================

  /**
   * Get all user investments (maps to /investments/portfolio)
   */
  getAll: async (params?: InvestmentFilters): Promise<PaginatedResponse<Investment>> => {
    const response = await apiClient.get<PaginatedResponse<Investment>>(ApiEndpoints.investmentsPortfolio, { params });
    return response.data;
  },

  /**
   * Get investment by ID
   */
  getById: async (investmentId: UUID): Promise<ApiResponse<Investment>> => {
    const response = await apiClient.get<ApiResponse<Investment>>(ApiEndpoints.investmentAsset(investmentId));
    return response.data;
  },

  /**
   * Get active investments
   */
  getActive: async (): Promise<ApiResponse<Investment[]>> => {
    const response = await apiClient.get<ApiResponse<Investment[]>>(ApiEndpoints.investmentsPortfolio);
    return response.data;
  },

  /**
   * Get investment summary/portfolio
   */
  getSummary: async (): Promise<
    ApiResponse<{
      totalInvested: number;
      currentValue: number;
      totalReturns: number;
      returnPercentage: number;
      activeInvestments: number;
      maturedInvestments: number;
      byType: Record<
        InvestmentType,
        {
          count: number;
          invested: number;
          currentValue: number;
        }
      >;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        totalInvested: number;
        currentValue: number;
        totalReturns: number;
        returnPercentage: number;
        activeInvestments: number;
        maturedInvestments: number;
        byType: Record<
          InvestmentType,
          {
            count: number;
            invested: number;
            currentValue: number;
          }
        >;
      }>
    >(ApiEndpoints.investmentsSummary);
    return response.data;
  },

  // ==========================================================================
  // INVESTMENT PRODUCTS
  // ==========================================================================

  /**
   * Get available investment products (fetches assets + plans from backend)
   */
  getProducts: async (type?: InvestmentType): Promise<ApiResponse<InvestmentProduct[]>> => {
    const [assetsRes, plansRes] = await Promise.allSettled([
      apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsAssets, {
        params: type ? { type } : undefined,
      }),
      apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsPlans),
    ]);

    const assetsData =
      assetsRes.status === "fulfilled" ? (assetsRes.value.data?.data ?? assetsRes.value.data) : {};
    const plansData =
      plansRes.status === "fulfilled" ? (plansRes.value.data?.data ?? plansRes.value.data) : {};

    const assets = Array.isArray(assetsData)
      ? assetsData
      : Array.isArray(assetsData?.assets)
        ? assetsData.assets
        : [];
    const plans = Array.isArray(plansData)
      ? plansData
      : Array.isArray(plansData?.plans)
        ? plansData.plans
        : [];

    const combined = [...assets, ...plans];
    return {
      success: true,
      data: combined as InvestmentProduct[],
      message: "Investment products retrieved",
    };
  },

  /**
   * Get product details
   */
  getProductDetails: async (
    productId: UUID,
  ): Promise<
    ApiResponse<
      InvestmentProduct & {
        historicalReturns: Array<{
          period: string;
          return: number;
        }>;
        terms: string[];
        risks: string[];
      }
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        InvestmentProduct & {
          historicalReturns: Array<{
            period: string;
            return: number;
          }>;
          terms: string[];
          risks: string[];
        }
      >
    >(ApiEndpoints.investmentAsset(productId));
    return response.data;
  },

  // ==========================================================================
  // CREATE & MANAGE
  // ==========================================================================

  /**
   * Create a new investment / buy asset (maps to POST /investments/buy)
   * Supports payment via either user Wallet (walletId) OR user Card (cardId).
   */
  create: async (data: CreateInvestmentRequest & Record<string, any>): Promise<ApiResponse<Investment>> => {
    const payload = {
      ...data,
      assetId: data.assetId || data.productId || data.symbol || (data as any).id,
      quantity: data.quantity || 1,
      walletId: data.walletId || data.sourceAccountId || (data as any).accountId,
      cardId: data.cardId,
      paymentMethod: data.paymentMethod || (data.cardId ? "card" : "wallet"),
    };
    const response = await apiClient.post<ApiResponse<Investment>>(ApiEndpoints.investmentsBuy, payload);
    return response.data;
  },

  /**
   * Swap between two investment assets (stocks, ETFs, crypto, bonds)
   */
  swap: async (data: {
    fromAssetId: string;
    toAssetId: string;
    fromQuantity?: number;
    usdAmount?: number;
    amount?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(ApiEndpoints.investmentsSwap, data);
    return response.data;
  },

  /**
   * Get live CoinMarketCap cryptocurrency market listings
   */
  getCryptoMarket: async (refresh = false): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsCrypto, {
      params: refresh ? { refresh: "true" } : undefined,
    });
    return response.data;
  },

  /**
   * Get live Equities (Stocks & ETFs) market listings
   */
  getStockMarket: async (refresh = false): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsStocks, {
      params: refresh ? { refresh: "true" } : undefined,
    });
    return response.data;
  },

  /**
   * Get live Forex interbank exchange rates & currency pairs
   */
  getForexRates: async (refresh = false): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsForexRates, {
      params: refresh ? { refresh: "true" } : undefined,
    });
    return response.data;
  },

  /**
   * Convert currency via live Forex engine
   */
  convertForex: async (params: { from: string; to: string; amount: number }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsForexConvert, { params });
    return response.data;
  },

  /**
   * Execute real wallet-to-wallet currency exchange via Forex engine
   */
  exchangeForex: async (data: {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
    walletId: string;
    targetWalletId?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(ApiEndpoints.investmentsForexExchange, data);
    return response.data;
  },

  /**
   * Admin: Get platform-wide investments, portfolios, savings goals & market overview
   */
  getAdminOverview: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsAdminOverview);
    return response.data;
  },

  /**
   * Admin: Force-sync live market feeds (CoinMarketCap, Stocks & Forex)
   */
  syncAdminMarkets: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(ApiEndpoints.investmentsAdminSync);
    return response.data;
  },

  /**
   * Admin: Create or update market asset / forex rate
   */
  upsertAdminAsset: async (data: Record<string, any>): Promise<ApiResponse<any>> => {
    const response = data.assetId || data._id
      ? await apiClient.put<ApiResponse<any>>(ApiEndpoints.investmentAdminAsset(data.assetId || data._id), data)
      : await apiClient.post<ApiResponse<any>>(ApiEndpoints.investmentsAdminAssets, data);
    return response.data;
  },

  /**
   * Admin: Deactivate market asset
   */
  deleteAdminAsset: async (assetId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>(ApiEndpoints.investmentAdminAsset(assetId));
    return response.data;
  },

  /**
   * Calculate investment returns
   */
  calculate: async (data: {
    type: InvestmentType;
    amount: number;
    term: number;
  }): Promise<
    ApiResponse<{
      principal: number;
      interestRate: number;
      expectedReturns: number;
      maturityValue: number;
      maturityDate: string;
    }>
  > => {
    const response = await apiClient.post<
      ApiResponse<{
        principal: number;
        interestRate: number;
        expectedReturns: number;
        maturityValue: number;
        maturityDate: string;
      }>
    >(`/investments/calculate`, data);
    return response.data;
  },

  /**
   * Top up an existing investment
   */
  topUp: async (
    investmentId: UUID,
    data: {
      amount: number;
      sourceAccountId: UUID;
    },
  ): Promise<ApiResponse<Investment>> => {
    const response = await apiClient.post<ApiResponse<Investment>>(`/investments/${investmentId}/top-up`, data);
    return response.data;
  },

  /**
   * Toggle auto-renew
   */
  toggleAutoRenew: async (investmentId: UUID): Promise<ApiResponse<Investment>> => {
    const response = await apiClient.patch<ApiResponse<Investment>>(`/investments/${investmentId}/auto-renew`);
    return response.data;
  },

  // ==========================================================================
  // WITHDRAWALS
  // ==========================================================================

  /**
   * Withdraw / sell from investment (maps to POST /investments/sell)
   */
  withdraw: async (
    investmentId: UUID,
    data: {
      amount?: number; // If not provided, withdraw all
      quantity?: number;
      destinationAccountId: UUID;
      walletId?: UUID;
      pin: string;
    },
  ): Promise<
    ApiResponse<{
      investment: Investment;
      withdrawnAmount: number;
      penalty?: number;
      netAmount: number;
    }>
  > => {
    const response = await apiClient.post<
      ApiResponse<{
        investment: Investment;
        withdrawnAmount: number;
        penalty?: number;
        netAmount: number;
      }>
    >(ApiEndpoints.investmentsSell, {
      portfolioId: investmentId,
      quantity: data.quantity || data.amount || 1,
      walletId: data.walletId || data.destinationAccountId,
      pin: data.pin,
    });
    return response.data;
  },

  /**
   * Get early withdrawal penalty
   */
  getWithdrawalPenalty: async (
    investmentId: UUID,
    amount?: number,
  ): Promise<
    ApiResponse<{
      withdrawableAmount: number;
      penalty: number;
      penaltyPercentage: number;
      netAmount: number;
      accruedInterest: number;
      lostInterest: number;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        withdrawableAmount: number;
        penalty: number;
        penaltyPercentage: number;
        netAmount: number;
        accruedInterest: number;
        lostInterest: number;
      }>
    >(`/investments/${investmentId}/withdrawal-penalty`, {
      params: amount ? { amount } : undefined,
    });
    return response.data;
  },

  // ==========================================================================
  // HISTORY & STATEMENTS
  // ==========================================================================

  /**
   * Get investment transactions
   */
  getTransactions: async (
    investmentId: UUID,
    params?: {
      page?: number;
      limit?: number;
    },
  ): Promise<
    PaginatedResponse<{
      id: UUID;
      type: "deposit" | "interest" | "withdrawal" | "penalty";
      amount: number;
      balance: number;
      date: string;
      description: string;
    }>
  > => {
    const response = await apiClient.get<
      PaginatedResponse<{
        id: UUID;
        type: "deposit" | "interest" | "withdrawal" | "penalty";
        amount: number;
        balance: number;
        date: string;
        description: string;
      }>
    >(ApiEndpoints.investmentsPortfolioTransactions, {
      params: { ...params, portfolioId: investmentId },
    });
    return response.data;
  },

  /**
   * Get interest history
   */
  getInterestHistory: async (
    investmentId: UUID,
  ): Promise<
    ApiResponse<
      Array<{
        date: string;
        rate: number;
        amount: number;
        balance: number;
      }>
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          date: string;
          rate: number;
          amount: number;
          balance: number;
        }>
      >
    >(`/investments/${investmentId}/interest-history`);
    return response.data;
  },

  /**
   * Get investment statement
   */
  getStatement: async (
    investmentId: UUID,
    params: {
      startDate: string;
      endDate: string;
      format?: "pdf" | "csv";
    },
  ): Promise<ApiResponse<{ downloadUrl: string }>> => {
    const response = await apiClient.get<ApiResponse<{ downloadUrl: string }>>(
      `/investments/${investmentId}/statement`,
      { params },
    );
    return response.data;
  },

  // ==========================================================================
  // SAVINGS GOALS
  // ==========================================================================

  /**
   * Get savings goals
   */
  getSavingsGoals: async (): Promise<
    ApiResponse<
      Array<{
        id: UUID;
        name: string;
        targetAmount: number;
        currentAmount: number;
        targetDate: string;
        progress: number;
        linkedInvestmentId?: UUID;
        autoSaveEnabled: boolean;
        autoSaveAmount?: number;
        autoSaveFrequency?: "daily" | "weekly" | "monthly";
      }>
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: UUID;
          name: string;
          targetAmount: number;
          currentAmount: number;
          targetDate: string;
          progress: number;
          linkedInvestmentId?: UUID;
          autoSaveEnabled: boolean;
          autoSaveAmount?: number;
          autoSaveFrequency?: "daily" | "weekly" | "monthly";
        }>
      >
    >(ApiEndpoints.investmentsSavings);
    return response.data;
  },

  /**
   * Create savings goal
   */
  createSavingsGoal: async (data: {
    name: string;
    targetAmount: number;
    targetDate: string;
    initialAmount?: number;
    sourceAccountId?: UUID;
    accountId?: UUID;
    walletId?: UUID;
    category?: string;
    description?: string;
    autoSaveEnabled?: boolean;
    autoSaveAmount?: number;
    autoSaveFrequency?: "daily" | "weekly" | "biweekly" | "monthly";
    autoSave?: {
      enabled: boolean;
      amount: number;
      frequency: "daily" | "weekly" | "biweekly" | "monthly";
    };
  }): Promise<
    ApiResponse<{
      id: UUID;
      name: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
      progress: number;
    }>
  > => {
    const payload = {
      ...data,
      walletId: data.walletId || data.sourceAccountId || data.accountId,
      autoSaveEnabled: data.autoSaveEnabled ?? data.autoSave?.enabled ?? false,
      autoSaveAmount: data.autoSaveAmount ?? data.autoSave?.amount,
      autoSaveFrequency: data.autoSaveFrequency ?? data.autoSave?.frequency,
    };
    const response = await apiClient.post<
      ApiResponse<{
        id: UUID;
        name: string;
        targetAmount: number;
        currentAmount: number;
        targetDate: string;
        progress: number;
      }>
    >(ApiEndpoints.investmentsSavings, payload);
    return response.data;
  },

  /**
   * Update savings goal
   */
  updateSavingsGoal: async (
    goalId: UUID,
    data: {
      name?: string;
      targetAmount?: number;
      targetDate?: string;
      autoSaveEnabled?: boolean;
      autoSaveAmount?: number;
      autoSaveFrequency?: "daily" | "weekly" | "monthly";
    },
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.patch<ApiResponse<{ message: string }>>(
      ApiEndpoints.investmentSavingsGoal(goalId),
      data,
    );
    return response.data;
  },

  /**
   * Delete savings goal
   */
  deleteSavingsGoal: async (goalId: UUID, transferToWalletId?: UUID): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      ApiEndpoints.investmentSavingsGoal(goalId),
      transferToWalletId ? { data: { transferToWalletId } } : undefined,
    );
    return response.data;
  },

  /**
   * Add funds to savings goal
   */
  addToSavingsGoal: async (
    goalId: UUID,
    data: {
      amount: number;
      sourceAccountId: UUID;
      walletId?: UUID;
    },
  ): Promise<ApiResponse<{ message: string; newBalance: number }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string; newBalance: number }>>(
      ApiEndpoints.investmentSavingsDeposit(goalId),
      {
        ...data,
        walletId: data.walletId || data.sourceAccountId,
      },
    );
    return response.data;
  },

  // ==========================================================================
  // EXTENDED METHODS (map to available backend endpoints)
  // ==========================================================================

  /** Get investment portfolio + summary */
  getPortfolio: async (): Promise<ApiResponse<any>> => {
    const [portfolioRes, summaryRes] = await Promise.allSettled([
      apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsPortfolio),
      apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentsSummary),
    ]);

    const pData =
      portfolioRes.status === "fulfilled"
        ? (portfolioRes.value.data?.data ?? portfolioRes.value.data ?? {})
        : {};
    const sData =
      summaryRes.status === "fulfilled"
        ? (summaryRes.value.data?.data ?? summaryRes.value.data ?? {})
        : {};

    const summary = sData?.summary || sData || {};
    const portfolios = Array.isArray(pData)
      ? pData
      : Array.isArray(pData?.portfolios)
        ? pData.portfolios
        : [];

    return {
      success: true,
      data: {
        ...summary,
        ...pData,
        portfolio: {
          totalValue: summary.portfolioValue ?? summary.currentValue ?? summary.totalNetWorth ?? 0,
          totalInvested: summary.totalInvested ?? 0,
          totalReturns: summary.totalGainLoss ?? summary.totalReturns ?? 0,
          returnPercentage: summary.returnPercentage ?? 0,
          ...summary,
        },
        portfolios,
      },
      message: "Portfolio retrieved",
    };
  },

  /** Get product by ID — alias for getProductDetails */
  getProductById: async (productId: UUID): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentAsset(productId));
    return response.data;
  },

  /** Get investment performance */
  getPerformance: async (investmentId: UUID, params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/investments/${investmentId}/performance`, {
      params,
    });
    return response.data;
  },

  /** Close an investment */
  close: async (investmentId: UUID, data?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(`/investments/${investmentId}/close`, data);
    return response.data;
  },

  /** Set up recurring investment */
  setupRecurring: async (investmentId: UUID, data?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(`/investments/${investmentId}/recurring`, data);
    return response.data;
  },

  /** Cancel recurring investment */
  cancelRecurring: async (investmentId: UUID): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete<ApiResponse<any>>(`/investments/${investmentId}/recurring`);
    return response.data;
  },

  /** Get savings goal by ID */
  getSavingsGoalById: async (goalId: UUID): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentSavingsGoal(goalId));
    return response.data;
  },

  /** Get savings goal progress */
  getSavingsGoalProgress: async (goalId: UUID): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.investmentSavingsGoal(goalId));
    return response.data;
  },

  /** Withdraw from savings goal */
  withdrawFromSavingsGoal: async (goalId: UUID, data?: any): Promise<ApiResponse<any>> => {
    const payload = data
      ? {
          ...data,
          walletId: data.walletId || data.accountId || data.sourceAccountId,
        }
      : undefined;
    const response = await apiClient.post<ApiResponse<any>>(
      ApiEndpoints.investmentSavingsWithdraw(goalId),
      payload,
    );
    return response.data;
  },
};

export default InvestmentsRepository;
