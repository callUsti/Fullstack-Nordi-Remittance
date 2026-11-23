// ============================================================================
// INVESTMENT CONTROLLER
// ============================================================================

import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../../types/index.js";
import {
  SavingsGoals,
  InvestmentAccounts,
  Portfolios,
  PortfolioTransactions,
  Assets,
  InterestPlans,
} from "./investments.model.js";
import {
  ensureMarketAssetsSeeded,
  syncCryptoMarket,
  syncForexMarket,
  syncStockMarket,
  convertForexCurrency,
} from "./investments.service.js";
import { Wallets, LedgerEntries } from "../accounts/accounts.model.js";
import { Cards, CardTransactions } from "../cards/cards.model.js";
import Transactions from "../transactions/transactions.model.js";
import Users from "../users/users.model.js";
import { generateReferenceNumber } from "../../core/helpers/generator.js";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
} from "../../core/helpers/response.helper.js";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../../core/errors/AppError.js";
import { queueTemplatedMail } from "../../services/workers.js";
import EmailContentGenerator from "../../core/mail/Mail-content.js";
import { emitToUser } from "../../services/websocket.service.js";
import { WS } from "../../core/constants/ws-events.js";
import { validateUserEligibility } from "../../core/guards/user-eligibility.guard.js";

// Initialize email content generator
const emailGenerator = new EmailContentGenerator();

// ============================================================================
// SAVINGS GOALS
// ============================================================================

// Helper function to get wallet balance for a currency
function getWalletBalance(wallet: any, currency: string = "USD"): number {
  if (!wallet || !wallet.balances) return 0;
  const balances =
    wallet.balances instanceof Map
      ? wallet.balances
      : new Map(Object.entries(wallet.balances));
  return balances.get(currency) || 0;
}

// Helper function to update wallet balance
function updateWalletBalance(
  wallet: any,
  currency: string,
  amount: number,
): void {
  if (!wallet.balances) {
    wallet.balances = new Map();
  }
  const current = getWalletBalance(wallet, currency);
  wallet.balances.set(currency, current + amount);
}

export async function getSavingsGoals(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const goals = await SavingsGoals.find({ user: req.user.userId })
      .populate("wallet", "walletNumber balances")
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, { goals });
  } catch (error) {
    next(error);
  }
}

