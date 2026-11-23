// @ts-nocheck
import mongoose from "mongoose";
import { Wallets, LedgerEntries, AccountLimits, AccountStatusHistories, AccountApplications } from "./accounts.model.js";
import { Cards } from "../cards/cards.model.js";
import Transactions from "../transactions/transactions.model.js";
import { generateWalletNumber } from "../../core/helpers/generator.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../core/errors/AppError.js";
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  CACHE_KEYS,
  CACHE_TTL,
} from "../../services/redis.service.js";
import { emitToUser } from "../../services/websocket.service.js";
import { DEFAULT_ACCOUNT_POLICIES } from "./wallet-lifecycle.service.js";
import { buildPagination, buildTextSearchQuery } from "../../core/algo/query-builder.js";

// WebSocket event constants for wallet
const WS_EVENTS = {
  WALLET_CREATED: "wallet:created",
  WALLET_UPDATED: "wallet:updated",
  WALLET_CLOSED: "wallet:closed",
  WALLET_STATUS_CHANGED: "wallet:status_changed",
} as const;

export class WalletService {
  /**
   * Get user's wallets
   * Get user's wallets enriched with AccountApplication metadata
   */
  static async getWallets(userId: string) {
    const [wallets, applications] = await Promise.all([
      Wallets.find({ user: userId, isDeleted: { $ne: true } })
        .select("-__v")
        .sort({ isPrimary: -1, walletType: 1, createdAt: 1 }),
      AccountApplications.find({ user: userId }).sort({ submittedAt: -1 }).lean(),
    ]);

    const usedAppIds = new Set<string>();

    const walletsWithStats = await Promise.all(
      wallets.map(async (wallet) => {
        const recentTransactions = await Transactions.countDocuments({
          wallet: wallet._id,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        });

        const obj = wallet.toObject();
        const rawNotes = String(obj.notes || "");
        const appIdMatch = rawNotes.match(/application\s+([a-f0-9]{24})/i);
        const linkedApp =
          (obj.applicationId && applications.find((a: any) => String(a._id) === String(obj.applicationId))) ||
          (appIdMatch && applications.find((a: any) => String(a._id) === appIdMatch[1])) ||
          applications.find(
            (a: any) =>
              a.type === obj.walletType &&
              !usedAppIds.has(String(a._id)) &&
              (a.status === "approved" || a.status === "pending"),
          );

        if (linkedApp) {
          usedAppIds.add(String(linkedApp._id));
        }

        const cleanNotes =
          rawNotes && !rawNotes.startsWith("Created from approved application") ? rawNotes : undefined;
        const nickname = obj.nickname || (linkedApp as any)?.nickname || cleanNotes || undefined;

        const balancesObj: Record<string, number> =
          obj.balances instanceof Map
            ? Object.fromEntries(obj.balances)
            : typeof obj.balances === "object" && obj.balances !== null
              ? { ...(obj.balances as any) }
              : {};

        const totalBal = Object.values(balancesObj).reduce((s, v) => s + (Number(v) || 0), 0);
        const appAmount = Number(
          obj.initialDeposit ||
            obj.principal ||
            (linkedApp as any)?.initialDeposit ||
            (linkedApp as any)?.principal ||
            0,
        );
        if (totalBal === 0 && appAmount > 0 && recentTransactions === 0) {
          const curr = (linkedApp as any)?.currency || Object.keys(balancesObj)[0] || "USD";
          balancesObj[curr] = appAmount;
        }

        return {
          ...obj,
          balances: balancesObj,
          nickname,
          notes: nickname || obj.notes,
          goal: obj.goal ?? (linkedApp as any)?.goal,
          autoSave: obj.autoSave ?? (linkedApp as any)?.autoSave,
          autoSaveAmount: obj.autoSaveAmount ?? (linkedApp as any)?.autoSaveAmount,
          initialDeposit: obj.initialDeposit ?? (linkedApp as any)?.initialDeposit,
          purpose: obj.purpose ?? (linkedApp as any)?.purpose,
          businessName: obj.businessName ?? (linkedApp as any)?.businessName,
          expectedMonthlyVolume: obj.expectedMonthlyVolume ?? (linkedApp as any)?.expectedMonthlyVolume,
          overdraftRequested: obj.overdraftRequested ?? (linkedApp as any)?.overdraftRequested,
          principal: obj.principal ?? (linkedApp as any)?.principal,
          termMonths: obj.termMonths ?? (linkedApp as any)?.termMonths,
          interestRate: obj.interestRate ?? (linkedApp as any)?.interestRate,
          maturityDate: obj.maturityDate ?? (linkedApp as any)?.maturityDate,
          autoRenew: obj.autoRenew ?? (linkedApp as any)?.autoRenew,
          applicationId: obj.applicationId ?? (linkedApp as any)?._id,
          applicationStatus: (linkedApp as any)?.status || "approved",
          recentTransactionsCount: recentTransactions,
        };
      }),
    );

    await cacheSet(`${CACHE_KEYS.USER_WALLETS}${userId}`, walletsWithStats, CACHE_TTL.ACCOUNT);
    return { wallets: walletsWithStats, applications };
  }

