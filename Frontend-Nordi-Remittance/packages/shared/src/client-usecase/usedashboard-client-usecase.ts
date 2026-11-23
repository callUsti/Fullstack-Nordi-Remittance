// ============================================================================
// useClientDashboard — Single aggregator hook for the client dashboard
//
// Wraps raw queries, normalizing into typed domain structures via useMemo.
// Shared between apps/website and apps/mobile.
// ============================================================================

import { useMemo } from "react";
import {
  useDashboardOverview,
  useWallets,
  useAccountApplications,
  useAccountSummary,
  useRecentTransactions,
  useBudgetProgress,
  useInvestmentPortfolio,
  useInvestments,
  useLoans,
  useCards,
  useSavingsGoals,
  useUnreadNotifications,
  useUnreadNotificationsCount,
  useFinancialInsights,
  useTwoFactorStatus,
} from "../hooks/api-queries";
import { useUserProfile } from "../hooks/api-queries/useUsers";
import { multiKeySort, topK, extractArray, extractObject } from "../core/algo";
import { mergeWalletsAndApplications } from "./useaccounts-client-usecase";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useClientDashboard(): ClientDashboardData {
  // ── Raw queries ──────────────────────────────────────────────────────────
  const { data: overviewRaw, isLoading: overviewLoading, isError: overviewError } = useDashboardOverview();
  const { data: walletsRaw, isLoading: walletsLoading, isError: walletsError } = useWallets();
  const { data: appsRaw, isLoading: appsLoading } = useAccountApplications();
  const { data: summaryRaw } = useAccountSummary();
  const { data: txRaw, isLoading: txLoading, isError: txError } = useRecentTransactions(5);
  const { data: budgetRaw, isLoading: budgetLoading, isError: budgetError } = useBudgetProgress();
  const { data: portfolioRaw, isLoading: portfolioLoading, isError: portfolioError } = useInvestmentPortfolio();
  const { data: investmentsListRaw, isLoading: investmentsListLoading, isError: investmentsListError } = useInvestments();
  const { data: loansRaw, isLoading: loansLoading, isError: loansError } = useLoans();
  const { data: cardsRaw, isLoading: cardsLoading, isError: cardsError } = useCards();
  const { data: goalsRaw, isLoading: goalsLoading, isError: goalsError } = useSavingsGoals();
  const { data: notifsRaw, isLoading: notifsLoading, isError: notifsError } = useUnreadNotifications(5);
  const { data: countRaw } = useUnreadNotificationsCount();
  const { data: insightsRaw, isLoading: insightsLoading, isError: insightsError } = useFinancialInsights();
  const { data: profileRaw, isLoading: profileLoading, isError: profileError } = useUserProfile();
  const { data: tfaRaw, isLoading: tfaLoading, isError: tfaError } = useTwoFactorStatus();

  // ── Account Summary (All Wallets + Savings, Current, Fixed Deposit Applications) ──
  const account = useMemo<AccountSummaryData>(() => {
    const stats = extractObject(overviewRaw, "statistics");
    const summaryObj = extractObject(summaryRaw, "summary");

    const rawWalletsFromList = extractArray(walletsRaw, "wallets");
    const rawWalletsFromSummary = extractArray(summaryRaw, "wallets");
    const rawWallets = rawWalletsFromList.length > 0 ? rawWalletsFromList : rawWalletsFromSummary;

    const rawAppsFromEndpoint = extractArray(appsRaw, "applications");
    const rawAppsFromWallets = extractArray(walletsRaw, "applications");
    const rawAppsFromSummary = extractArray(summaryRaw, "applications");
    const rawApps =
      rawAppsFromEndpoint.length > 0
        ? rawAppsFromEndpoint
        : rawAppsFromWallets.length > 0
          ? rawAppsFromWallets
          : rawAppsFromSummary;

    const unifiedWallets = mergeWalletsAndApplications(rawWallets, rawApps);

    const mapped: WalletItem[] = unifiedWallets.map((w) => ({
      id: w.id,
      walletId: w.isApplicationOnly ? undefined : w.id,
      applicationId: w.applicationId,
      name: w.displayName,
      nickname: w.nickname,
      accountNumber: w.walletNumber || "0000",
      type: w.type,
      typeLabel: w.typeLabel,
      balance: w.rawTotalBalance,
      currency: w.primaryCurrency || "USD",
      balancesByCurrency: w.balancesByCurrency,
      status: w.status,
      isPrimary: w.isPrimary,
      isApplicationOnly: w.isApplicationOnly,
      initialDeposit: w.initialDeposit,
      goal: w.goal,
      autoSave: w.autoSave,
      autoSaveAmount: w.autoSaveAmount,
      purpose: w.purpose,
      businessName: w.businessName,
      expectedMonthlyVolume: w.expectedMonthlyVolume,
      overdraftRequested: w.overdraftRequested,
      overdraftLimit: w.overdraftLimit,
      principal: w.principal,
      termMonths: w.termMonths,
      interestRate: w.interestRate,
      maturityDate: w.maturityDate,
      autoRenew: w.autoRenew,
      recentTransactionsCount: w.recentTransactionsCount,
      createdAt: w.createdAt,
    }));

    const computedBalance = mapped.reduce((s, w) => s + (Number(w.balance) || 0), 0);

    const savingsAccounts = mapped.filter((w) => w.type === "savings");
    const currentAccounts = mapped.filter(
      (w) => w.type === "current" || w.type === "personal" || w.type === "business",
    );
    const fixedDepositAccounts = mapped.filter((w) => w.type === "fixed_deposit");
    const personalAccounts = mapped.filter((w) => w.type === "personal" || w.type === "business");

    const savingsBalance = savingsAccounts.reduce((s, w) => s + (Number(w.balance) || 0), 0);
    const currentBalance = currentAccounts.reduce((s, w) => s + (Number(w.balance) || 0), 0);
    const fixedDepositBalance = fixedDepositAccounts.reduce((s, w) => s + (Number(w.balance) || 0), 0);
    const personalBalance = personalAccounts.reduce((s, w) => s + (Number(w.balance) || 0), 0);

    // Compute monthly income / expenses from summary, stats, or fallback to recent transactions
    const txArray = extractArray(txRaw, "transactions");
    let txInflow = 0;
    let txOutflow = 0;
    for (const tx of txArray) {
      const amt = Number(tx.amount) || 0;
      if (["deposit", "credit", "funding", "bonus", "refund", "loan_disbursement"].includes(tx.type)) {
        txInflow += amt;
      } else {
        txOutflow += amt;
      }
    }

    const monthlyIncome =
      Number(summaryObj?.monthlyStats?.incoming || stats?.monthlyIncome || stats?.totalReceived || 0) || txInflow;
    const monthlyExpenses =
      Number(summaryObj?.monthlyStats?.outgoing || stats?.monthlyExpenses || stats?.totalSent || 0) || txOutflow;

    return {
      totalBalance: Math.max(
        computedBalance,
        Number(summaryObj?.totalBalance || 0),
        Number(stats?.wallets?.totalBalance || stats?.totalBalance || 0),
      ),
      monthlyIncome,
      monthlyExpenses,
      savingsBalance,
      savingsCount: savingsAccounts.length,
      currentBalance,
      currentCount: currentAccounts.length,
      fixedDepositBalance,
      fixedDepositCount: fixedDepositAccounts.length,
      personalBalance,
      personalCount: personalAccounts.length,
      wallets: mapped,
    };
  }, [overviewRaw, walletsRaw, appsRaw, summaryRaw, txRaw]);

  // ── Recent Transactions (sorted by date DESC via multiKeySort) ──────────
  const recentTransactions = useMemo<TransactionItem[]>(() => {
    const txArray = extractArray(txRaw, "transactions");
    const mapped: TransactionItem[] = txArray.map((tx: any) => ({
      id: tx.id || tx._id || "",
      title: tx.recipientName || tx.description || tx.title || "Transaction",
      description: tx.category || tx.type || "",
      amount: tx.amount || 0,
      currency: tx.currency || "USD",
      type: tx.type === "credit" || tx.type === "deposit" ? "credit" : tx.type === "transfer" ? "transfer" : "debit",
      status: tx.status || "completed",
      category: tx.category,
      date: tx.createdAt || tx.date || new Date().toISOString(),
    }));

    return multiKeySort(mapped, [{ getter: (t) => new Date(t.date).getTime(), direction: "desc" }]).slice(0, 5);
  }, [txRaw]);

  // ── Budgets (sorted by usage ratio DESC — highest pressure first) ──────
  const budgets = useMemo<BudgetItem[]>(() => {
    const budgetArray = extractArray(budgetRaw, "categories");
    const mapped: BudgetItem[] = budgetArray.map((b: any) => ({
      id: b.id || b._id || b.category || b.name || "",
      category: b.category || b.name || "Budget",
      spent: b.spent || b.current || 0,
      limit: b.limit || b.budget || b.target || 1,
    }));

    return multiKeySort(mapped, [{ getter: (b) => (b.limit > 0 ? b.spent / b.limit : 0), direction: "desc" }]).slice(0, 4);
  }, [budgetRaw]);

  // ── Investment Snapshot (topK holdings by abs change) ──────────────────
  const investments = useMemo<InvestmentSnapshot>(() => {
    const p: any = extractObject(portfolioRaw, "portfolio");
    const portfolioArr = extractArray(portfolioRaw, "assets");
    const allHoldings: HoldingItem[] = extractArray(p.holdings || p.assets || portfolioArr).map((h: any) => ({
      id: h.id || h._id || h.symbol || "",
      name: h.name || h.symbol || "Asset",
      change: h.change || 0,
    }));

    const holdings = topK(allHoldings, 3, (a, b) => Math.abs(b.change) - Math.abs(a.change));

    return {
      totalValue: p.totalValue || p.total || 0,
      totalReturn: p.totalReturn || p.returns || 0,
      returnPct: p.returnPercentage || p.returnPct || 0,
      holdings,
    };
  }, [portfolioRaw]);

  // ── Loans Snapshot (sorted by outstanding DESC) ────────────────────────
  const loans = useMemo<LoansSnapshot>(() => {
    const list = extractArray(loansRaw, "loans");
    const active = list.filter((l: any) => l.status === "active" || l.status === "approved");
    const totalOutstanding = active.reduce(
      (s: number, l: any) => s + (l.remainingAmount || l.outstanding || l.amount || 0),
      0,
    );
    const allLoans: LoanItem[] = active.map((l: any) => ({
      id: l.id || l._id || "",
      type: l.type || l.name || "Loan",
      monthlyPayment: l.monthlyPayment || l.emi || 0,
      outstanding: l.remainingAmount || l.outstanding || l.amount || 0,
      status: l.status || "active",
    }));

    const mapped = multiKeySort(allLoans, [{ getter: (l) => l.outstanding, direction: "desc" }]).slice(0, 2);

    return { activeCount: active.length, totalOutstanding, loans: mapped };
  }, [loansRaw]);

  // ── Cards ────────────────────────────────────────────────────────────────
  const cards = useMemo<CardItem[]>(() => {
    const cardsArray = extractArray(cardsRaw, "cards");
    return cardsArray
      .slice(0, 5)
      .map((c: any) => {
        const expMonth = c.expiryMonth ? String(c.expiryMonth).padStart(2, "0") : "";
        const expYear = c.expiryYear ? String(c.expiryYear) : "";
        const formattedExpiry =
          c.expiryDate || c.expiry || (expMonth && expYear ? `${expMonth}/${expYear}` : "••/••");
        const isPhys = c.isPhysical ?? (c.cardType !== "virtual" && c.type !== "virtual");
        return {
          id: c._id || c.cardId || c.id || "",
          cardId: c.cardId,
          name: c.cardholderName || c.cardName || c.name || "Card Holder",
          lastFour: c.last4 || c.lastFour || c.cardNumber?.slice(-4) || "••••",
          fullCardNumber: c.fullCardNumber || "",
          fullCvv: c.fullCvv || "",
          isVirtual: !isPhys,
          isPhysical: isPhys,
          cardBrand: (c.cardBrand || c.brand || "visa").toLowerCase(),
          cardType: (c.cardType || c.type || (isPhys ? "debit" : "virtual")).toLowerCase(),
          balance: Number(c.balance || 0),
          creditLimit: Number(c.creditLimit || 0),
          currency: c.currency || "USD",
          status: c.status || "active",
          expiryDate: formattedExpiry,
          spendLimit: Number(c.limits?.monthlyLimit || c.creditLimit || c.spendLimit || c.limit || 5000),
          usedAmount: Number(c.limits?.monthlySpent || c.usedAmount || c.currentSpend || 0),
        };
      });
  }, [cardsRaw]);

  // ── Savings Goals ────────────────────────────────────────────────────────
  const savingsGoals = useMemo<SavingsGoalItem[]>(() => {
    const goalsArray = extractArray(goalsRaw, "goals");
    return goalsArray
      .slice(0, 3)
      .map((g: any) => {
        const current = g.currentAmount || g.saved || 0;
        const target = g.targetAmount || g.target || 1;
        return {
          id: g.id || g._id || "",
          name: g.name || g.title || "Goal",
          currentAmount: current,
          targetAmount: target,
          percentage: Math.min((current / target) * 100, 100),
        };
      });
  }, [goalsRaw]);

  // ── Notifications ────────────────────────────────────────────────────────
  const notifications = useMemo<NotificationItem[]>(() => {
    const notifsArray = extractArray(notifsRaw, "notifications");
    return notifsArray
      .slice(0, 5)
      .map((n: any) => ({
        id: n.id || n._id || "",
        title: n.title || n.message || "Notification",
        type: n.type || "info",
        date: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "Just now",
      }));
  }, [notifsRaw]);

  const unreadCount = (countRaw as any)?.count || 0;

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights = useMemo<InsightItem[]>(() => {
    const insArr: any[] = extractArray(insightsRaw, "insights");
    return insArr.slice(0, 3).map((ins: any) => ({
      id: ins.id || ins._id || "",
      title: ins.title || ins.message || "Insight",
      description: ins.description,
      sentiment: ins.type || ins.sentiment || "info",
    }));
  }, [insightsRaw]);

  // ── Security/Verification ────────────────────────────────────────────────
  const security = useMemo<SecurityStatus>(() => {
    const profile: any = extractObject(profileRaw, "user");
    const userInfo = profile.user || profile;
    const tfa: any = extractObject(tfaRaw);
    const kycStatus = userInfo.kycStatus || profile.kycStatus || "pending";
    return {
      kycVerified: kycStatus === "verified" || kycStatus === "approved",
      kycStatus,
      twoFaEnabled: !!tfa.enabled || !!tfa.isEnabled,
    };
  }, [profileRaw, tfaRaw]);

  // ── Loans Detail Panel ───────────────────────────────────────────────────
  const loansDetail = useMemo<ClientLoansDetailData>(() => {
    const list = extractArray(loansRaw, "loans");
    const activeLoans = list.filter(
      (l: any) => l.status === "active" || l.status === "approved" || l.status === "disbursed",
    );
    const overdueLoans = list.filter((l: any) => l.status === "overdue" || l.isOverdue);
    const pendingApps = list.filter((l: any) => l.status === "pending" || l.status === "under_review");
    const totalDisbursed = list.reduce((s: number, l: any) => s + (l.amount || l.principal || 0), 0);
    const totalRepaid = list.reduce((s: number, l: any) => s + (l.totalPaid || l.amountPaid || 0), 0);
    const repaymentRate = totalDisbursed > 0 ? Math.min(Math.round((totalRepaid / totalDisbursed) * 100), 100) : 0;

    return {
      totalLoans: list.length,
      activeLoans: activeLoans.length,
      totalDisbursed,
      totalRepaid,
      overdueLoans: overdueLoans.length,
      pendingApplications: pendingApps.length,
      repaymentRate,
      recentLoans: list.slice(0, 5).map((l: any) => ({
        id: l.id || l._id || "",
        type: l.type || l.loanType || "Personal",
        amount: l.amount || l.principal || 0,
        status: l.status || "pending",
      })),
    };
  }, [loansRaw]);

  // ── Investments Detail Panel ─────────────────────────────────────────────
  const investmentsDetail = useMemo<ClientInvestmentsDetailData>(() => {
    const list = extractArray(investmentsListRaw, "investments");
    const portfolio: any = extractObject(portfolioRaw, "portfolio");
    const activeInvestments = list.filter((i: any) => i.status === "active").length;
    const totalPortfolioValue =
      portfolio.currentValue ||
      portfolio.totalValue ||
      list.reduce((s: number, i: any) => s + (i.currentValue || i.amount || 0), 0);
    const totalReturns =
      portfolio.totalReturns || list.reduce((s: number, i: any) => s + (i.returns || i.profit || 0), 0);
    const returnRate =
      portfolio.returnPercentage ||
      portfolio.returnPct ||
      (totalPortfolioValue > 0 ? Math.round((totalReturns / totalPortfolioValue) * 100) : 0);

    const topProducts = portfolio.byType
      ? Object.entries(portfolio.byType).map(([name, data]: [string, any]) => ({
          id: name,
          name,
          type: name,
          returnRate: data?.returnPercentage || 0,
        }))
      : list.slice(0, 3).map((i: any) => ({
          id: i.id || i._id || "",
          name: i.name || i.productName || "Investment",
          type: i.type || "Fixed",
          returnRate: i.returnPercentage || 0,
        }));

    return {
      totalPortfolioValue,
      activeInvestments: activeInvestments || 0,
      totalReturns,
      returnRate,
      savingsGoals: savingsGoals.length,
      savingsProgress:
        savingsGoals.length > 0
          ? Math.round(savingsGoals.reduce((s, g) => s + g.percentage, 0) / savingsGoals.length)
          : 0,
      topProducts,
    };
  }, [investmentsListRaw, portfolioRaw, savingsGoals]);

  // ── Cards Detail Panel ───────────────────────────────────────────────────
  const cardsDetail = useMemo<ClientCardsDetailData>(() => {
    const all = extractArray(cardsRaw, "cards");
    const active = all.filter((c: any) => c.status === "active" || !c.status);
    const frozen = all.filter((c: any) => c.status === "frozen" || c.status === "blocked");
    const virtual = all.filter((c: any) => !!c.isVirtual || c.type === "virtual");
    const physical = all.filter((c: any) => !c.isVirtual && c.type !== "virtual");
    const totalSpending = all.reduce((s: number, c: any) => s + (c.usedAmount || c.currentSpend || 0), 0);

    return {
      totalCards: all.length,
      activeCards: active.length,
      frozenCards: frozen.length,
      totalSpending,
      virtualCards: virtual.length,
      physicalCards: physical.length,
    };
  }, [cardsRaw]);

  // ── Return ───────────────────────────────────────────────────────────────
  return {
    account,
    recentTransactions,
    budgets,
    investments,
    loans,
    cards,
    savingsGoals,
    notifications,
    unreadCount,
    insights,
    security,

    loansDetail,
    investmentsDetail,
    cardsDetail,

    // Loading flags
    isAccountLoading: overviewLoading && walletsLoading && appsLoading,
    isTransactionsLoading: txLoading,
    isBudgetsLoading: budgetLoading,
    isInvestmentsLoading: portfolioLoading || investmentsListLoading,
    isLoansLoading: loansLoading,
    isCardsLoading: cardsLoading,
    isSavingsLoading: goalsLoading,
    isNotificationsLoading: notifsLoading,
    isInsightsLoading: insightsLoading,
    isSecurityLoading: profileLoading && tfaLoading,

    // Error flags
    isAccountError: overviewError || walletsError,
    isTransactionsError: txError,
    isBudgetsError: budgetError,
    isInvestmentsError: portfolioError || investmentsListError,
    isLoansError: loansError,
    isCardsError: cardsError,
    isSavingsError: goalsError,
    isNotificationsError: notifsError,
    isInsightsError: insightsError,
    isSecurityError: profileError || tfaError,
  };
}