export async function createSavingsGoal(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    // Validate user eligibility (KYC approved, account active & unlocked)
    await validateUserEligibility(req.user.userId, "savings goal creation");

    const {
      name,
      targetAmount,
      targetDate,
      walletId,
      autoSaveEnabled,
      autoSaveFrequency,
      autoSaveAmount,
      category,
    } = req.body;

    const user = await Users.findById(req.user.userId).session(session);
    if (!user) throw new NotFoundError("User not found");

    // Validate target amount
    if (targetAmount < 10) {
      throw new ValidationError("Minimum target amount is $10");
    }

    // Validate target date
    const target = new Date(targetDate);
    if (target <= new Date()) {
      throw new ValidationError("Target date must be in the future");
    }

    // Check max goals (5 per user)
    const existingGoals = await SavingsGoals.countDocuments({
      user: req.user.userId,
      status: "active",
    });

    if (existingGoals >= 5) {
      throw new ForbiddenError("Maximum 5 active savings goals allowed");
    }

    // Verify wallet if provided
    let wallet = null;
    if (walletId) {
      wallet = await Wallets.findOne({
        _id: walletId,
        user: req.user.userId,
        status: "active",
      }).session(session);

      if (!wallet) throw new NotFoundError("Wallet not found");
    } else {
      wallet = await Wallets.findOne({
        user: req.user.userId,
        status: "active",
      }).session(session);
    }

    // Calculate suggested monthly deposit
    const monthsToTarget = Math.max(
      1,
      Math.ceil((target.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)),
    );
    const suggestedMonthly = Math.ceil(targetAmount / monthsToTarget);

    const goal = new SavingsGoals({
      user: req.user.userId,
      wallet: wallet?._id,
      name,
      description: req.body.description,
      targetAmount,
      currentAmount: 0,
      currency: "USD",
      targetDate: target,
      status: "active",
      category: category || "other",
      autoSaveEnabled: autoSaveEnabled || false,
      autoSaveFrequency: autoSaveFrequency || "monthly",
      autoSaveAmount: autoSaveAmount || suggestedMonthly,
    });

    await goal.save({ session });
    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.SAVINGS_GOAL_CREATED, {
      goalId: goal.goalId || goal._id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      timestamp: new Date().toISOString(),
    });

    sendCreated(
      res,
      {
        goal: {
          id: goal._id,
          goalId: goal.goalId,
          name: goal.name,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          suggestedMonthlyDeposit: suggestedMonthly,
          autoSaveEnabled: goal.autoSaveEnabled,
        },
      },
      "Savings goal created successfully",
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

export async function depositToGoal(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    // Validate user eligibility (KYC approved, account active & unlocked)
    await validateUserEligibility(req.user.userId, "savings deposit");

    const id = req.params.goalId || req.params.id;
    const { amount, walletId } = req.body;

    const goal = await SavingsGoals.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(String(id)) ? [{ _id: id }] : []),
        { goalId: id },
      ],
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!goal) throw new NotFoundError("Savings goal not found");

    const wallet = await Wallets.findOne({
      ...(walletId ? { _id: walletId } : {}),
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!wallet) throw new NotFoundError("Wallet not found");

    const currency = "USD";
    const walletBalance = getWalletBalance(wallet, currency);
    if (walletBalance < amount) {
      throw new ValidationError("Insufficient wallet balance");
    }

    // Deduct from wallet
    updateWalletBalance(wallet, currency, -amount);
    await wallet.save({ session });

    // Add to goal
    goal.currentAmount += amount;

    // Check if goal reached
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = "completed";
      goal.completedAt = new Date();
    }

    await goal.save({ session });

    // Create transaction for ledger entry
    const reference = generateReferenceNumber();
    const transaction = await Transactions.create(
      [
        {
          wallet: wallet._id,
          type: "withdrawal",
          category: "investments",
          amount,
          currency,
          status: "completed",
          referenceNumber: reference,
          initiatedBy: req.user.userId,
          description: `Savings goal deposit - ${goal.name}`,
        },
      ],
      { session },
    );

    // Create ledger entry
    await LedgerEntries.create(
      [
        {
          wallet: wallet._id,
          transaction: transaction[0]._id,
          entryType: "debit",
          amount,
          currency,
          balance: getWalletBalance(wallet, currency),
          description: `Savings goal deposit - ${goal.name}`,
          accountingDate: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.SAVINGS_GOAL_DEPOSIT, {
      goalId: goal.goalId || goal._id,
      amount,
      currentAmount: goal.currentAmount,
      progress: Math.round((goal.currentAmount / goal.targetAmount) * 100),
      reference,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        goal: {
          id: goal._id,
          goalId: goal.goalId,
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          progress: Math.round((goal.currentAmount / goal.targetAmount) * 100),
          status: goal.status,
        },
        deposit: { amount, reference },
      },
      "Deposit successful",
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

export async function withdrawFromGoal(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    // Validate user eligibility (KYC approved, account active & unlocked)
    await validateUserEligibility(req.user.userId, "savings withdrawal");

    const id = req.params.goalId || req.params.id;
    const { amount, walletId } = req.body;

    const goal = await SavingsGoals.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(String(id)) ? [{ _id: id }] : []),
        { goalId: id },
      ],
      user: req.user.userId,
      status: { $in: ["active", "completed"] },
    }).session(session);

    if (!goal) throw new NotFoundError("Savings goal not found");

    if (goal.currentAmount < amount) {
      throw new ValidationError("Insufficient goal balance");
    }

    const wallet = await Wallets.findOne({
      ...(walletId ? { _id: walletId } : {}),
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!wallet) throw new NotFoundError("Wallet not found");

    // Deduct from goal
    goal.currentAmount -= amount;

    // If completed and now withdrawn, mark as active or closed
    if (goal.status === "completed" && goal.currentAmount < goal.targetAmount) {
      goal.status = "active";
    }

    await goal.save({ session });

    // Credit to wallet
    const currency = "USD";
    updateWalletBalance(wallet, currency, amount);
    await wallet.save({ session });

    // Create transaction for ledger entry
    const reference = generateReferenceNumber();
    const transaction = await Transactions.create(
      [
        {
          wallet: wallet._id,
          type: "deposit",
          category: "investments",
          amount,
          currency,
          status: "completed",
          referenceNumber: reference,
          initiatedBy: req.user.userId,
          description: `Savings goal withdrawal - ${goal.name}`,
        },
      ],
      { session },
    );

    // Create ledger entry
    await LedgerEntries.create(
      [
        {
          wallet: wallet._id,
          transaction: transaction[0]._id,
          entryType: "credit",
          amount,
          currency,
          balance: getWalletBalance(wallet, currency),
          description: `Savings goal withdrawal - ${goal.name}`,
          accountingDate: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.SAVINGS_GOAL_WITHDRAWAL, {
      goalId: goal.goalId || goal._id,
      amount,
      currentAmount: goal.currentAmount,
      reference,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        goal: {
          id: goal._id,
          goalId: goal.goalId,
          currentAmount: goal.currentAmount,
          status: goal.status,
        },
        withdrawal: { amount, reference },
      },
      "Withdrawal successful",
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

export async function deleteSavingsGoal(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const id = req.params.goalId || req.params.id;
    const { transferToWalletId } = req.body;

    const goal = await SavingsGoals.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(String(id)) ? [{ _id: id }] : []),
        { goalId: id },
      ],
      user: req.user.userId,
    }).session(session);

    if (!goal) throw new NotFoundError("Savings goal not found");

    // If there's remaining balance, transfer to wallet
    if (goal.currentAmount > 0 && transferToWalletId) {
      const wallet = await Wallets.findOne({
        _id: transferToWalletId,
        user: req.user.userId,
        status: "active",
      }).session(session);

      if (wallet) {
        const currency = "USD";
        updateWalletBalance(wallet, currency, goal.currentAmount);
        await wallet.save({ session });

        const reference = generateReferenceNumber();
        const transaction = await Transactions.create(
          [
            {
              wallet: wallet._id,
              type: "deposit",
              category: "investments",
              amount: goal.currentAmount,
              currency,
              status: "completed",
              referenceNumber: reference,
              initiatedBy: req.user.userId,
              description: `Savings goal closure - ${goal.name}`,
            },
          ],
          { session },
        );

        await LedgerEntries.create(
          [
            {
              wallet: wallet._id,
              transaction: transaction[0]._id,
              entryType: "credit",
              amount: goal.currentAmount,
              currency,
              balance: getWalletBalance(wallet, currency),
              description: `Savings goal closure - ${goal.name}`,
              accountingDate: new Date(),
            },
          ],
          { session },
        );
      }
    }

    goal.status = "cancelled";
    goal.currentAmount = 0;
    await goal.save({ session });

    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.SAVINGS_GOAL_DELETED, {
      goalId: goal.goalId || goal._id,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(res, null, "Savings goal deleted successfully");
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// ============================================================================
// INVESTMENT ACCOUNTS
// ============================================================================

export async function getInvestmentAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    let account = await InvestmentAccounts.findOne({ user: req.user.userId })
      .populate("wallet", "walletNumber balances")
      .lean();

    if (!account) {
      // Return empty state
      sendSuccess(res, {
        account: null,
        message: "No investment account found. Create one to start investing.",
      });
      return;
    }

    // Get portfolio summary
    const portfolios = await Portfolios.find({
      investmentAccount: account._id,
    }).lean();

    sendSuccess(res, { account, portfolios });
  } catch (error) {
    next(error);
  }
}

