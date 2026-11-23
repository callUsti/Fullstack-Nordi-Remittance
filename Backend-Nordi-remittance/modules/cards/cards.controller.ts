// ============================================================================
// CARD CONTROLLER
// ============================================================================

import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../../types/index.js';
import {
  Cards,
  CardTokens,
  CardTransactions,
  CardControls,
  CardLimits,
  CardApplications,
} from './cards.model.js';
import { Wallets, LedgerEntries, AccountBalances } from '../accounts/accounts.model.js';
import Users from '../users/users.model.js';
import Transactions from '../transactions/transactions.model.js';
import {
  generateCardNumber,
  generateCVV,
  generateReferenceNumber,
} from '../../core/helpers/generator.js';
import { encrypt, decrypt, maskCardNumber } from '../../core/helpers/crypto.helper.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../core/helpers/response.helper.js';
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../../core/errors/AppError.js';
import { queueTemplatedMail } from '../../services/workers.js';
import EmailContentGenerator from '../../core/mail/Mail-content.js';
import { validateUserEligibility } from '../../core/guards/user-eligibility.guard.js';
import { emitToUser } from '../../services/websocket.service.js';
import { WS } from '../../core/constants/ws-events.js';

// Initialize email content generator
const emailGenerator = new EmailContentGenerator();

// Helper functions for wallet balance operations (Map-based)
function getWalletBalance(wallet: any, currency: string): number {
  const upper = currency.toUpperCase();
  if (wallet.balances instanceof Map) {
    const val = wallet.balances.get(upper) ?? wallet.balances.get(currency.toLowerCase());
    if (val !== undefined) return Number(val) || 0;
  } else if (wallet.balances && typeof wallet.balances === 'object') {
    const key = Object.keys(wallet.balances).find((k) => k.toUpperCase() === upper);
    if (key) return Number(wallet.balances[key]) || 0;
  }
  return Number(wallet.balance || 0);
}

function updateWalletBalance(wallet: any, currency: string, newBalance: number): void {
  if (wallet.balances instanceof Map) {
    wallet.balances.set(currency, newBalance);
  } else if (wallet.balances && typeof wallet.balances === 'object') {
    wallet.balances[currency] = newBalance;
  } else {
    wallet.balances = new Map([[currency, newBalance]]);
  }
}

function getWalletCurrency(wallet: any): string {
  if (wallet.balances instanceof Map) {
    const keys = Array.from(wallet.balances.keys());
    return keys.length > 0 ? String(keys[0]) : 'USD';
  }
  if (wallet.balances && typeof wallet.balances === 'object') {
    return Object.keys(wallet.balances)[0] || 'USD';
  }
  return 'USD';
}

