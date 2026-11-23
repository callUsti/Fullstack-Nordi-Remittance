import mongoose from "mongoose";
import { Wallets, LedgerEntries, AccountLimits, AccountApplications } from "./accounts.model.js";
import Transactions from "../transactions/transactions.model.js";
import Users from "../users/users.model.js";
import { NotFoundError } from "../../core/errors/AppError.js";
import { buildPagination, buildDateRangeQuery } from "../../core/algo/query-builder.js";

export class AccountAnalyticsService {
  /**
   * Get wallet balance history
   */
  static async getBalanceHistory(
    userId: string,
    walletId: string,
    filters: { startDate?: string; endDate?: string; type?: string },
    pagination: { page: number; limit: number }
  ) {
    const { limit, skip, page } = buildPagination(pagination.page, pagination.limit);

    const wallet = await Wallets.findOne({
      _id: walletId,
      user: userId,
    });

    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    const query: Record<string, any> = { wallet: wallet._id };

    const dateQuery = buildDateRangeQuery(filters.startDate, filters.endDate);
    if (Object.keys(dateQuery).length > 0) {
      query.createdAt = dateQuery;
    }

    if (filters.type) {
      query.entryType = filters.type;
    }

    const [entries, total] = await Promise.all([
      LedgerEntries.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LedgerEntries.countDocuments(query),
    ]);

    return { entries, total, page, limit };
  }