export async function createInvestmentAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    // Validate user eligibility (KYC approved, account active & unlocked)
    await validateUserEligibility(req.user.userId, "investment account creation");

    const { walletId, riskTolerance, investmentGoal } = req.body;

    const user = await Users.findById(req.user.userId).session(session);
    if (!user) throw new NotFoundError("User not found");

    // Check for existing account
    const existing = await InvestmentAccounts.findOne({
      user: req.user.userId,
    }).session(session);
    if (existing) {
      throw new ValidationError("Investment account already exists");
    }

    // Verify wallet
    const wallet = await Wallets.findOne({
      ...(walletId ? { _id: walletId } : {}),
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!wallet) throw new NotFoundError("Wallet not found");

    const account = new InvestmentAccounts({
      user: req.user.userId,
      wallet: wallet._id,
      accountType: req.body.accountType || "stocks",
      totalInvested: 0,
      currentValue: 0,
      totalReturns: 0,
      returnPercentage: 0,
      currency: "USD",
      riskProfile: riskTolerance || "moderate",
      status: "active",
    });

    await account.save({ session });
    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.ACCOUNT_CREATED, {
      accountId: account.accountId || account._id,
      riskProfile: account.riskProfile,
      status: account.status,
      timestamp: new Date().toISOString(),
    });

    sendCreated(
      res,
      {
        account: {
          id: account._id,
          accountId: account.accountId,
          status: account.status,
          riskProfile: account.riskProfile,
        },
      },
      "Investment account created successfully",
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// ============================================================================
// PORTFOLIO MANAGEMENT
// ============================================================================

export async function getPortfolio(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const portfolios = await Portfolios.find({ user: req.user.userId })
      .populate("asset")
      .lean();

    if (!portfolios.length) {
      sendSuccess(res, { portfolios: [] });
      return;
    }

    // Calculate current values for each portfolio item
    const portfoliosWithValue = portfolios.map((portfolio: any) => {
      const asset = portfolio.asset as any;
      const currentValue =
        portfolio.quantity * (asset?.currentPrice || portfolio.averageBuyPrice);
      const gain =
        currentValue - portfolio.quantity * portfolio.averageBuyPrice;
      const gainPercent =
        portfolio.totalInvested > 0
          ? (gain / portfolio.totalInvested) * 100
          : 0;

      return {
        ...portfolio,
        calculatedCurrentValue: currentValue,
        calculatedUnrealizedGain: gain,
        calculatedUnrealizedGainPercent: Math.round(gainPercent * 100) / 100,
      };
    });

    sendSuccess(res, { portfolios: portfoliosWithValue });
  } catch (error) {
    next(error);
  }
}

export async function getPortfolioTransactions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const investmentAccount = await InvestmentAccounts.findOne({
      user: req.user.userId,
    });
    if (!investmentAccount) {
      sendPaginated(res, [], { page, limit, total: 0 });
      return;
    }

    const filter: any = { investmentAccount: investmentAccount._id };
    if (req.query.type) filter.transactionType = req.query.type;

    const [transactions, total] = await Promise.all([
      PortfolioTransactions.find(filter)
        .populate("asset", "symbol name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PortfolioTransactions.countDocuments(filter),
    ]);

    sendPaginated(res, transactions, { page, limit, total });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ASSETS
// ============================================================================

export async function getAssets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    await ensureMarketAssetsSeeded(req.query.refresh === "true");

    const filter: any = { isActive: true };
    if (req.query.type) filter.assetType = req.query.type;
    if (req.query.category) filter.assetType = req.query.category;

    const assets = await Assets.find(filter).sort({ marketCap: -1, symbol: 1 }).lean();

    sendSuccess(res, { assets });
  } catch (error) {
    next(error);
  }
}

export async function getAssetById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    await ensureMarketAssetsSeeded(false);

    const rawId = req.params.assetId || req.params.id;
    const assetId = typeof rawId === "string" ? rawId : String(rawId);

    const asset = await Assets.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(assetId) ? [{ _id: assetId }] : []),
        { assetId },
        { symbol: assetId.toUpperCase() },
      ],
      isActive: true,
    }).lean();

    if (!asset) throw new NotFoundError("Asset not found");

    sendSuccess(res, { asset });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// BUY/SELL ASSETS
// ============================================================================