function safeDecrypt(value?: string): string {
  if (!value) return '';
  if (/^\d{3,19}$/.test(value.trim())) return value.trim();
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

// ============================================================================
// GET USER CARDS
// ============================================================================

export async function getCards(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const cards = await Cards.find({ user: req.user.userId })
      .populate('wallet', 'walletNumber walletType currency balances status isPrimary')
      .populate('fundingSource', 'walletNumber walletType currency balances status isPrimary')
      .populate('limits')
      .populate('controls')
      .lean();

    // Mask card numbers for default display, and include decrypted fullCardNumber & fullCvv for owner's "See Details"
    const maskedCards = cards.map((card) => {
      const plainNumber = safeDecrypt(card.cardNumber);
      const plainCvv = safeDecrypt(card.cvv);
      return {
        ...card,
        cardNumber: maskCardNumber(plainNumber),
        fullCardNumber: plainNumber,
        last4: plainNumber.slice(-4),
        cvv: '***',
        fullCvv: plainCvv,
        pin: undefined,
      };
    });

    sendSuccess(res, { cards: maskedCards });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// GET SINGLE CARD
// ============================================================================

export async function getCardById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const findQuery: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }], user: req.user.userId }
      : { cardId: id, user: req.user.userId };

    const card = await Cards.findOne(findQuery)
      .populate('wallet', 'walletNumber walletType currency balances status isPrimary')
      .populate('fundingSource', 'walletNumber walletType currency balances status isPrimary')
      .populate('limits')
      .populate('controls')
      .lean();

    if (!card) throw new NotFoundError('Card not found');

    // Get recent transactions
    const recentTransactions = await CardTransactions.find({ card: card._id })
      .select('transactionType amount currency merchantName status createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const plainNumber = safeDecrypt(card.cardNumber);
    const plainCvv = safeDecrypt(card.cvv);
    sendSuccess(res, {
      card: {
        ...card,
        cardNumber: maskCardNumber(plainNumber),
        fullCardNumber: plainNumber,
        last4: plainNumber.slice(-4),
        cvv: '***',
        fullCvv: plainCvv,
        pin: undefined,
      },
      recentTransactions,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// CREATE VIRTUAL CARD
// ============================================================================

export async function createVirtualCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    // Validate user eligibility (KYC approved, account active & unlocked)
    await validateUserEligibility(req.user.userId, 'virtual card creation');

    const { walletId, cardType, cardBrand, cardholderName, currency } = req.body;

    // Verify user
    const user = await Users.findById(req.user.userId).session(session);
    if (!user) throw new NotFoundError('User not found');

    // Verify wallet (Wallets schema uses `user`, not `userId`)
    const wallet = walletId
      ? await Wallets.findOne({
          _id: walletId,
          user: req.user.userId,
          status: 'active',
        }).session(session)
      : await Wallets.findOne({
          user: req.user.userId,
          status: 'active',
        })
          .sort({ isPrimary: -1 })
          .session(session);

    if (!wallet) throw new NotFoundError('Wallet not found');

    // Check card limit (max 5 cards per user)
    const existingCards = await Cards.countDocuments({ user: req.user.userId });
    if (existingCards >= 5) {
      throw new ForbiddenError('Maximum card limit reached (5 cards)');
    }

    // Generate card details
    const cardNumber = generateCardNumber(cardBrand || 'visa');
    const cvv = generateCVV();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    // Create card (supports virtual debit and virtual credit cards)
    const walletCurrency = currency || getWalletCurrency(wallet);
    const isCredit = cardType === 'credit';
    const initialCreditLimit = isCredit ? Number(req.body.creditLimit) || 10000 : undefined;
    const initialInterestRate = isCredit ? Number(req.body.interestRate) || 5.0 : 0;

    const card = new Cards({
      user: req.user.userId,
      wallet: wallet._id,
      fundingSource: wallet._id,
      linkedWallets: [
        {
          wallet: wallet._id,
          addedAt: new Date(),
          addedBy: req.user.userId,
          isActive: true,
        },
      ],
      cardNumber: encrypt(cardNumber),
      cardholderName: cardholderName || `${(user as any).firstName} ${(user as any).lastName}`,
      cardType: isCredit ? 'credit' : cardType || 'virtual',
      cardBrand: cardBrand || 'visa',
      expiryMonth: expiryDate.getMonth() + 1,
      expiryYear: expiryDate.getFullYear(),
      cvv: encrypt(cvv),
      status: 'active',
      isPhysical: false,
      creditLimit: initialCreditLimit,
      availableCredit: initialCreditLimit,
      interestRate: initialInterestRate,
      creditUsed: 0,
      accruedInterest: 0,
      totalDebt: 0,
      totalRepaid: 0,
      autoDebitWhenEmpty: true,
      currency: walletCurrency,
      isInternationalEnabled: false,
      isOnlineEnabled: true,
      isContactlessEnabled: true,
      isAtmEnabled: false,
    });

    await card.save({ session });

    // Create default limits
    const limits = new CardLimits({
      card: card._id,
      dailyLimit: 5000,
      monthlyLimit: 50000,
      perTransactionLimit: 2500,
      atmDailyLimit: 0, // Virtual cards can't withdraw
      atmMonthlyLimit: 0,
      currency: walletCurrency,
      resetDate: new Date(),
    });

    await limits.save({ session });

    // Create default controls
    const controls = new CardControls({
      card: card._id,
      allowInternational: false,
      allowOnline: true,
      allowAtm: false,
      allowContactless: true,
      allowMagStripe: true,
      blockedMerchantCategories: ['gambling', 'adult'],
    });

    await controls.save({ session });

    // Update card with references
    card.limits = limits._id;
    card.controls = controls._id;
    await card.save({ session });

    await session.commitTransaction();

    // Send notification using template
    const emailContent = emailGenerator.cardIssuedEmail({
      cardholderName: cardholderName || `${(user as any).firstName} ${(user as any).lastName}`,
      cardType: 'Virtual Card',
      cardBrand: (cardBrand || 'visa').toUpperCase(),
      lastFour: cardNumber.slice(-4),
      expiryMonth: String(card.expiryMonth),
      expiryYear: String(card.expiryYear),
      status: 'active',
      cardId: card.cardId || card._id.toString(),
    });

    queueTemplatedMail((user as any).email, emailContent).catch(console.error);

    emitToUser(req.user!.userId, WS.CARD.CREATED, {
      cardId: card.cardId || card._id,
      last4: cardNumber.slice(-4),
      cardType: card.cardType,
      cardBrand: card.cardBrand,
      status: card.status,
      isPhysical: false,
      timestamp: new Date().toISOString(),
    });

    sendCreated(
      res,
      {
        card: {
          id: card._id,
          cardId: card.cardId,
          cardNumber: maskCardNumber(cardNumber),
          last4: cardNumber.slice(-4),
          cardholderName: card.cardholderName,
          cardType: card.cardType,
          cardBrand: card.cardBrand,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          status: card.status,
          currency: card.currency,
        },
      },
      'Virtual card created successfully',
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// ============================================================================
// REQUEST PHYSICAL CARD
// ============================================================================

export async function requestPhysicalCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    // Validate user eligibility (KYC approved, account active & unlocked)
    await validateUserEligibility(req.user.userId, 'physical card request');

    const { walletId, cardBrand, shippingAddress } = req.body;

    const user = await Users.findById(req.user.userId).session(session);
    if (!user) throw new NotFoundError('User not found');

    // Validate shipping address
    if (!shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.country) {
      throw new ValidationError('Complete shipping address required');
    }

    const wallet = walletId
      ? await Wallets.findOne({
          _id: walletId,
          user: req.user.userId,
          status: 'active',
        }).session(session)
      : await Wallets.findOne({
          user: req.user.userId,
          status: 'active',
        })
          .sort({ isPrimary: -1 })
          .session(session);

    if (!wallet) throw new NotFoundError('Wallet not found');

    // Get wallet currency
    const walletCurrency = getWalletCurrency(wallet);

    // Check for existing physical card request
    const existingPhysical = await Cards.findOne({
      user: req.user.userId,
      isPhysical: true,
      status: { $in: ['pending_activation', 'active'] },
    }).session(session);

    if (existingPhysical) {
      throw new ValidationError('You already have a physical card');
    }

    // Card issuance fee
    const issuanceFee = 10;
    const currentBalance = getWalletBalance(wallet, walletCurrency);
    if (currentBalance < issuanceFee) {
      throw new ValidationError(`Insufficient balance for card issuance fee ($${issuanceFee})`);
    }

    // Generate card details
    const cardNumber = generateCardNumber(cardBrand || 'visa');
    const cvv = generateCVV();
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    // Create card
    const card = new Cards({
      user: req.user.userId,
      wallet: wallet._id,
      cardNumber: encrypt(cardNumber),
      cardholderName: `${(user as any).firstName} ${(user as any).lastName}`,
      cardType: 'debit',
      cardBrand: cardBrand || 'visa',
      expiryMonth: expiryDate.getMonth() + 1,
      expiryYear: expiryDate.getFullYear(),
      cvv: encrypt(cvv),
      pin: encrypt(pin),
      status: 'pending_activation',
      isPhysical: true,
      currency: walletCurrency,
      billingAddress: shippingAddress,
      isInternationalEnabled: false,
      isOnlineEnabled: true,
      isContactlessEnabled: true,
      isAtmEnabled: true,
    });

    await card.save({ session });

    // Deduct issuance fee
    const newBalance = currentBalance - issuanceFee;
    updateWalletBalance(wallet, walletCurrency, newBalance);
    await wallet.save({ session });

    // Create transaction for ledger entry reference
    const reference = generateReferenceNumber();
    const transaction = new Transactions({
      wallet: wallet._id,
      type: 'fee',
      category: 'cards',
      categoryItemId: card._id.toString(),
      amount: issuanceFee,
      currency: walletCurrency,
      status: 'completed',
      referenceNumber: reference,
      initiatedBy: req.user.userId,
      description: 'Physical card issuance fee',
      completedAt: new Date(),
    });
    await transaction.save({ session });

    // Create ledger entry
    await LedgerEntries.create(
      [
        {
          wallet: wallet._id,
          transaction: transaction._id,
          entryType: 'debit',
          amount: issuanceFee,
          currency: walletCurrency,
          balance: newBalance,
          description: 'Physical card issuance fee',
          accountingDate: new Date(),
        },
      ],
      { session },
    );

    // Create limits
    const limits = new CardLimits({
      card: card._id,
      dailyLimit: 10000,
      monthlyLimit: 100000,
      perTransactionLimit: 5000,
      atmDailyLimit: 2000,
      atmMonthlyLimit: 20000,
      currency: walletCurrency,
      resetDate: new Date(),
    });

    await limits.save({ session });

    card.limits = limits._id;
    await card.save({ session });

    await session.commitTransaction();

    emitToUser(req.user!.userId, WS.CARD.REQUESTED, {
      cardId: card.cardId || card._id,
      last4: cardNumber.slice(-4),
      isPhysical: true,
      status: card.status,
      fee: issuanceFee,
      timestamp: new Date().toISOString(),
    });

    sendCreated(
      res,
      {
        card: {
          id: card._id,
          cardId: card.cardId,
          cardNumber: maskCardNumber(cardNumber),
          last4: cardNumber.slice(-4),
          status: card.status,
          isPhysical: true,
          shippingAddress,
          estimatedDelivery: '7-10 business days',
        },
        fee: issuanceFee,
      },
      'Physical card requested successfully',
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
}

// ============================================================================
// ACTIVATE CARD
// ============================================================================

export async function activateCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const { last4Digits, cvv } = req.body;

    const card = await Cards.findOne({
      $or: [{ _id: id }, { cardId: id }],
      user: req.user.userId,
      status: 'pending_activation',
    });

    if (!card) throw new NotFoundError('Card not found or already activated');

    // Verify card details
    const decryptedCardNumber = decrypt(card.cardNumber);
    const decryptedCvv = decrypt(card.cvv);

    if (decryptedCardNumber.slice(-4) !== last4Digits) {
      throw new ValidationError('Invalid card details');
    }

    if (decryptedCvv !== cvv) {
      throw new ValidationError('Invalid CVV');
    }

    card.status = 'active';
    card.activationDate = new Date();
    await card.save();

    emitToUser(req.user!.userId, WS.CARD.ACTIVATED, {
      cardId: card.cardId || card._id,
      status: card.status,
      activationDate: card.activationDate,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        card: {
          id: card._id,
          cardId: card.cardId,
          status: card.status,
          activationDate: card.activationDate,
        },
      },
      'Card activated successfully',
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// BLOCK/UNBLOCK CARD
// ============================================================================

export async function blockCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const { reason } = req.body;

    const card = await Cards.findOne({
      $or: [{ _id: id }, { cardId: id }],
      user: req.user.userId,
      status: { $in: ['active', 'pending_activation'] },
    });

    if (!card) throw new NotFoundError('Card not found');

    card.status = 'blocked';
    card.blockedReason = reason || 'User requested';
    card.blockedAt = new Date();
    await card.save();

    const user = await Users.findById(req.user.userId);
    if (user) {
      const emailContent = emailGenerator.cardBlockedEmail({
        cardholderName:
          card.cardholderName || `${(user as any).firstName} ${(user as any).lastName}`,
        cardId: card.cardId || card._id.toString(),
        lastFour: maskCardNumber(decrypt(card.cardNumber)).slice(-4),
        cardType: card.cardBrand?.toUpperCase() || 'CARD',
        blockedAt: new Date().toISOString(),
        reason: reason || 'User requested',
        blockedBy: 'user',
      });

      queueTemplatedMail((user as any).email, emailContent).catch(console.error);
    }

    emitToUser(req.user!.userId, WS.CARD.BLOCKED, {
      cardId: card.cardId || card._id,
      status: card.status,
      reason: reason || 'User requested',
      blockedAt: card.blockedAt,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        card: {
          id: card._id,
          cardId: card.cardId,
          status: card.status,
          blockedAt: card.blockedAt,
        },
      },
      'Card blocked successfully',
    );
  } catch (error) {
    next(error);
  }
}

export async function unblockCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;

    const card = await Cards.findOne({
      $or: [{ _id: id }, { cardId: id }],
      user: req.user.userId,
      status: 'blocked',
    });

    if (!card) throw new NotFoundError('Card not found or not blocked');

    card.status = 'active';
    card.blockedReason = undefined;
    card.blockedAt = undefined;
    await card.save();

    emitToUser(req.user!.userId, WS.CARD.UNBLOCKED, {
      cardId: card.cardId || card._id,
      status: card.status,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        card: {
          id: card._id,
          cardId: card.cardId,
          status: card.status,
        },
      },
      'Card unblocked successfully',
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// REPORT LOST/STOLEN
// ============================================================================

export async function reportLostStolen(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const { type, description } = req.body; // type: 'lost' | 'stolen'

    const card = await Cards.findOne({
      $or: [{ _id: id }, { cardId: id }],
      user: req.user.userId,
    });

    if (!card) throw new NotFoundError('Card not found');

    card.status = type === 'stolen' ? 'stolen' : 'lost';
    card.blockedReason = description || `Reported ${type}`;
    card.blockedAt = new Date();
    await card.save();

    const user = await Users.findById(req.user.userId);
    if (user) {
      const emailContent = emailGenerator.cardReportedEmail({
        cardholderName:
          card.cardholderName || `${(user as any).firstName} ${(user as any).lastName}`,
        cardId: card.cardId || card._id.toString(),
        lastFour: maskCardNumber(decrypt(card.cardNumber)).slice(-4),
        cardType: card.cardBrand?.toUpperCase() || 'CARD',
        reportType: type as 'lost' | 'stolen' | 'damaged',
        reportedAt: new Date().toISOString(),
      });

      queueTemplatedMail((user as any).email, emailContent).catch(console.error);
    }

    emitToUser(req.user!.userId, WS.CARD.REPORTED, {
      cardId: card.cardId || card._id,
      reportType: type,
      status: card.status,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(res, {
      message: `Card reported as ${type} and has been permanently blocked`,
      canRequestReplacement: true,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// UPDATE CARD LIMITS
// ============================================================================

export async function updateCardLimits(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const {
      dailyTransactionLimit,
      dailyWithdrawalLimit,
      monthlyTransactionLimit,
      perTransactionLimit,
    } = req.body;

    const card = await Cards.findOne({
      $or: [{ _id: id }, { cardId: id }],
      user: req.user.userId,
    });

    if (!card) throw new NotFoundError('Card not found');

    const limits = await CardLimits.findOne({ card: card._id });
    if (!limits) throw new NotFoundError('Card limits not found');

    // Update limits (with max caps) - using correct schema field names
    if (dailyTransactionLimit !== undefined) {
      limits.dailyLimit = Math.min(dailyTransactionLimit, 50000);
    }
    if (dailyWithdrawalLimit !== undefined && card.isPhysical) {
      limits.atmDailyLimit = Math.min(dailyWithdrawalLimit, 5000);
    }
    if (monthlyTransactionLimit !== undefined) {
      limits.monthlyLimit = Math.min(monthlyTransactionLimit, 500000);
    }
    if (perTransactionLimit !== undefined) {
      limits.perTransactionLimit = Math.min(perTransactionLimit, 25000);
    }

    await limits.save();

    emitToUser(req.user!.userId, WS.CARD.LIMITS_UPDATED, {
      cardId: card.cardId || card._id,
      limits: {
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit,
        perTransactionLimit: limits.perTransactionLimit,
      },
      timestamp: new Date().toISOString(),
    });

    sendSuccess(res, { limits }, 'Card limits updated successfully');
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// UPDATE CARD CONTROLS
// ============================================================================

export async function updateCardControls(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const {
      isInternationalEnabled,
      isOnlineEnabled,
      isContactlessEnabled,
      isAtmEnabled,
      blockedMerchantCategories,
      blockedCountries,
    } = req.body;

    const card = await Cards.findOne({
      $or: [{ _id: id }, { cardId: id }],
      user: req.user.userId,
    });

    if (!card) throw new NotFoundError('Card not found');

    // Update card settings
    if (isInternationalEnabled !== undefined) card.isInternationalEnabled = isInternationalEnabled;
    if (isOnlineEnabled !== undefined) card.isOnlineEnabled = isOnlineEnabled;
    if (isContactlessEnabled !== undefined) card.isContactlessEnabled = isContactlessEnabled;
    if (isAtmEnabled !== undefined && card.isPhysical) card.isAtmEnabled = isAtmEnabled;

    await card.save();

    // Update controls
    if (blockedMerchantCategories || blockedCountries) {
      const controls = await CardControls.findOne({ card: card._id });
      if (controls) {
        if (blockedMerchantCategories)
          controls.blockedMerchantCategories = blockedMerchantCategories;
        if (blockedCountries) controls.blockedCountries = blockedCountries;
        await controls.save();
      }
    }

    emitToUser(req.user!.userId, WS.CARD.CONTROLS_UPDATED, {
      cardId: card.cardId || card._id,
      controls: {
        isInternationalEnabled: card.isInternationalEnabled,
        isOnlineEnabled: card.isOnlineEnabled,
        isContactlessEnabled: card.isContactlessEnabled,
        isAtmEnabled: card.isAtmEnabled,
      },
      timestamp: new Date().toISOString(),
    });

    sendSuccess(
      res,
      {
        card: {
          id: card._id,
          isInternationalEnabled: card.isInternationalEnabled,
          isOnlineEnabled: card.isOnlineEnabled,
          isContactlessEnabled: card.isContactlessEnabled,
          isAtmEnabled: card.isAtmEnabled,
        },
      },
      'Card controls updated successfully',
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// GET CARD TRANSACTIONS
// ============================================================================

export async function getCardTransactions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const card = await Cards.findOne({
      $or: [{ _id: id }, { cardId: id }],
      user: req.user.userId,
    });

    if (!card) throw new NotFoundError('Card not found');

    const filter: any = { card: card._id };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.transactionType = req.query.type;

    const [transactions, total] = await Promise.all([
      CardTransactions.find(filter)
        .select(
          'transactionType amount currency merchantName merchantCategory status authorizationCode createdAt',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CardTransactions.countDocuments(filter),
    ]);

    sendPaginated(res, transactions, { page, limit, total });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// CHANGE PIN
// ============================================================================

export async function changePin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const { currentPin, newPin } = req.body;

    if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      throw new ValidationError('PIN must be 4 digits');
    }

    const card = await Cards.findOne({
      $or: [{ _id: id }, { cardId: id }],
      user: req.user.userId,
      isPhysical: true,
    });

    if (!card) throw new NotFoundError('Physical card not found');

    // Verify current PIN
    if (card.pin && decrypt(card.pin) !== currentPin) {
      throw new ValidationError('Current PIN is incorrect');
    }

    card.pin = encrypt(newPin);
    await card.save();

    emitToUser(req.user!.userId, WS.CARD.PIN_CHANGED, {
      cardId: card.cardId || card._id,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(res, null, 'PIN changed successfully');
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// GET CARD DETAILS (Full - for display)
// ============================================================================

export async function getCardDetails(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const id = req.params.cardId || req.params.id;
    const findQuery: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }], user: req.user.userId }
      : { cardId: id, user: req.user.userId };

    const card = await Cards.findOne(findQuery);

    if (!card) throw new NotFoundError('Card not found');

    // Return full card details (for in-app display with proper security)
    sendSuccess(res, {
      cardNumber: safeDecrypt(card.cardNumber),
      cvv: safeDecrypt(card.cvv),
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      cardholderName: card.cardholderName,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN: GET ALL CARDS
// ============================================================================

export async function getAllCards(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.cardType) filter.cardType = req.query.cardType;
    if (req.query.userId) filter.user = req.query.userId;

    const [cards, total] = await Promise.all([
      Cards.find(filter)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Cards.countDocuments(filter),
    ]);

    const maskedCards = cards.map((card) => {
      const plainNumber = safeDecrypt(card.cardNumber);
      return {
        ...card,
        cardNumber: maskCardNumber(plainNumber),
        last4: plainNumber.slice(-4),
        cvv: '***',
        pin: undefined,
      };
    });

    sendPaginated(res, maskedCards, { page, limit, total });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// NEW: FUND CARD (User / Admin)
// ============================================================================

export async function fundCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const id = req.params.cardId || req.params.id;
    const { amount, fromWalletId, notes, mode } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      throw new ValidationError('Amount must be greater than zero');
    }

    const query: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }] }
      : { cardId: id };
    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'support_agent';
    if (!isAdmin) {
      query.user = req.user.userId;
    }

    const card: any = await Cards.findOne(query).populate('wallet');
    if (!card) throw new NotFoundError('Card not found');
    if (
      card.status === 'blocked' ||
      card.status === 'expired' ||
      card.status === 'stolen' ||
      card.status === 'lost'
    ) {
      throw new ValidationError(`Cannot fund card in ${card.status} status`);
    }

    const targetWalletId = fromWalletId || card.fundingSource || card.wallet?._id || card.wallet;
    const wallet: any = targetWalletId
      ? await Wallets.findOne(
          isAdmin ? { _id: targetWalletId } : { _id: targetWalletId, user: req.user.userId, status: 'active' }
        )
      : await Wallets.findOne({ user: card.user, status: 'active' }).sort({ isPrimary: -1 });

    if (!wallet && !isAdmin) {
      throw new NotFoundError('Please select an active account to fund or link this card');
    }

    const currency = (card.currency || (wallet ? getWalletCurrency(wallet) : 'USD')).toUpperCase();
    const plainLast4 = safeDecrypt(card.cardNumber).slice(-4) || '0000';

    // ── CASE A: CREDIT CARD — PAY OFF CREDIT DEBT FROM SELECTED ACCOUNT ────
    if (card.cardType === 'credit' && mode === 'repay') {
      if (!wallet) throw new NotFoundError('Active source account required to repay credit debt');
      const currentDebt = Number(card.totalDebt || 0);
      if (currentDebt <= 0) {
        throw new ValidationError('This credit card has no outstanding debt to repay');
      }
      const repayAmount = Math.min(numAmount, currentDebt);
      const currentBal = getWalletBalance(wallet, currency);
      if (currentBal < repayAmount) {
        throw new ValidationError(
          `Insufficient balance in selected account ($${currentBal.toFixed(2)}) to repay $${repayAmount.toFixed(2)}`
        );
      }

      updateWalletBalance(wallet, currency, currentBal - repayAmount);
      card.fundingSource = wallet._id;
      card.wallet = wallet._id;
      await wallet.save();

      await AccountBalances.updateOne(
        { wallet: wallet._id, currency },
        { $inc: { availableBalance: -repayAmount, ledgerBalance: -repayAmount } }
      ).catch(() => {});

      const interestPaid = Math.min(repayAmount, Number(card.accruedInterest || 0));
      const principalPaid = Math.max(0, Math.round((repayAmount - interestPaid) * 100) / 100);

      card.accruedInterest = Math.max(0, Math.round(((card.accruedInterest || 0) - interestPaid) * 100) / 100);
      card.creditUsed = Math.max(0, Math.round(((card.creditUsed || 0) - principalPaid) * 100) / 100);
      card.totalDebt = Math.max(0, Math.round((card.creditUsed + card.accruedInterest) * 100) / 100);
      card.totalRepaid = Math.round(((card.totalRepaid || 0) + repayAmount) * 100) / 100;
      card.availableCredit = Math.max(0, Math.round(((card.creditLimit || 10000) - card.creditUsed) * 100) / 100);
      await card.save();

      await Transactions.create({
        wallet: wallet._id,
        referenceNumber: generateReferenceNumber(),
        type: 'payment',
        category: 'cards',
        amount: repayAmount,
        currency,
        status: 'completed',
        description: notes || `Credit Card Debt Repayment (Card •••• ${plainLast4}) — Remaining Debt: $${card.totalDebt.toFixed(2)}`,
        initiatedBy: req.user.userId,
        completedAt: new Date(),
      }).catch(() => {});

      await CardTransactions.create({
        card: card._id,
        amount: repayAmount,
        currency,
        transactionType: 'refund',
        merchantName: `Debt Repayment from Account ${wallet.walletNumber}`,
        merchantCategory: 'repayment',
        status: 'completed',
      }).catch(() => {});

      sendSuccess(
        res,
        {
          card,
          balance: card.balance,
          totalDebt: card.totalDebt,
          creditUsed: card.creditUsed,
          accruedInterest: card.accruedInterest,
          availableCredit: card.availableCredit,
        },
        `Repaid $${repayAmount.toFixed(2)} from account ${wallet.walletNumber}. Remaining debt: $${card.totalDebt.toFixed(2)}`
      );
      return;
    }

    // ── CASE B: CREDIT CARD — FUND ON CREDIT (ADDS PRINCIPAL + INTEREST AS DEBT TO LINKED ACCOUNT) ──
    if (card.cardType === 'credit' && !isAdmin) {
      const maxCredit = Number(card.creditLimit || 10000);
      const usedCredit = Number(card.creditUsed || 0);
      const availCredit = Math.max(0, Number(card.availableCredit ?? maxCredit - usedCredit));

      if (numAmount > availCredit) {
        throw new ValidationError(
          `Requested credit ($${numAmount.toFixed(2)}) exceeds available credit limit ($${availCredit.toFixed(2)})`
        );
      }

      const rate = Number(card.interestRate || 5.0);
      const interestAmount = Math.round(numAmount * (rate / 100) * 100) / 100;
      const debtAdded = Math.round((numAmount + interestAmount) * 100) / 100;

      if (wallet) {
        card.fundingSource = wallet._id;
        card.wallet = wallet._id;
      }

      card.balance = Math.round(((card.balance || 0) + numAmount) * 100) / 100;
      card.creditUsed = Math.round((usedCredit + numAmount) * 100) / 100;
      card.accruedInterest = Math.round(((card.accruedInterest || 0) + interestAmount) * 100) / 100;
      card.totalDebt = Math.round((card.creditUsed + card.accruedInterest) * 100) / 100;
      card.availableCredit = Math.max(0, Math.round((maxCredit - card.creditUsed) * 100) / 100);
      await card.save();

      if (wallet) {
        await Transactions.create({
          wallet: wallet._id,
          referenceNumber: generateReferenceNumber(),
          type: 'payment',
          category: 'cards',
          amount: debtAdded,
          currency,
          fee: interestAmount,
          feeCurrency: currency,
          status: 'pending',
          description:
            notes ||
            `Credit Card Funded on Credit (•••• ${plainLast4}): $${numAmount.toFixed(2)} + ${rate}% interest ($${interestAmount.toFixed(2)}) = $${debtAdded.toFixed(2)} debt linked to Account ${wallet.walletNumber}`,
          initiatedBy: req.user.userId,
        }).catch(() => {});
      }

      await CardTransactions.create({
        card: card._id,
        amount: numAmount,
        currency,
        transactionType: 'cash_advance',
        merchantName: `Funded on Credit (${rate}% Interest: +$${interestAmount.toFixed(2)})`,
        merchantCategory: 'credit_draw',
        status: 'completed',
      }).catch(() => {});

      if (interestAmount > 0) {
        await CardTransactions.create({
          card: card._id,
          amount: interestAmount,
          currency,
          transactionType: 'interest',
          merchantName: `Credit Facility Interest (${rate}%)`,
          merchantCategory: 'interest',
          status: 'completed',
        }).catch(() => {});
      }

      sendSuccess(
        res,
        {
          card,
          balance: card.balance,
          interestRate: rate,
          interestAdded: interestAmount,
          totalDebt: card.totalDebt,
          creditUsed: card.creditUsed,
          accruedInterest: card.accruedInterest,
          availableCredit: card.availableCredit,
        },
        `Funded $${numAmount.toFixed(2)} on credit (+$${interestAmount.toFixed(2)} interest at ${rate}%). Total debt on linked account: $${card.totalDebt.toFixed(2)}`
      );
      return;
    }

    // ── CASE C: DEBIT / VIRTUAL / PHYSICAL CARD — DEBIT SELECTED ACTIVE ACCOUNT ──
    if (!isAdmin && wallet) {
      const currentBal = getWalletBalance(wallet, currency);
      if (currentBal < numAmount) {
        throw new ValidationError(
          `Insufficient balance in selected account ($${currentBal.toFixed(2)}) to fund $${numAmount.toFixed(2)}`
        );
      }
      updateWalletBalance(wallet, currency, currentBal - numAmount);
      card.fundingSource = wallet._id;
      card.wallet = wallet._id;
      await wallet.save();

      await AccountBalances.updateOne(
        { wallet: wallet._id, currency },
        { $inc: { availableBalance: -numAmount, ledgerBalance: -numAmount } }
      ).catch(() => {});

      await Transactions.create({
        wallet: wallet._id,
        referenceNumber: generateReferenceNumber(),
        type: 'transfer',
        category: 'cards',
        amount: numAmount,
        currency,
        status: 'completed',
        description: notes || `Card Funding from Account ${wallet.walletNumber} to Card •••• ${plainLast4}`,
        initiatedBy: req.user.userId,
        completedAt: new Date(),
      }).catch(() => {});
    }

    card.balance = Math.round(((card.balance || 0) + numAmount) * 100) / 100;
    await card.save();

    try {
      await CardTransactions.create({
        card: card._id,
        amount: numAmount,
        currency,
        transactionType: 'cash_advance',
        merchantName: isAdmin
          ? 'Admin Fund Transfer'
          : `Funded from Account ${wallet?.walletNumber || ''}`.trim(),
        merchantCategory: 'deposit',
        status: 'completed',
      });
    } catch (e) {
      console.error('Failed to log card funding transaction', e);
    }

    sendSuccess(
      res,
      { card, balance: card.balance },
      `Successfully funded card with $${numAmount.toFixed(2)} from account ${wallet?.walletNumber || ''}`.trim(),
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// NEW: WITHDRAW FROM CARD (User / Admin)
// ============================================================================

export async function withdrawFromCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const id = req.params.cardId || req.params.id;
    const { amount, toWalletId, notes } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      throw new ValidationError('Amount must be greater than zero');
    }

    const query: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }] }
      : { cardId: id };
    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'support_agent';
    if (!isAdmin) {
      query.user = req.user.userId;
    }

    const card = await Cards.findOne(query);
    if (!card) throw new NotFoundError('Card not found');
    if ((card.balance || 0) < numAmount && !isAdmin) {
      throw new ValidationError(
        `Insufficient card balance ($${card.balance || 0}) to withdraw $${numAmount.toFixed(2)}`,
      );
    }

    card.balance = Math.max(0, (card.balance || 0) - numAmount);
    await card.save();

    if (!isAdmin) {
      const wallet = await Wallets.findById(toWalletId || card.wallet);
      if (wallet) {
        const currency = card.currency || 'USD';
        const currentBal = getWalletBalance(wallet, currency);
        updateWalletBalance(wallet, currency, currentBal + numAmount);
        await wallet.save();
      }
    }

    try {
      await CardTransactions.create({
        card: card._id,
        amount: numAmount,
        currency: card.currency || 'USD',
        transactionType: 'withdrawal',
        merchantName: isAdmin ? 'Admin Fund Removal' : 'Wallet Withdrawal',
        merchantCategory: 'withdrawal',
        status: 'completed',
      });
    } catch (e) {
      console.error('Failed to log card withdrawal transaction', e);
    }

    sendSuccess(
      res,
      { card, balance: card.balance },
      `Successfully removed $${numAmount.toFixed(2)} from card`,
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// NEW: TOGGLE FREEZE CARD (User / Admin)
// ============================================================================

export async function toggleFreezeCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const id = req.params.cardId || req.params.id;
    const query: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }] }
      : { cardId: id };
    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'support_agent';
    if (!isAdmin) {
      query.user = req.user.userId;
    }

    const card = await Cards.findOne(query);
    if (!card) throw new NotFoundError('Card not found');

    if (card.status === 'active' || card.status === 'pending_activation') {
      card.status = 'blocked';
      card.blockedReason = 'User froze card';
      card.blockedAt = new Date();
    } else if (card.status === 'blocked') {
      card.status = 'active';
      card.blockedReason = undefined;
      card.blockedAt = undefined;
    } else {
      throw new ValidationError(`Cannot toggle freeze for card in status: ${card.status}`);
    }

    await card.save();
    sendSuccess(res, { card, status: card.status }, `Card is now ${card.status}`);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// NEW: CANCEL CARD
// ============================================================================

export async function cancelCard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const id = req.params.cardId || req.params.id;
    const query: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }] }
      : { cardId: id };
    const isAdmin =
      req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'support_agent';
    if (!isAdmin) {
      query.user = req.user.userId;
    }

    const card = await Cards.findOne(query);
    if (!card) throw new NotFoundError('Card not found');

    card.status = 'expired';
    card.blockedReason = req.body.reason || 'Card cancelled by user';
    card.blockedAt = new Date();
    await card.save();

    sendSuccess(
      res,
      { message: 'Card cancelled successfully', card },
      'Card cancelled successfully',
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// NEW: UPGRADE CARD LIMIT
// ============================================================================

export async function upgradeCardLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const id = req.params.cardId || req.params.id;
    const { amount, creditLimit } = req.body;
    const numLimit = Number(creditLimit || amount);
    if (!numLimit || isNaN(numLimit) || numLimit < 0) {
      throw new ValidationError('Valid limit amount required');
    }

    const query: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }] }
      : { cardId: id };

    const card = await Cards.findOne(query);
    if (!card) throw new NotFoundError('Card not found');

    card.creditLimit = (card.creditLimit || 0) + numLimit;
    card.availableCredit = (card.availableCredit || 0) + numLimit;
    await card.save();

    sendSuccess(res, { card, creditLimit: card.creditLimit }, `Card limit upgraded successfully`);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// NEW: ADMIN UPDATE CARD STATUS