  /**
   * Get account limits
   */
  static async getAccountLimits(userId: string) {
    const user = await Users.findById(userId).select("kycStatus");
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const limits = await AccountLimits.find({
      wallet: {
        $in: await Wallets.find({ user: userId }).distinct("_id"),
      },
    }).lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayUsage, monthUsage] = await Promise.all([
      Transactions.aggregate([
        {
          $match: {
            initiatedBy: userId,
            status: "completed",
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),
      Transactions.aggregate([
        {
          $match: {
            initiatedBy: userId,
            status: "completed",
            createdAt: { $gte: firstDayOfMonth },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const todayTransfers = todayUsage.find((u) => u._id === "transfer")?.total || 0;
    const todayWithdrawals = todayUsage.find((u) => u._id === "withdrawal")?.total || 0;
    const monthTransfers = monthUsage.find((u) => u._id === "transfer")?.total || 0;
    const monthWithdrawals = monthUsage.find((u) => u._id === "withdrawal")?.total || 0;

    const baseLimits = {
      pending: {
        dailyTransfer: 500,
        monthlyTransfer: 2000,
        dailyWithdrawal: 200,
        monthlyWithdrawal: 1000,
        perTransaction: 200,
      },
      approved: {
        dailyTransfer: 50000,
        monthlyTransfer: 200000,
        dailyWithdrawal: 10000,
        monthlyWithdrawal: 50000,
        perTransaction: 25000,
      },
    };

    const kycLimits = baseLimits[user.kycStatus as keyof typeof baseLimits] || baseLimits.pending;

    return {
      limits: {
        daily: {
          transfer: {
            limit: kycLimits.dailyTransfer,
            used: todayTransfers,
            remaining: Math.max(0, kycLimits.dailyTransfer - todayTransfers),
          },
          withdrawal: {
            limit: kycLimits.dailyWithdrawal,
            used: todayWithdrawals,
            remaining: Math.max(0, kycLimits.dailyWithdrawal - todayWithdrawals),
          },
        },
        monthly: {
          transfer: {
            limit: kycLimits.monthlyTransfer,
            used: monthTransfers,
            remaining: Math.max(0, kycLimits.monthlyTransfer - monthTransfers),
          },
          withdrawal: {
            limit: kycLimits.monthlyWithdrawal,
            used: monthWithdrawals,
            remaining: Math.max(0, kycLimits.monthlyWithdrawal - monthWithdrawals),
          },
        },
        perTransaction: kycLimits.perTransaction,
      },
      kycStatus: user.kycStatus,
      walletLimits: limits,
    };
  }

  /**
   * Get account summary/dashboard data
   */
  static async getAccountSummary(userId: string) {
    const [wallets, applications, recentTransactions, monthlyStats] = await Promise.all([
      Wallets.find({ user: userId, isDeleted: { $ne: true }, status: { $ne: "closed" } })
        .select(
          "walletNumber balances walletType isPrimary notes status interestRate accruedInterest maturityDate autoRenew overdraftLimit overdraftUsed createdAt",
        )
        .lean(),
      AccountApplications.find({ user: userId }).sort({ submittedAt: -1 }).lean(),
      Transactions.find({ initiatedBy: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Transactions.aggregate([
        {
          $match: {
            initiatedBy: userId,
            status: "completed",
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalIncoming: {
              $sum: {
                $cond: [
                  { $in: ["$type", ["deposit", "refund", "credit", "funding", "bonus", "loan_disbursement"]] },
                  "$amount",
                  0,
                ],
              },
            },
            totalOutgoing: {
              $sum: {
                $cond: [
                  { $in: ["$type", ["transfer", "withdrawal", "payment", "debit", "fee", "investment", "loan_repayment"]] },
                  "$amount",
                  0,
                ],
              },
            },
            transactionCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    let totalBalance = 0;
    const usedAppIds = new Set<string>();

    const enrichedWallets = wallets.map((w: any) => {
      const balancesObj: Record<string, number> =
        w.balances instanceof Map
          ? Object.fromEntries(w.balances)
          : typeof w.balances === "object" && w.balances !== null
            ? { ...w.balances }
            : {};

      const rawNotes = String(w.notes || "");
      const appIdMatch = rawNotes.match(/application\s+([a-f0-9]{24})/i);
      const linkedApp =
        (appIdMatch && applications.find((a: any) => String(a._id) === appIdMatch[1])) ||
        applications.find(
          (a: any) =>
            a.type === w.walletType &&
            !usedAppIds.has(String(a._id)) &&
            (a.status === "approved" || a.status === "pending"),
        );

      if (linkedApp) {
        usedAppIds.add(String(linkedApp._id));
      }

      let walletTotal = 0;
      Object.values(balancesObj).forEach((b: any) => {
        walletTotal += Number(b) || 0;
      });

      const appDeposit = Number((linkedApp as any)?.initialDeposit || (linkedApp as any)?.principal || 0);
      if (walletTotal === 0 && appDeposit > 0) {
        const curr = (linkedApp as any)?.currency || Object.keys(balancesObj)[0] || "USD";
        balancesObj[curr] = appDeposit;
        walletTotal = appDeposit;
      }

      totalBalance += walletTotal;

      const cleanNotes =
        rawNotes && !rawNotes.startsWith("Created from approved application") ? rawNotes : undefined;
      const nickname = (linkedApp as any)?.nickname || cleanNotes || undefined;

      return {
        ...w,
        balances: balancesObj,
        nickname,
        notes: nickname || w.notes,
        goal: (linkedApp as any)?.goal,
        autoSave: (linkedApp as any)?.autoSave,
        autoSaveAmount: (linkedApp as any)?.autoSaveAmount,
        initialDeposit: (linkedApp as any)?.initialDeposit,
        purpose: (linkedApp as any)?.purpose,
        businessName: (linkedApp as any)?.businessName,
        expectedMonthlyVolume: (linkedApp as any)?.expectedMonthlyVolume,
        overdraftRequested: (linkedApp as any)?.overdraftRequested,
        principal: (linkedApp as any)?.principal,
        termMonths: (linkedApp as any)?.termMonths,
        interestRate: w.interestRate ?? (linkedApp as any)?.interestRate,
        maturityDate: w.maturityDate ?? (linkedApp as any)?.maturityDate,
        autoRenew: w.autoRenew ?? (linkedApp as any)?.autoRenew,
      };
    });

    // Also include any approved/pending AccountApplications that don't yet have a provisioned wallet
    applications.forEach((app: any) => {
      if (!usedAppIds.has(String(app._id)) && app.status !== "rejected") {
        const amount = Number(app.initialDeposit || app.principal || 0);
        totalBalance += amount;
      }
    });

    const formattedTransactions = recentTransactions.map((tx) => ({
      id: tx._id,
      reference: tx.referenceNumber,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      direction: ["deposit", "refund", "credit", "funding", "bonus", "loan_disbursement"].includes(tx.type)
        ? "in"
        : "out",
      createdAt: tx.createdAt,
    }));

    const stats = monthlyStats[0] || {
      totalIncoming: 0,
      totalOutgoing: 0,
      transactionCount: 0,
    };

    return {
      summary: {
        totalBalance,
        primaryCurrency: "USD",
        walletsCount: enrichedWallets.length,
        monthlyStats: {
          incoming: stats.totalIncoming,
          outgoing: stats.totalOutgoing,
          netFlow: stats.totalIncoming - stats.totalOutgoing,
          transactionCount: stats.transactionCount,
        },
      },
      wallets: enrichedWallets,
      applications,
      recentTransactions: formattedTransactions,
    };
  }
}