export async function buyAsset(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    // Validate user eligibility (KYC approved, account active & unlocked)
    await validateUserEligibility(req.user.userId, "asset purchase");

    await ensureMarketAssetsSeeded(false);

    const {
      assetId,
      productId,
      symbol,
      amount: rawAmount,
      walletId,
      cardId,
      paymentMethod: rawPaymentMethod,
      currency: requestedCurrency,
    } = req.body;

    const amount = Number(rawAmount);
    if (!amount || amount <= 0) {
      throw new ValidationError("Investment amount must be greater than 0");
    }

    const targetAssetKey = String(assetId || productId || symbol || "").trim();
    if (!targetAssetKey) {
      throw new ValidationError("Asset ID or symbol is required");
    }

    const currency = (requestedCurrency || "USD").toUpperCase();
    const paymentMethod: "wallet" | "card" =
      cardId || rawPaymentMethod === "card" ? "card" : "wallet";

    // Get asset
    const asset = await Assets.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(targetAssetKey) ? [{ _id: targetAssetKey }] : []),
        { assetId: targetAssetKey },
        { symbol: targetAssetKey.toUpperCase() },
      ],
      isActive: true,
    }).session(session);

    if (!asset) throw new NotFoundError("Asset not found");

    // Calculate quantity
    const quantity = amount / asset.currentPrice;

    // Check minimum balance requirement if applicable
    const minBalance = (asset as any).minimumBalance || (asset.metadata as any)?.minInvestment;
    if (minBalance && amount < minBalance && asset.assetType === "mutual_fund") {
      throw new ValidationError(`Minimum investment for ${asset.symbol} is $${minBalance}`);
    }

    let wallet: any = null;
    let card: any = null;
    const reference = generateReferenceNumber();

    if (paymentMethod === "card") {
      // Find user's card
      card = await Cards.findOne({
        ...(cardId
          ? {
              $or: [
                ...(mongoose.Types.ObjectId.isValid(String(cardId)) ? [{ _id: cardId }] : []),
                { cardId: String(cardId) },
              ],
            }
          : {}),
        user: req.user.userId,
        status: "active",
      }).session(session);

      if (!card) {
        throw new NotFoundError("Active payment card not found");
      }

      // Check card balance or credit limit, or fallback to linked wallet
      const cardAvailable =
        card.cardType === "credit"
          ? Number(card.availableCredit ?? card.creditLimit ?? 0)
          : Number(card.balance ?? 0);

      if (cardAvailable >= amount) {
        if (card.cardType === "credit") {
          card.availableCredit = cardAvailable - amount;
        } else {
          card.balance = cardAvailable - amount;
        }
        card.lastUsedDate = new Date();
        await card.save({ session });
      } else {
        // Draw from card's fundingSource or primary linked wallet
        const fundingWalletId = card.fundingSource || card.wallet;
        wallet = await Wallets.findOne({
          _id: fundingWalletId,
          user: req.user.userId,
          status: "active",
        }).session(session);

        if (!wallet) {
          throw new ValidationError("Insufficient card balance");
        }

        const walletBal = getWalletBalance(wallet, currency);
        if (walletBal < amount) {
          throw new ValidationError("Insufficient card and linked wallet balance");
        }
        updateWalletBalance(wallet, currency, -amount);
        await wallet.save({ session });
        card.lastUsedDate = new Date();
        await card.save({ session });
      }

      // Ensure we also have a reference wallet for InvestmentAccounts binding if needed
      if (!wallet) {
        wallet = await Wallets.findOne({
          $or: [{ _id: card.wallet }, { user: req.user.userId }],
          status: "active",
        }).session(session);
      }

      // Record CardTransaction
      await CardTransactions.create(
        [
          {
            card: card._id,
            amount,
            currency,
            transactionType: "purchase",
            status: "completed",
            authorizationCode: reference.slice(-6).toUpperCase(),
            merchantName: `Nordi Markets - ${asset.symbol}`,
            merchantCategory: "Investment & Securities",
            mcc: "6211",
            isOnline: true,
            settledAt: new Date(),
          },
        ],
        { session },
      );
    } else {
      // Payment via Wallet
      wallet = await Wallets.findOne({
        ...(walletId
          ? {
              $or: [
                ...(mongoose.Types.ObjectId.isValid(String(walletId)) ? [{ _id: walletId }] : []),
                { walletNumber: String(walletId) },
              ],
            }
          : {}),
        user: req.user.userId,
        status: "active",
      }).session(session);

      if (!wallet) throw new NotFoundError("Active wallet not found");

      let deductCurrency = currency;
      let deductAmount = amount;
      let walletBalance = getWalletBalance(wallet, deductCurrency);

      // If requested currency (USD) balance is insufficient, check if wallet has another currency with sufficient balance
      if (walletBalance < deductAmount && wallet.balances) {
        const entries =
          wallet.balances instanceof Map
            ? Array.from(wallet.balances.entries())
            : Object.entries(wallet.balances);
        for (const [curr, bal] of entries) {
          if (Number(bal) > 0 && curr !== currency) {
            const conv = await convertForexCurrency("USD", String(curr), amount);
            if (Number(bal) >= conv.convertedAmount) {
              deductCurrency = String(curr);
              deductAmount = conv.convertedAmount;
              walletBalance = Number(bal);
              break;
            }
          }
        }
      }

      if (walletBalance < deductAmount) {
        throw new ValidationError("Insufficient wallet balance");
      }

      // Deduct from wallet
      updateWalletBalance(wallet, deductCurrency, -deductAmount);
      await wallet.save({ session });
    }

    // Get or auto-create investment account for user
    let investmentAccount = await InvestmentAccounts.findOne({
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!investmentAccount) {
      if (!wallet) {
        wallet = await Wallets.findOne({ user: req.user.userId }).session(session);
      }
      investmentAccount = new InvestmentAccounts({
        user: req.user.userId,
        wallet: wallet?._id,
        accountType: "multi_asset",
        status: "active",
        totalInvested: 0,
        currentValue: 0,
        totalReturns: 0,
        returnPercentage: 0,
        currency: "USD",
        riskProfile: "moderate",
      });
      await investmentAccount.save({ session });
    }

    // Get or create portfolio for this asset
    let portfolio = await Portfolios.findOne({
      investmentAccount: investmentAccount._id,
      asset: asset._id,
    }).session(session);

    if (!portfolio) {
      portfolio = new Portfolios({
        user: req.user.userId,
        investmentAccount: investmentAccount._id,
        asset: asset._id,
        quantity: 0,
        averageBuyPrice: asset.currentPrice,
        totalInvested: 0,
        currentValue: 0,
        currency: "USD",
        firstPurchaseDate: new Date(),
      });
    }

    // Update portfolio
    const totalCost = portfolio.quantity * portfolio.averageBuyPrice + amount;
    const totalQuantity = portfolio.quantity + quantity;
    portfolio.averageBuyPrice = totalCost / totalQuantity;
    portfolio.quantity = totalQuantity;
    portfolio.totalInvested += amount;
    portfolio.currentValue = portfolio.quantity * asset.currentPrice;
    portfolio.lastPurchaseDate = new Date();
    await portfolio.save({ session });

    // Update investment account
    investmentAccount.totalInvested += amount;
    investmentAccount.currentValue += amount;
    await investmentAccount.save({ session });

    // Create portfolio transaction
    const portfolioTx = new PortfolioTransactions({
      user: req.user.userId,
      investmentAccount: investmentAccount._id,
      portfolio: portfolio._id,
      asset: asset._id,
      transactionType: "buy",
      paymentMethod,
      wallet: wallet?._id,
      card: card?._id,
      quantity,
      pricePerUnit: asset.currentPrice,
      totalAmount: amount,
      fee: 0,
      currency: "USD",
      status: "completed",
      orderType: "market",
    });

    await portfolioTx.save({ session });

    // Create main transaction & ledger entry if wallet exists
    if (wallet) {
      const transaction = await Transactions.create(
        [
          {
            wallet: wallet._id,
            type: "withdrawal",
            category: "investments",
            amount,
            currency: "USD",
            status: "completed",
            referenceNumber: reference,
            initiatedBy: req.user.userId,
            description: `Investment purchase (${paymentMethod.toUpperCase()}) - ${asset.symbol}`,
          },
        ],
        { session },
      );

      await LedgerEntries.create(
        [
          {
            wallet: wallet._id,
            transaction: transaction[0]._id,
            entryType: "debit",
            amount,
            currency: "USD",
            balance: getWalletBalance(wallet, "USD"),
            description: `Investment purchase (${paymentMethod.toUpperCase()}) - ${asset.symbol}`,
            accountingDate: new Date(),
          },
        ],
        { session },
      );
    }

    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.PURCHASED, {
      asset: asset.symbol,
      assetName: asset.name,
      assetType: asset.assetType,
      paymentMethod,
      quantity,
      pricePerUnit: asset.currentPrice,
      totalAmount: amount,
      reference,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        transaction: {
          id: portfolioTx._id,
          reference,
          asset: asset.symbol,
          assetName: asset.name,
          assetType: asset.assetType,
          paymentMethod,
          quantity,
          pricePerUnit: asset.currentPrice,
          totalAmount: amount,
        },
      },
      `Successfully purchased ${asset.symbol} via ${paymentMethod === "card" ? "card" : "account wallet"}`,
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

export async function sellAsset(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    // Validate user eligibility (KYC approved, account active & unlocked)
    await validateUserEligibility(req.user.userId, "asset sale");

    const { assetId, quantity, walletId } = req.body;
    const currency = "USD";

    // Get investment account
    const investmentAccount = await InvestmentAccounts.findOne({
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!investmentAccount) {
      throw new NotFoundError("Investment account not found");
    }

    // Get asset
    const asset = await Assets.findOne({
      $or: [{ _id: assetId }, { symbol: assetId?.toUpperCase() }],
    }).session(session);

    if (!asset) throw new NotFoundError("Asset not found");

    // Get portfolio for this specific asset
    const portfolio = await Portfolios.findOne({
      investmentAccount: investmentAccount._id,
      asset: asset._id,
    }).session(session);

    if (!portfolio) {
      throw new ValidationError("You do not own this asset");
    }

    if (portfolio.quantity < quantity) {
      throw new ValidationError(
        `Insufficient quantity. You have ${portfolio.quantity} units.`,
      );
    }

    // Calculate proceeds
    const proceeds = quantity * asset.currentPrice;
    const costBasis = quantity * portfolio.averageBuyPrice;
    const realizedGain = proceeds - costBasis;

    // Get wallet
    const wallet = await Wallets.findOne({
      _id: walletId,
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!wallet) throw new NotFoundError("Wallet not found");

    // Credit to wallet
    updateWalletBalance(wallet, currency, proceeds);
    await wallet.save({ session });

    // Update portfolio
    portfolio.quantity -= quantity;
    portfolio.totalInvested -= costBasis;
    portfolio.currentValue = portfolio.quantity * asset.currentPrice;
    portfolio.realizedGain += realizedGain;
    await portfolio.save({ session });

    // Update investment account
    investmentAccount.totalInvested -= costBasis;
    investmentAccount.currentValue -= costBasis;
    investmentAccount.totalReturns += realizedGain;
    await investmentAccount.save({ session });

    // Create portfolio transaction
    const reference = generateReferenceNumber();
    const portfolioTx = new PortfolioTransactions({
      user: req.user.userId,
      investmentAccount: investmentAccount._id,
      portfolio: portfolio._id,
      asset: asset._id,
      transactionType: "sell",
      quantity,
      pricePerUnit: asset.currentPrice,
      totalAmount: proceeds,
      fee: 0,
      currency,
      status: "completed",
      orderType: "market",
    });

    await portfolioTx.save({ session });

    // Create main transaction for ledger
    const transaction = await Transactions.create(
      [
        {
          wallet: wallet._id,
          type: "deposit",
          category: "investments",
          amount: proceeds,
          currency,
          status: "completed",
          referenceNumber: reference,
          initiatedBy: req.user.userId,
          description: `Investment sale - ${asset.symbol}`,
        },
      ],
      { session },
    );

    // Create ledger entry
    await LedgerEntries.create(
      [
        {
          wallet: wallet._id,
          transaction: transaction[0]._id,
          entryType: "credit",
          amount: proceeds,
          currency,
          balance: getWalletBalance(wallet, currency),
          description: `Investment sale - ${asset.symbol}`,
          accountingDate: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.SOLD, {
      asset: asset.symbol,
      quantity,
      pricePerUnit: asset.currentPrice,
      proceeds,
      realizedGain,
      reference,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        transaction: {
          id: portfolioTx._id,
          reference,
          asset: asset.symbol,
          quantity,
          pricePerUnit: asset.currentPrice,
          proceeds,
          realizedGain,
        },
      },
      "Asset sold successfully",
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// ============================================================================
// SWAP ASSETS (STOCKS / CRYPTO / ETFS / BONDS)
// ============================================================================

export async function swapAssets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    await validateUserEligibility(req.user.userId, "asset swap");
    await ensureMarketAssetsSeeded(false);

    const {
      fromAssetId,
      toAssetId,
      fromQuantity: rawFromQuantity,
      usdAmount: rawUsdAmount,
      amount: rawAmount,
    } = req.body;

    const fromKey = String(fromAssetId || "").trim();
    const toKey = String(toAssetId || "").trim();

    if (!fromKey || !toKey) {
      throw new ValidationError("Both source asset (fromAssetId) and target asset (toAssetId) are required");
    }

    if (fromKey.toUpperCase() === toKey.toUpperCase()) {
      throw new ValidationError("Cannot swap an asset for itself");
    }

    const [fromAsset, toAsset] = await Promise.all([
      Assets.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(fromKey) ? [{ _id: fromKey }] : []),
          { assetId: fromKey },
          { symbol: fromKey.toUpperCase() },
        ],
        isActive: true,
      }).session(session),
      Assets.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(toKey) ? [{ _id: toKey }] : []),
          { assetId: toKey },
          { symbol: toKey.toUpperCase() },
        ],
        isActive: true,
      }).session(session),
    ]);

    if (!fromAsset) throw new NotFoundError(`Source asset (${fromKey}) not found`);
    if (!toAsset) throw new NotFoundError(`Target asset (${toKey}) not found`);

    const investmentAccount = await InvestmentAccounts.findOne({
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!investmentAccount) {
      throw new NotFoundError("No active investment portfolio found to swap from");
    }

    const fromPortfolio = await Portfolios.findOne({
      investmentAccount: investmentAccount._id,
      asset: fromAsset._id,
    }).session(session);

    if (!fromPortfolio || fromPortfolio.quantity <= 0) {
      throw new ValidationError(`You do not own any ${fromAsset.symbol} to swap`);
    }

    // Determine quantity to swap from either fromQuantity or usdAmount/amount
    let swapFromQuantity = Number(rawFromQuantity || 0);
    if (!swapFromQuantity || swapFromQuantity <= 0) {
      const requestedUsd = Number(rawUsdAmount || rawAmount || 0);
      if (requestedUsd > 0) {
        swapFromQuantity = requestedUsd / fromAsset.currentPrice;
      }
    }

    if (!swapFromQuantity || swapFromQuantity <= 0) {
      throw new ValidationError("Swap quantity or USD amount must be greater than 0");
    }

    if (fromPortfolio.quantity < swapFromQuantity) {
      throw new ValidationError(
        `Insufficient ${fromAsset.symbol} holdings. Available: ${fromPortfolio.quantity.toFixed(4)} ${fromAsset.symbol}`,
      );
    }

    const grossUsdValue = swapFromQuantity * fromAsset.currentPrice;
    const swapFeeUsd = Number((grossUsdValue * 0.0015).toFixed(2)); // 0.15% institutional swap spread
    const netUsdValue = Math.max(0, grossUsdValue - swapFeeUsd);
    const toQuantity = netUsdValue / toAsset.currentPrice;
    const exchangeRate = fromAsset.currentPrice / toAsset.currentPrice;

    // Deduct from source portfolio
    const costBasisRemoved = swapFromQuantity * fromPortfolio.averageBuyPrice;
    const realizedGain = grossUsdValue - costBasisRemoved;

    fromPortfolio.quantity -= swapFromQuantity;
    fromPortfolio.totalInvested = Math.max(0, fromPortfolio.totalInvested - costBasisRemoved);
    fromPortfolio.currentValue = fromPortfolio.quantity * fromAsset.currentPrice;
    fromPortfolio.realizedGain += realizedGain;
    await fromPortfolio.save({ session });

    // Credit to target portfolio
    let toPortfolio = await Portfolios.findOne({
      investmentAccount: investmentAccount._id,
      asset: toAsset._id,
    }).session(session);

    if (!toPortfolio) {
      toPortfolio = new Portfolios({
        user: req.user.userId,
        investmentAccount: investmentAccount._id,
        asset: toAsset._id,
        quantity: 0,
        averageBuyPrice: toAsset.currentPrice,
        totalInvested: 0,
        currentValue: 0,
        currency: "USD",
        firstPurchaseDate: new Date(),
      });
    }

    const prevTargetCost = toPortfolio.quantity * toPortfolio.averageBuyPrice;
    const newTargetQuantity = toPortfolio.quantity + toQuantity;
    toPortfolio.averageBuyPrice = (prevTargetCost + netUsdValue) / newTargetQuantity;
    toPortfolio.quantity = newTargetQuantity;
    toPortfolio.totalInvested += netUsdValue;
    toPortfolio.currentValue = newTargetQuantity * toAsset.currentPrice;
    toPortfolio.lastPurchaseDate = new Date();
    await toPortfolio.save({ session });

    // Update investment account returns
    investmentAccount.totalReturns += realizedGain - swapFeeUsd;
    await investmentAccount.save({ session });

    const reference = generateReferenceNumber();
    const swapTx = new PortfolioTransactions({
      user: req.user.userId,
      investmentAccount: investmentAccount._id,
      portfolio: toPortfolio._id,
      asset: fromAsset._id,
      toAsset: toAsset._id,
      transactionType: "swap",
      paymentMethod: "portfolio_swap",
      quantity: swapFromQuantity,
      pricePerUnit: fromAsset.currentPrice,
      toQuantity,
      toPricePerUnit: toAsset.currentPrice,
      exchangeRate,
      totalAmount: netUsdValue,
      fee: swapFeeUsd,
      currency: "USD",
      status: "completed",
      orderType: "market",
    });

    await swapTx.save({ session });
    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.SWAPPED, {
      fromAsset: fromAsset.symbol,
      toAsset: toAsset.symbol,
      fromQuantity: swapFromQuantity,
      toQuantity,
      exchangeRate,
      usdValue: netUsdValue,
      fee: swapFeeUsd,
      reference,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        swap: {
          id: swapTx._id,
          reference,
          fromAsset: fromAsset.symbol,
          fromAssetName: fromAsset.name,
          fromQuantity: Number(swapFromQuantity.toFixed(6)),
          fromPrice: fromAsset.currentPrice,
          toAsset: toAsset.symbol,
          toAssetName: toAsset.name,
          toQuantity: Number(toQuantity.toFixed(6)),
          toPrice: toAsset.currentPrice,
          exchangeRate: Number(exchangeRate.toFixed(6)),
          usdValue: Number(netUsdValue.toFixed(2)),
          fee: swapFeeUsd,
        },
      },
      `Swapped ${swapFromQuantity.toFixed(4)} ${fromAsset.symbol} for ${toQuantity.toFixed(4)} ${toAsset.symbol}`,
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// ============================================================================
// LIVE CRYPTO (COINMARKETCAP), STOCKS & FOREX MARKET ENDPOINTS
// ============================================================================

export async function getCryptoMarket(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const force = req.query.refresh === "true";
    const data = await syncCryptoMarket(force);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getStockMarket(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const force = req.query.refresh === "true";
    const data = await syncStockMarket(force);
    sendSuccess(res, {
      ...data,
      assets: [...data.stocks, ...data.etfs],
    });
  } catch (error) {
    next(error);
  }
}

export async function getForexRates(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const force = req.query.refresh === "true";
    const data = await syncForexMarket(force);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function convertForex(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const from = String(req.query.from || req.body?.from || "USD");
    const to = String(req.query.to || req.body?.to || "EUR");
    const amount = Number(req.query.amount || req.body?.amount || 100);

    if (amount <= 0) {
      throw new ValidationError("Amount must be greater than 0");
    }

    const conversion = await convertForexCurrency(from, to, amount);
    sendSuccess(res, { conversion });
  } catch (error) {
    next(error);
  }
}

export async function exchangeForexWallet(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    await validateUserEligibility(req.user.userId, "currency exchange");

    const {
      fromCurrency: rawFrom,
      toCurrency: rawTo,
      amount: rawAmount,
      walletId,
      targetWalletId,
    } = req.body;

    const fromCurrency = String(rawFrom || "USD").toUpperCase();
    const toCurrency = String(rawTo || "EUR").toUpperCase();
    const amount = Number(rawAmount);

    if (!amount || amount <= 0) {
      throw new ValidationError("Exchange amount must be greater than 0");
    }
    if (fromCurrency === toCurrency) {
      throw new ValidationError("Source and target currencies must be different");
    }

    const sourceWallet = await Wallets.findOne({
      ...(walletId ? { _id: walletId } : {}),
      user: req.user.userId,
      status: "active",
    }).session(session);

    if (!sourceWallet) throw new NotFoundError("Source wallet not found");

    const sourceBalance = getWalletBalance(sourceWallet, fromCurrency);
    if (sourceBalance < amount) {
      throw new ValidationError(
        `Insufficient ${fromCurrency} balance (${sourceBalance.toFixed(2)} ${fromCurrency} available)`,
      );
    }

    const conversion = await convertForexCurrency(fromCurrency, toCurrency, amount);

    const destWallet =
      targetWalletId && String(targetWalletId) !== String(sourceWallet._id)
        ? await Wallets.findOne({
            _id: targetWalletId,
            user: req.user.userId,
            status: "active",
          }).session(session)
        : sourceWallet;

    if (!destWallet) throw new NotFoundError("Destination wallet not found");

    updateWalletBalance(sourceWallet, fromCurrency, -amount);
    if (String(destWallet._id) === String(sourceWallet._id)) {
      updateWalletBalance(sourceWallet, toCurrency, conversion.netConvertedAmount);
      await sourceWallet.save({ session });
    } else {
      updateWalletBalance(destWallet, toCurrency, conversion.netConvertedAmount);
      await Promise.all([sourceWallet.save({ session }), destWallet.save({ session })]);
    }

    const reference = generateReferenceNumber();
    const transaction = await Transactions.create(
      [
        {
          wallet: sourceWallet._id,
          type: "conversion",
          category: "transfer",
          amount,
          currency: fromCurrency,
          convertedAmount: conversion.netConvertedAmount,
          convertedCurrency: toCurrency,
          exchangeRate: conversion.rate,
          fee: conversion.fee,
          status: "completed",
          referenceNumber: reference,
          initiatedBy: req.user.userId,
          description: `FX Exchange: ${amount} ${fromCurrency} → ${conversion.netConvertedAmount} ${toCurrency} @ ${conversion.rate}`,
        },
      ],
      { session },
    );

    await LedgerEntries.create(
      [
        {
          wallet: sourceWallet._id,
          transaction: transaction[0]._id,
          entryType: "debit",
          amount,
          currency: fromCurrency,
          balance: getWalletBalance(sourceWallet, fromCurrency),
          description: `FX Exchange Debit (${fromCurrency} → ${toCurrency})`,
          accountingDate: new Date(),
        },
        {
          wallet: destWallet._id,
          transaction: transaction[0]._id,
          entryType: "credit",
          amount: conversion.netConvertedAmount,
          currency: toCurrency,
          balance: getWalletBalance(destWallet, toCurrency),
          description: `FX Exchange Credit (${fromCurrency} → ${toCurrency})`,
          accountingDate: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.INVESTMENT.FOREX_EXCHANGED, {
      fromCurrency,
      toCurrency,
      amount,
      convertedAmount: conversion.netConvertedAmount,
      rate: conversion.rate,
      fee: conversion.fee,
      reference,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        exchange: {
          reference,
          ...conversion,
          transactionId: transaction[0]._id,
        },
      },
      `Exchanged ${amount} ${fromCurrency} to ${conversion.netConvertedAmount} ${toCurrency}`,
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// ============================================================================
// ADMIN INVESTMENTS & MARKET MANAGEMENT
// ============================================================================

export async function getAdminInvestmentsOverview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    await ensureMarketAssetsSeeded(false);

    const [accounts, portfolios, savingsGoals, recentTransactions, assets, plans] =
      await Promise.all([
        InvestmentAccounts.find()
          .populate("user", "firstName lastName email accountStatus")
          .populate("wallet", "walletNumber balances")
          .sort({ createdAt: -1 })
          .limit(200)
          .lean(),
        Portfolios.find({ quantity: { $gt: 0 } })
          .populate("user", "firstName lastName email")
          .populate("asset")
          .sort({ currentValue: -1 })
          .limit(300)
          .lean(),
        SavingsGoals.find()
          .populate("user", "firstName lastName email")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
        PortfolioTransactions.find()
          .populate("user", "firstName lastName email")
          .populate("asset", "symbol name assetType currentPrice")
          .populate("toAsset", "symbol name assetType currentPrice")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
        Assets.find({ isActive: true }).sort({ marketCap: -1, symbol: 1 }).lean(),
        InterestPlans.find().sort({ interestRate: -1 }).lean(),
      ]);

    const totalAum = accounts.reduce((sum, a: any) => sum + Number(a.currentValue || a.totalInvested || 0), 0);
    const totalInvested = accounts.reduce((sum, a: any) => sum + Number(a.totalInvested || 0), 0);
    const totalReturns = accounts.reduce((sum, a: any) => sum + Number(a.totalReturns || 0), 0);
    const totalSavingsAum = savingsGoals.reduce((sum, g: any) => sum + Number(g.currentAmount || 0), 0);

    // Breakdown by asset class
    const byAssetType: Record<string, { count: number; value: number; holdingsCount: number }> = {
      stock: { count: 0, value: 0, holdingsCount: 0 },
      etf: { count: 0, value: 0, holdingsCount: 0 },
      crypto: { count: 0, value: 0, holdingsCount: 0 },
      mutual_fund: { count: 0, value: 0, holdingsCount: 0 },
      bond: { count: 0, value: 0, holdingsCount: 0 },
      forex: { count: 0, value: 0, holdingsCount: 0 },
    };

    for (const asset of assets as any[]) {
      const t = asset.assetType || "stock";
      if (!byAssetType[t]) byAssetType[t] = { count: 0, value: 0, holdingsCount: 0 };
      byAssetType[t].count += 1;
    }

    for (const p of portfolios as any[]) {
      const asset = p.asset as any;
      const t = asset?.assetType || "stock";
      const val = Number(p.quantity || 0) * Number(asset?.currentPrice || p.averageBuyPrice || 0);
      if (!byAssetType[t]) byAssetType[t] = { count: 0, value: 0, holdingsCount: 0 };
      byAssetType[t].value += val;
      byAssetType[t].holdingsCount += 1;
    }

    sendSuccess(res, {
      stats: {
        totalAum: totalAum + totalSavingsAum,
        totalInvested,
        totalReturns,
        totalSavingsAum,
        activeAccountsCount: accounts.filter((a: any) => a.status === "active").length,
        totalAccountsCount: accounts.length,
        totalPortfoliosCount: portfolios.length,
        totalAssetsCount: assets.length,
        byAssetType,
      },
      accounts,
      portfolios,
      savingsGoals,
      recentTransactions,
      assets,
      plans,
    });
  } catch (error) {
    next(error);
  }
}

export async function syncAdminMarketAssets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    await ensureMarketAssetsSeeded(true);
    const [crypto, stocks, forex] = await Promise.all([
      syncCryptoMarket(true),
      syncStockMarket(true),
      syncForexMarket(true),
    ]);

    sendSuccess(
      res,
      {
        syncedAt: new Date().toISOString(),
        cryptoCount: crypto.assets.length,
        stocksCount: stocks.stocks.length,
        etfsCount: stocks.etfs.length,
        forexPairsCount: forex.pairs.length,
        providers: {
          crypto: crypto.provider,
          stocks: stocks.provider,
          forex: forex.provider,
        },
      },
      "Live market feeds (CoinMarketCap, Equities & Forex) synchronized successfully",
    );
  } catch (error) {
    next(error);
  }
}

export async function upsertAdminAsset(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const paramId = req.params.assetId || req.params.id;
    const {
      symbol: rawSymbol,
      name,
      assetType,
      exchange,
      currentPrice,
      currency,
      priceChange24h,
      priceChangePercentage24h,
      marketCap,
      volume24h,
      high24h,
      low24h,
      isActive,
      metadata,
    } = req.body;

    const symbol = String(rawSymbol || paramId || "").toUpperCase().trim();
    if (!symbol) {
      throw new ValidationError("Asset symbol is required");
    }

    const updateFields: Record<string, any> = {
      lastUpdated: new Date(),
    };
    if (name !== undefined) updateFields.name = name;
    if (assetType !== undefined) updateFields.assetType = assetType;
    if (exchange !== undefined) updateFields.exchange = exchange;
    if (currentPrice !== undefined) updateFields.currentPrice = Number(currentPrice);
    if (currency !== undefined) updateFields.currency = currency;
    if (priceChange24h !== undefined) updateFields.priceChange24h = Number(priceChange24h);
    if (priceChangePercentage24h !== undefined)
      updateFields.priceChangePercentage24h = Number(priceChangePercentage24h);
    if (marketCap !== undefined) updateFields.marketCap = Number(marketCap);
    if (volume24h !== undefined) updateFields.volume24h = Number(volume24h);
    if (high24h !== undefined) updateFields.high24h = Number(high24h);
    if (low24h !== undefined) updateFields.low24h = Number(low24h);
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);
    if (metadata !== undefined) updateFields.metadata = metadata;

    const filter =
      paramId && mongoose.Types.ObjectId.isValid(String(paramId))
        ? { _id: paramId }
        : { symbol };

    const asset = await Assets.findOneAndUpdate(
      filter,
      {
        $set: updateFields,
        $setOnInsert: {
          symbol,
          name: name || symbol,
          assetType: assetType || "stock",
          currentPrice: Number(currentPrice || 1),
          currency: currency || "USD",
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true },
    ).lean();

    sendSuccess(res, { asset }, `Market asset ${symbol} saved successfully`);
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminAsset(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const rawId = req.params.assetId || req.params.id;
    const key = String(rawId || "").trim();

    const asset = await Assets.findOneAndUpdate(
      {
        $or: [
          ...(mongoose.Types.ObjectId.isValid(key) ? [{ _id: key }] : []),
          { assetId: key },
          { symbol: key.toUpperCase() },
        ],
      },
      { $set: { isActive: false, lastUpdated: new Date() } },
      { new: true },
    ).lean();

    if (!asset) throw new NotFoundError("Asset not found");

    sendSuccess(res, { asset }, `Asset ${asset.symbol} deactivated`);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// INTEREST PLANS
// ============================================================================

export async function getInterestPlans(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    await ensureMarketAssetsSeeded(false);

    const plans = await InterestPlans.find({ status: "active" })
      .sort({ interestRate: -1 })
      .lean();

    sendSuccess(res, { plans });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// INVESTMENT SUMMARY
// ============================================================================

export async function getInvestmentSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    // Get all investment data
    const [account, portfolios, goals, recentTransactions] = await Promise.all([
      InvestmentAccounts.findOne({ user: req.user.userId }).lean(),
      Portfolios.find({ user: req.user.userId }).populate("asset").lean(),
      SavingsGoals.find({ user: req.user.userId, status: "active" }).lean(),
      PortfolioTransactions.find({
        user: req.user.userId,
      })
        .populate("asset", "symbol name assetType")
        .populate("toAsset", "symbol name assetType")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Calculate totals
    const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const savingsTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

    sendSuccess(res, {
      summary: {
        totalInvested: account?.totalInvested || 0,
        currentValue: account?.currentValue || 0,
        totalReturns: account?.totalReturns || 0,
        returnPercent: account?.totalInvested
          ? Math.round((account.totalReturns / account.totalInvested) * 10000) /
            100
          : 0,
        holdingsCount: portfolios?.length || 0,
        savingsGoals: {
          count: goals.length,
          totalSaved: totalSavings,
          totalTarget: savingsTarget,
          overallProgress:
            savingsTarget > 0
              ? Math.round((totalSavings / savingsTarget) * 100)
              : 0,
        },
        recentActivity: recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  getSavingsGoals,
  createSavingsGoal,
  depositToGoal,
  withdrawFromGoal,
  deleteSavingsGoal,
  getInvestmentAccount,
  createInvestmentAccount,
  getPortfolio,
  getPortfolioTransactions,
  getAssets,
  getAssetById,
  buyAsset,
  sellAsset,
  swapAssets,
  getCryptoMarket,
  getStockMarket,
  getForexRates,
  convertForex,
  exchangeForexWallet,
  getAdminInvestmentsOverview,
  syncAdminMarketAssets,
  upsertAdminAsset,
  deleteAdminAsset,
  getInterestPlans,
  getInvestmentSummary,
};