// ============================================================================

export async function adminUpdateCardStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const id = req.params.cardId || req.params.id;
    const { status } = req.body;
    if (!status) throw new ValidationError('Status parameter required');

    const query: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }] }
      : { cardId: id };

    const card = await Cards.findOne(query);
    if (!card) throw new NotFoundError('Card not found');

    card.status = status as any;
    if (status === 'active' && !card.activationDate) {
      card.activationDate = new Date();
    }
    await card.save();

    sendSuccess(res, { card, status: card.status }, `Card status updated to ${status}`);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// NEW: GET ALL CARD APPLICATIONS (Admin)
// ============================================================================

export async function getAllCardApplications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const [applications, total] = await Promise.all([
      CardApplications.find(filter)
        .populate('user', 'firstName lastName email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CardApplications.countDocuments(filter),
    ]);

    sendPaginated(res, applications, { page, limit, total });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// LINK CARD TO ACTIVE ACCOUNT (Fallback Debit if Empty / Credit Debt Account)
// ============================================================================

export async function linkCardAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const id = req.params.cardId || req.params.id;
    const { walletId, autoDebitWhenEmpty } = req.body;

    if (!walletId) throw new ValidationError('Please select an active account to link');

    const query: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { cardId: id }], user: req.user.userId }
      : { cardId: id, user: req.user.userId };

    const card: any = await Cards.findOne(query);
    if (!card) throw new NotFoundError('Card not found');

    const wallet: any = await Wallets.findOne({
      _id: walletId,
      user: req.user.userId,
      status: 'active',
    });
    if (!wallet) throw new NotFoundError('Selected account not found or not active');

    card.wallet = wallet._id;
    card.fundingSource = wallet._id;
    if (autoDebitWhenEmpty !== undefined) {
      card.autoDebitWhenEmpty = Boolean(autoDebitWhenEmpty);
    }

    card.linkedWallets = Array.isArray(card.linkedWallets) ? card.linkedWallets : [];
    const exists = card.linkedWallets.some(
      (lw: any) => String(lw.wallet) === String(wallet._id)
    );
    if (!exists) {
      card.linkedWallets.push({
        wallet: wallet._id,
        addedAt: new Date(),
        addedBy: req.user.userId,
        isActive: true,
      });
    }

    await card.save();

    if (!wallet.linkedCards?.some((cId: any) => String(cId) === String(card._id))) {
      wallet.linkedCards = [...(wallet.linkedCards || []), card._id];
      await wallet.save();
    }

    sendSuccess(
      res,
      {
        card,
        linkedWallet: {
          id: wallet._id,
          walletNumber: wallet.walletNumber,
          walletType: wallet.walletType,
        },
      },
      `Card linked to account ${wallet.walletNumber} for funding, empty-card auto-debit, and credit repayment`
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  getCards,
  getCardById,
  createVirtualCard,
  requestPhysicalCard,
  activateCard,
  blockCard,
  unblockCard,
  reportLostStolen,
  updateCardLimits,
  updateCardControls,
  getCardTransactions,
  changePin,
  getCardDetails,
  getAllCards,
  fundCard,
  withdrawFromCard,
  toggleFreezeCard,
  cancelCard,
  upgradeCardLimit,
  adminUpdateCardStatus,
  getAllCardApplications,
  linkCardAccount,
};