  /**
   * Get specific wallet
   */
  static async getWalletById(userId: string, walletId: string) {
    const cacheKey = `${CACHE_KEYS.WALLET}${userId}:${walletId}`;
    const cachedWallet = await cacheGet<Record<string, unknown>>(cacheKey);

    if (cachedWallet) {
      return { ...cachedWallet, cached: true };
    }

    const wallet = await Wallets.findOne({
      $or: [
        { _id: walletId, user: userId },
        { walletNumber: walletId, user: userId },
      ],
    });

    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    const limits = await AccountLimits.findOne({ wallet: wallet._id });
    const recentEntries = await LedgerEntries.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const walletData = { wallet, limits, recentEntries };
    await cacheSet(cacheKey, walletData, CACHE_TTL.ACCOUNT);

    return walletData;
  }

  /**
   * Create new wallet
   */
  static async createWallet(
    userId: string,
    data: { currency?: string; type?: string; walletType?: string; name?: string; nickname?: string },
  ) {
    const { currency, name, nickname } = data;
    const type = data.walletType || data.type;
    const supportedCurrencies = ["USD", "EUR", "GBP", "NGN", "KES", "GHS", "ZAR", "CAD", "AUD"];

    if (currency && !supportedCurrencies.includes(currency.toUpperCase())) {
      throw new ValidationError(`Unsupported currency. Supported: ${supportedCurrencies.join(", ")}`);
    }

    const existingWallets = await Wallets.countDocuments({ user: userId, isDeleted: { $ne: true } });
    if (existingWallets >= 10) {
      throw new ForbiddenError("Maximum wallet limit reached (10 wallets per user)");
    }

    if (type !== "savings") {
      await Wallets.findOne({
        user: userId,
        walletType: { $ne: "savings" },
      });
    }

    const walletCurrency = currency?.toUpperCase() || "USD";
    const walletType = type || "personal";
    const policies = DEFAULT_ACCOUNT_POLICIES[walletType] || DEFAULT_ACCOUNT_POLICIES.personal;

    const wallet = new Wallets({
      user: userId,
      walletNumber: generateWalletNumber(),
      balances: new Map([[walletCurrency, 0]]),
      status: "active",
      walletType,
      notes: nickname || name || undefined,
      isPrimary: existingWallets === 0,
      isDeleted: false,
      accountPolicies: { ...policies },
      // Set withdrawal counter reset for savings
      ...(walletType === "savings" && {
        withdrawalCount: 0,
        withdrawalCountResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      }),
    });

    await wallet.save();

    await AccountLimits.create({
      wallet: wallet._id,
      limitType: "daily",
      category: "all",
      amount: 5000,
      currency: walletCurrency,
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await cacheDelete(`${CACHE_KEYS.USER_WALLETS}${userId}`);

    emitToUser(userId, WS_EVENTS.WALLET_CREATED, {
      wallet: wallet.toObject(),
      message: "New wallet created successfully",
      timestamp: new Date().toISOString(),
    });

    return { wallet };
  }

  /**
   * Update wallet settings
   */
  static async updateWallet(
    userId: string,
    walletId: string,
    data: { name?: string; nickname?: string; notes?: string; isDefault?: boolean; isPrimary?: boolean },
  ) {
    const newName = data.nickname ?? data.name ?? data.notes;
    const isPrimary = data.isPrimary ?? data.isDefault;

    const wallet = await Wallets.findOne({ _id: walletId, user: userId });
    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    if (newName !== undefined) {
      wallet.notes = newName;
      wallet.nickname = newName;
    }

    if (isPrimary === true) {
      await Wallets.updateMany({ user: userId, _id: { $ne: wallet._id } }, { isPrimary: false });
      wallet.isPrimary = true;
    }

    wallet.updatedAt = new Date();
    await wallet.save();

    await Promise.all([
      cacheDelete(`${CACHE_KEYS.USER_WALLETS}${userId}`),
      cacheDelete(`${CACHE_KEYS.WALLET}${userId}:${walletId}`),
    ]);

    emitToUser(userId, WS_EVENTS.WALLET_UPDATED, {
      walletId: wallet._id,
      updates: { name: newName, isPrimary },
      message: "Wallet updated successfully",
      timestamp: new Date().toISOString(),
    });

    return { wallet };
  }

  /**
   * Close/Deactivate wallet — SOFT DELETE
   * Transfers remaining balance and re-links cards to successor wallet.
   * Loan/investment data remains attached for audit continuity.
   */
  static async closeWallet(userId: string, walletId: string, successorWalletId?: string) {
    const wallet = await Wallets.findOne({ _id: walletId, user: userId, isDeleted: { $ne: true } });
    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    if (wallet.isPrimary) {
      throw new ForbiddenError("Cannot close primary wallet. Designate another wallet as primary first.");
    }

    // Check for active loans
    if (wallet.linkedLoans && wallet.linkedLoans.length > 0) {
      const { Loans } = await import("../loans/loans.model.js");
      const activeLoans = await Loans.countDocuments({
        _id: { $in: wallet.linkedLoans },
        status: { $in: ["active", "pending"] },
      });
      if (activeLoans > 0) {
        throw new ValidationError("Cannot close wallet with active loans. Pay off outstanding loans first.");
      }
    }

    const pendingTransactions = await Transactions.countDocuments({
      wallet: wallet._id,
      status: { $in: ["pending"] },
    });
    if (pendingTransactions > 0) {
      throw new ValidationError("Cannot close wallet with pending transactions");
    }

    // Find successor wallet (user's primary, or specified)
    let successor;
    if (successorWalletId) {
      successor = await Wallets.findOne({ _id: successorWalletId, user: userId, isDeleted: { $ne: true }, status: "active" });
    }
    if (!successor) {
      successor = await Wallets.findOne({ user: userId, isPrimary: true, isDeleted: { $ne: true }, _id: { $ne: wallet._id } });
    }
    if (!successor) {
      successor = await Wallets.findOne({ user: userId, isDeleted: { $ne: true }, status: "active", _id: { $ne: wallet._id } });
    }

    // Transfer remaining balances to successor
    if (successor && wallet.balances) {
      wallet.balances.forEach((balance: number, currency: string) => {
        if (balance > 0) {
          const successorBalance = successor.balances?.get(currency) || 0;
          successor.balances?.set(currency, successorBalance + balance);
          wallet.balances?.set(currency, 0);
        }
      });
      successor.updatedAt = new Date();
      await successor.save();
    }

    // Re-link cards to successor
    if (successor) {
      const cardsOnThisWallet = await Cards.find({ wallet: wallet._id });
      for (const card of cardsOnThisWallet) {
        card.wallet = successor._id as any;
        if (card.fundingSource?.toString() === wallet._id.toString()) {
          card.fundingSource = successor._id as any;
        }
        card.updatedAt = new Date();
        await card.save();
      }

      // Add linked cards to successor
      if (!successor.linkedCards) successor.linkedCards = [];
      for (const cardId of (wallet.linkedCards || [])) {
        if (!successor.linkedCards.some((c: any) => c.toString() === cardId.toString())) {
          successor.linkedCards.push(cardId);
        }
      }
      await successor.save();
    }

    // Soft delete the wallet
    wallet.status = "closed";
    wallet.isDeleted = true;
    wallet.deletedAt = new Date();
    wallet.closedAt = new Date();
    wallet.closureReason = "User requested closure";
    wallet.migratedToWallet = successor?._id as any;
    wallet.updatedAt = new Date();
    await wallet.save();

    // Record status change in history
    await AccountStatusHistories.create({
      wallet: wallet._id,
      previousStatus: "active",
      newStatus: "closed",
      reason: "User requested closure",
      changedBy: userId,
      metadata: {
        successorWallet: successor?._id,
        balancesTransferred: true,
        cardsRelinked: true,
      },
      effectiveDate: new Date(),
    });

    await Promise.all([
      cacheDelete(`${CACHE_KEYS.USER_WALLETS}${userId}`),
      cacheDelete(`${CACHE_KEYS.WALLET}${userId}:${walletId}`),
    ]);

    emitToUser(userId, WS_EVENTS.WALLET_CLOSED, {
      walletId: wallet._id,
      walletNumber: wallet.walletNumber,
      successorWallet: successor?._id,
      message: "Wallet closed. Balances and cards transferred.",
      timestamp: new Date().toISOString(),
    });

    return { wallet, successor };
  }

  /**
   * Get user's closed/deleted wallets (for history viewing)
   */
  static async getClosedWallets(userId: string) {
    const closedWallets = await Wallets.find({ user: userId, isDeleted: true })
      .select("-__v")
      .sort({ deletedAt: -1 });
    return { wallets: closedWallets };
  }

  /**
   * Get all wallets (admin)
   */
  static async getAllWallets(
    filters: { status?: string; userId?: string; query?: string; walletType?: string; type?: string },
    pagination: { page: number; limit: number },
  ) {
    const { limit, skip, page } = buildPagination(pagination.page, pagination.limit);

    const query: Record<string, any> = { isDeleted: { $ne: true } };
    if (filters.status) query.status = filters.status;
    if (filters.userId) query.user = filters.userId;
    if (filters.walletType || filters.type) query.walletType = filters.walletType || filters.type;

    if (filters.query) {
      const q = filters.query.trim();
      const Users = (await import("./accounts.model.js")).Users || mongoose.model("Users");

      const userSearchQuery = buildTextSearchQuery(q, ["firstName", "lastName", "email", "accountNumber"]);
      const matchingUsers = await Users.find(userSearchQuery).select("_id").lean();

      const userIds = matchingUsers.map((u: any) => u._id);

      const walletSearchQuery = buildTextSearchQuery(q, ["walletNumber", "notes", "nickname"], "contains");
      query.$or = [...(walletSearchQuery.$or || []), { user: { $in: userIds } }];
    }

    const [wallets, total, applications] = await Promise.all([
      Wallets.find(query)
        .populate("user", "firstName lastName email accountNumber mobileNumber country kycStatus status profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Wallets.countDocuments(query),
      AccountApplications.find({}).sort({ submittedAt: -1 }).lean(),
    ]);

    const enrichedWallets = wallets.map((w: any) => {
      const userId = typeof w.user === "string" ? w.user : w.user?._id;
      const rawNotes = String(w.notes || "");
      const appIdMatch = rawNotes.match(/application\s+([a-f0-9]{24})/i);
      const linkedApp =
        (w.applicationId && applications.find((a: any) => String(a._id) === String(w.applicationId))) ||
        (appIdMatch && applications.find((a: any) => String(a._id) === appIdMatch[1])) ||
        applications.find(
          (a: any) =>
            String(a.user) === String(userId) &&
            a.type === w.walletType &&
            (a.status === "approved" || a.status === "pending"),
        );

      const cleanNotes =
        rawNotes && !rawNotes.startsWith("Created from approved application") ? rawNotes : undefined;
      const nickname = w.nickname || (linkedApp as any)?.nickname || cleanNotes || undefined;

      const balancesObj: Record<string, number> =
        w.balances instanceof Map
          ? Object.fromEntries(w.balances)
          : typeof w.balances === "object" && w.balances !== null
            ? { ...(w.balances as any) }
            : {};

      const totalBal = Object.values(balancesObj).reduce((s, v) => s + (Number(v) || 0), 0);
      const appAmount = Number(
        w.initialDeposit ||
          w.principal ||
          (linkedApp as any)?.initialDeposit ||
          (linkedApp as any)?.principal ||
          0,
      );
      if (totalBal === 0 && appAmount > 0) {
        const curr = (linkedApp as any)?.currency || Object.keys(balancesObj)[0] || "USD";
        balancesObj[curr] = appAmount;
      }

      return {
        ...w,
        balances: balancesObj,
        nickname,
        notes: nickname || w.notes,
        goal: w.goal ?? (linkedApp as any)?.goal,
        autoSave: w.autoSave ?? (linkedApp as any)?.autoSave,
        autoSaveAmount: w.autoSaveAmount ?? (linkedApp as any)?.autoSaveAmount,
        initialDeposit: w.initialDeposit ?? (linkedApp as any)?.initialDeposit,
        purpose: w.purpose ?? (linkedApp as any)?.purpose,
        businessName: w.businessName ?? (linkedApp as any)?.businessName,
        expectedMonthlyVolume: w.expectedMonthlyVolume ?? (linkedApp as any)?.expectedMonthlyVolume,
        overdraftRequested: w.overdraftRequested ?? (linkedApp as any)?.overdraftRequested,
        principal: w.principal ?? (linkedApp as any)?.principal,
        termMonths: w.termMonths ?? (linkedApp as any)?.termMonths,
        interestRate: w.interestRate ?? (linkedApp as any)?.interestRate,
        maturityDate: w.maturityDate ?? (linkedApp as any)?.maturityDate,
        autoRenew: w.autoRenew ?? (linkedApp as any)?.autoRenew,
        applicationId: w.applicationId ?? (linkedApp as any)?._id,
      };
    });

    return { wallets: enrichedWallets, total, page, limit };
  }

  /**
   * Update wallet status (admin)
   */
  static async updateWalletStatus(walletId: string, status: string, reason?: string) {
    const validStatuses = ["active", "frozen", "suspended", "closed"];
    if (!status || !validStatuses.includes(status)) {
      throw new ValidationError("Invalid status. Valid: " + validStatuses.join(", "));
    }

    const wallet = await Wallets.findByIdAndUpdate(
      walletId,
      {
        status,
        updatedAt: new Date(),
        ...((status === "suspended" || status === "frozen") && { freezeReason: reason }),
        ...(status === "closed" && { closedAt: new Date() }),
      },
      { new: true },
    );

    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    await cacheDelete(`${CACHE_KEYS.USER_WALLETS}${wallet.user}`);

    emitToUser(String(wallet.user), WS_EVENTS.WALLET_STATUS_CHANGED, {
      walletId: wallet._id,
      status,
      reason: reason || undefined,
      timestamp: new Date().toISOString(),
    });

    return { wallet };
  }
}
