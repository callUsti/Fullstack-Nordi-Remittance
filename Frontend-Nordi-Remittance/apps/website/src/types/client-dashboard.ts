// ============================================================================
// CLIENT DASHBOARD TYPES — Global type declarations for client dashboard
// ============================================================================

declare global {
  /* ─── Account Summary ───────────────────────────────────────────────────── */

  interface WalletItem {
    id: string;
    walletId?: string;
    applicationId?: string;
    name: string;
    nickname?: string;
    accountNumber: string;
    type: "personal" | "business" | "savings" | "current" | "fixed_deposit" | string;
    typeLabel?: string;
    balance: number;
    currency: string;
    balancesByCurrency?: Array<{ currency: string; amount: number }>;
    status?: string;
    isPrimary?: boolean;
    isApplicationOnly?: boolean;

    // Savings specific fields from AccountApplication
    initialDeposit?: number;
    goal?: string;
    autoSave?: boolean;
    autoSaveAmount?: number;

    // Current specific fields from AccountApplication
    purpose?: "personal" | "business";
    businessName?: string;
    expectedMonthlyVolume?: number;
    overdraftRequested?: boolean;
    overdraftLimit?: number;

    // Fixed Deposit specific fields from AccountApplication
    principal?: number;
    termMonths?: number;
    interestRate?: number;
    maturityDate?: string;
    autoRenew?: boolean;

    recentTransactionsCount?: number;
    createdAt?: string;
  }

  interface AccountSummaryData {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsBalance?: number;
    savingsCount?: number;
    currentBalance?: number;
    currentCount?: number;
    fixedDepositBalance?: number;
    fixedDepositCount?: number;
    personalBalance?: number;
    personalCount?: number;
    wallets: WalletItem[];
  }

  /* ─── Transactions ──────────────────────────────────────────────────────── */

  interface TransactionItem {
    id: string;
    title: string;
    description: string;
    amount: number;
    currency: string;
    type: "credit" | "debit" | "transfer";
    status: string;
    category?: string;
    date: string;
  }

  /* ─── Spending Analytics ────────────────────────────────────────────────── */

  interface SpendingCategory {
    category: string;
    amount: number;
    color: string;
  }

  interface SpendingTrendPoint {
    month: string;
    spent: number;
  }

  interface ClientSpendingData {
    categories: SpendingCategory[];
    trends: SpendingTrendPoint[];
    totalSpending: number;
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    isLoading: boolean;
    isTrendLoading: boolean;
  }

  /* ─── Budget ────────────────────────────────────────────────────────────── */

  interface BudgetItem {
    id: string;
    category: string;
    spent: number;
    limit: number;
  }

  /* ─── Investment Snapshot ───────────────────────────────────────────────── */

  interface HoldingItem {
    id: string;
    name: string;
    change: number;
  }

  interface InvestmentSnapshot {
    totalValue: number;
    totalReturn: number;
    returnPct: number;
    holdings: HoldingItem[];
  }

  /* ─── Loans ─────────────────────────────────────────────────────────────── */

  interface LoanItem {
    id: string;
    type: string;
    monthlyPayment: number;
    outstanding: number;
    status: string;
  }

  interface LoansSnapshot {
    activeCount: number;
    totalOutstanding: number;
    loans: LoanItem[];
  }

  /* ─── Cards ─────────────────────────────────────────────────────────────── */

  interface CardItem {
    id: string;
    cardId?: string;
    name: string;
    lastFour: string;
    isVirtual: boolean;
    isPhysical?: boolean;
    cardBrand?: "visa" | "mastercard" | "amex" | "discover";
    cardType?: "debit" | "credit" | "prepaid" | "virtual";
    balance?: number;
    creditLimit?: number;
    currency?: string;
    status: string;
    expiryDate: string;
    spendLimit: number;
    usedAmount: number;
  }

  /* ─── Savings Goals ─────────────────────────────────────────────────────── */

  interface SavingsGoalItem {
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
    percentage: number;
  }

  /* ─── Notifications ─────────────────────────────────────────────────────── */

  interface NotificationItem {
    id: string;
    title: string;
    type: string;
    date: string;
  }

  /* ─── Insights ──────────────────────────────────────────────────────────── */

  interface InsightItem {
    id: string;
    title: string;
    description?: string;
    sentiment: string;
  }

  /* ─── Security ──────────────────────────────────────────────────────────── */

  interface SecurityStatus {
    kycVerified: boolean;
    kycStatus: string;
    twoFaEnabled: boolean;
  }

  /* ─── Quick Action / Tool ───────────────────────────────────────────────── */

  interface QuickAction {
    title: string;
    icon: React.ReactNode;
    color: string;
    hoverColor: string;
    route: string;
  }

  interface ToolLink {
    label: string;
    icon: React.ReactNode;
    color: string;
    hover: string;
    route: string;
  }

  /* ─── Detailed Loans Panel ────────────────────────────────────────────── */

  interface ClientLoansDetailData {
    totalLoans: number;
    activeLoans: number;
    totalDisbursed: number;
    totalRepaid: number;
    overdueLoans: number;
    pendingApplications: number;
    repaymentRate: number;
    recentLoans: Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
    }>;
  }

  /* ─── Detailed Investments Panel ────────────────────────────────────── */

  interface ClientInvestmentsDetailData {
    totalPortfolioValue: number;
    activeInvestments: number;
    totalReturns: number;
    returnRate: number;
    savingsGoals: number;
    savingsProgress: number;
    topProducts: Array<{
      id: string;
      name: string;
      type: string;
      returnRate: number;
    }>;
  }

  /* ─── Detailed Cards Panel ──────────────────────────────────────────── */

  interface ClientCardsDetailData {
    totalCards: number;
    activeCards: number;
    frozenCards: number;
    totalSpending: number;
    virtualCards: number;
    physicalCards: number;
  }

  /* ─── Aggregate Return ──────────────────────────────────────────────────── */

  interface ClientDashboardData {
    account: AccountSummaryData;
    recentTransactions: TransactionItem[];
    budgets: BudgetItem[];
    investments: InvestmentSnapshot;
    loans: LoansSnapshot;
    cards: CardItem[];
    savingsGoals: SavingsGoalItem[];
    notifications: NotificationItem[];
    unreadCount: number;
    insights: InsightItem[];
    security: SecurityStatus;

    loansDetail: ClientLoansDetailData;
    investmentsDetail: ClientInvestmentsDetailData;
    cardsDetail: ClientCardsDetailData;

    isAccountLoading: boolean;
    isTransactionsLoading: boolean;
    isBudgetsLoading: boolean;
    isInvestmentsLoading: boolean;
    isLoansLoading: boolean;
    isCardsLoading: boolean;
    isSavingsLoading: boolean;
    isNotificationsLoading: boolean;
    isInsightsLoading: boolean;
    isSecurityLoading: boolean;

    // Per-section error flags (for QuerySection isolation)
    isAccountError: boolean;
    isTransactionsError: boolean;
    isBudgetsError: boolean;
    isInvestmentsError: boolean;
    isLoansError: boolean;
    isCardsError: boolean;
    isSavingsError: boolean;
    isNotificationsError: boolean;
    isInsightsError: boolean;
    isSecurityError: boolean;
  }
}

export {};
