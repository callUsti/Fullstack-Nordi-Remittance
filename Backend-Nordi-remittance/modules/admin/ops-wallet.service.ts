import mongoose from 'mongoose';
import { AdminUsers } from './admin.model.js';
import Users from '../users/users.model.js';
import { Wallets, LedgerEntries } from '../accounts/accounts.model.js';
import Transactions from '../transactions/transactions.model.js';
import { generateReferenceNumber } from '../../core/helpers/generator.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  InsufficientBalanceError,
} from '../../core/errors/AppError.js';
import { queueTemplatedMail } from '../../services/workers.js';
import EmailContentGenerator from '../../core/mail/Mail-content.js';

const emailGenerator = new EmailContentGenerator();
import { emitToUser } from '../../services/websocket.service.js';
import { WS } from '../../core/constants/ws-events.js';
import { validateUserEligibility } from '../../core/guards/user-eligibility.guard.js';
import { cacheDelete, CACHE_KEYS } from '../../services/redis.service.js';
import {
  calculateTransactionTax,
  createTaxRecord,
  getWalletBalance,
  updateWalletBalance,
  hasPermission,
  logAdminAction,
  notifyUser,
  TAX_RATE,
} from './ops.helpers.js';

export class OpsWalletService {
  /**
   * Credit a user's wallet
   */
  static async creditUserWallet(
    currentUserId: string,
    currentUserEmail: string,
    data: any,
    ip: string,
    userAgent: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const canCredit = await hasPermission(currentUserId, 'canAdjustBalances');
      if (!canCredit) {
        throw new ForbiddenError('You do not have permission to credit user wallets');
      }

      const {
        userId,
        walletId,
        amount,
        currency = 'USD',
        description,
        transactionType = 'deposit',
        reference,
        metadata,
      } = data;

      await validateUserEligibility(userId, 'credit wallet');

      if (!amount || amount <= 0) {
        throw new ValidationError('Amount must be greater than zero');
      }

      const { taxAmount, netAmount, isTaxExempt } = calculateTransactionTax(
        amount,
        transactionType,
      );

      const user = await Users.findById(userId).session(session);
      if (!user) throw new NotFoundError('User not found');

      let wallet = null;
      if (walletId) {
        if (mongoose.Types.ObjectId.isValid(walletId)) {
          wallet = await Wallets.findOne({ _id: walletId, user: userId }).session(session);
        }
        if (!wallet) {
          wallet = await Wallets.findOne({ walletNumber: walletId, user: userId }).session(session);
        }
      }
      if (!wallet) {
        wallet = await Wallets.findOne({ user: userId, isPrimary: true, status: 'active' }).session(session);
      }
      if (!wallet) {
        wallet = await Wallets.findOne({ user: userId, status: 'active' }).session(session);
      }
      if (!wallet) {
        wallet = new Wallets({
          user: userId,
          walletNumber: `W${Date.now()}${Math.random().toString(36).substring(7)}`,
          balances: new Map([[currency, 0]]),
          status: 'active',
          walletType: 'personal',
          isPrimary: true,
        });
      }

      const previousBalance = getWalletBalance(wallet, currency);
      const creditAmount = isTaxExempt ? amount : netAmount;
      updateWalletBalance(wallet, currency, creditAmount);
      const newBalance = getWalletBalance(wallet, currency);

      await wallet.save({ session });

      const referenceNumber = reference || generateReferenceNumber();
      const isInternational = metadata?.isInternational === true;
      const senderDetails = metadata?.sender || {};

      const transaction = new Transactions({
        wallet: wallet._id,
        referenceNumber,
        type: transactionType,
        category: 'bankAccounts',
        amount: creditAmount,
        currency,
        status: 'completed',
        description: description || `Admin credit: ${transactionType}`,
        initiatedBy: userId,
        fee: taxAmount,
        isInternational,
        recipientName: senderDetails.name || undefined,
        recipientBankName: senderDetails.bankName || undefined,
        recipientAccountNumber: senderDetails.accountNumber || undefined,
        exchangeRate: metadata?.exchangeRate || undefined,
        meta: {
          adminInitiated: true,
          adminId: currentUserId,
          adminEmail: currentUserEmail,
          previousBalance,
          newBalance,
          originalAmount: amount,
          taxAmount,
          taxRate: isTaxExempt ? 0 : TAX_RATE,
          isTaxExempt,
          transferType: isInternational ? 'international' : 'domestic',
          ...metadata,
        },
        completedAt: new Date(),
        channel: 'web',
        ipAddress: ip,
        userAgent,
      });

      await transaction.save({ session });

      if (taxAmount > 0) {
        await createTaxRecord(
          transaction._id,
          userId,
          transactionType,
          amount,
          taxAmount,
          currency,
          session,
        );
      }

      await LedgerEntries.create(
        [
          {
            wallet: wallet._id,
            transaction: transaction._id,
            entryType: 'credit',
            amount: creditAmount,
            currency,
            balance: newBalance,
            description: `Admin credit: ${description || transactionType}${taxAmount > 0 ? ` (Tax: ${currency} ${taxAmount.toFixed(2)})` : ''}`,
            accountingDate: new Date(),
          },
        ],
        { session },
      );

      await logAdminAction(
        currentUserId,
        'CREDIT_USER_WALLET',
        'wallet',
        wallet._id.toString(),
        {
          userId,
          originalAmount: amount,
          creditedAmount: creditAmount,
          taxAmount,
          taxRate: isTaxExempt ? 0 : TAX_RATE,
          isTaxExempt,
          currency,
          transactionType,
          previousBalance,
          newBalance,
          referenceNumber,
        },
        ip,
        userAgent,
        'success',
      );

      await session.commitTransaction();
      await cacheDelete(`${CACHE_KEYS.USER_WALLETS}${userId}`);

      const taxNote =
        taxAmount > 0
          ? ` (${currency} ${taxAmount.toFixed(2)} tax deducted from original ${currency} ${amount.toFixed(2)})`
          : '';
      await notifyUser(
        userId,
        'Wallet Credited',
        `Your wallet has been credited with ${currency} ${creditAmount.toFixed(2)}${taxNote}. Reference: ${referenceNumber}`,
        'transaction',
        { transactionId: transaction._id, amount: creditAmount, taxAmount, currency },
      );

      try {
        const emailContent = emailGenerator.adminWalletCreditEmail({
          firstName: user.firstName as string,
          currency,
          creditAmount,
          taxAmount,
          originalAmount: amount,
          referenceNumber,
          newBalance,
        });
        await queueTemplatedMail(String(user.email), emailContent);
      } catch (emailError) {
        console.error('Failed to send credit notification email:', emailError);
      }

      return {
        transaction: {
          id: transaction._id,
          referenceNumber,
          type: transactionType,
          originalAmount: amount,
          creditedAmount: creditAmount,
          taxAmount,
          taxRate: isTaxExempt ? '0%' : '20%',
          isTaxExempt,
          currency,
          status: 'completed',
          previousBalance,
          newBalance,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Debit a user's wallet
   */
  static async debitUserWallet(
    currentUserId: string,
    currentUserEmail: string,
    data: any,
    ip: string,
    userAgent: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const canDebit = await hasPermission(currentUserId, 'canAdjustBalances');
      if (!canDebit) {
        throw new ForbiddenError('You do not have permission to debit user wallets');
      }

      const {
        userId,
        walletId,
        amount,
        currency = 'USD',
        description,
        transactionType = 'withdrawal',
        reference,
        forceDebit = false,
        metadata,
      } = data;

      await validateUserEligibility(userId, 'debit wallet');

      if (!amount || amount <= 0) {
        throw new ValidationError('Amount must be greater than zero');
      }

      const user = await Users.findById(userId).session(session);
      if (!user) throw new NotFoundError('User not found');

      let wallet = null;
      if (walletId) {
        if (mongoose.Types.ObjectId.isValid(walletId)) {
          wallet = await Wallets.findOne({ _id: walletId, user: userId }).session(session);
        }
        if (!wallet) {
          wallet = await Wallets.findOne({ walletNumber: walletId, user: userId }).session(session);
        }
      }
      if (!wallet) {
        wallet = await Wallets.findOne({ user: userId, isPrimary: true, status: 'active' }).session(session);
      }
      if (!wallet) {
        wallet = await Wallets.findOne({ user: userId, status: 'active' }).session(session);
      }
      if (!wallet) throw new NotFoundError('User wallet not found');

      const previousBalance = getWalletBalance(wallet, currency);

      if (previousBalance < amount && !forceDebit) {
        throw new InsufficientBalanceError(amount, previousBalance);
      }

      if (forceDebit) {
        const admin = await AdminUsers.findById(currentUserId);
        if (admin?.role !== 'super_admin') {
          throw new ForbiddenError('Only super admin can force debit with insufficient balance');
        }
      }

      updateWalletBalance(wallet, currency, -amount);
      const newBalance = getWalletBalance(wallet, currency);

      await wallet.save({ session });

      const referenceNumber = reference || generateReferenceNumber();
      const isInternational = metadata?.isInternational === true;
      const recipientDetails = metadata?.recipient || {};

      const transaction = new Transactions({
        wallet: wallet._id,
        referenceNumber,
        type: transactionType,
        category: 'bankAccounts',
        amount,
        currency,
        status: 'completed',
        description: description || `Admin debit: ${transactionType}`,
        initiatedBy: userId,
        isInternational,
        recipientName: recipientDetails.name || undefined,
        recipientBankName: recipientDetails.bankName || undefined,
        recipientAccountNumber: recipientDetails.accountNumber || undefined,
        exchangeRate: metadata?.exchangeRate || undefined,
        meta: {
          adminInitiated: true,
          adminId: currentUserId,
          adminEmail: currentUserEmail,
          previousBalance,
          newBalance,
          forceDebit,
          transferType: isInternational ? 'international' : 'domestic',
          ...metadata,
        },
        completedAt: new Date(),
        channel: 'web',
        ipAddress: ip,
        userAgent,
      });

      await transaction.save({ session });

      await LedgerEntries.create(
        [
          {
            wallet: wallet._id,
            transaction: transaction._id,
            entryType: 'debit',
            amount,
            currency,
            balance: newBalance,
            description: `Admin debit: ${description || transactionType}`,
            accountingDate: new Date(),
          },
        ],
        { session },
      );

      await logAdminAction(
        currentUserId,
        'DEBIT_USER_WALLET',
        'wallet',
        wallet._id.toString(),
        {
          userId,
          amount,
          currency,
          transactionType,
          previousBalance,
          newBalance,
          forceDebit,
          referenceNumber,
        },
        ip,
        userAgent,
        'success',
      );

      await session.commitTransaction();
      await cacheDelete(`${CACHE_KEYS.USER_WALLETS}${userId}`);

      await notifyUser(
        userId,
        'Wallet Debited',
        `${currency} ${amount.toFixed(2)} has been debited from your wallet. Reference: ${referenceNumber}`,
        'transaction',
        { transactionId: transaction._id, amount, currency },
      );

      try {
        const emailContent = emailGenerator.adminWalletDebitEmail({
          firstName: user.firstName as string,
          currency,
          amount,
          referenceNumber,
          newBalance,
          reason: description || undefined,
        });
        await queueTemplatedMail(String(user.email), emailContent);
      } catch (emailError) {
        console.error('Failed to send debit notification email:', emailError);
      }

      return {
        transaction: {
          id: transaction._id,
          referenceNumber,
          type: transactionType,
          amount,
          currency,
          status: 'completed',
          previousBalance,
          newBalance,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Transfer funds between two users
   */
  static async adminTransfer(
    currentUserId: string,
    currentUserEmail: string,
    data: any,
    ip: string,
    userAgent: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const canTransfer = await hasPermission(currentUserId, 'canAdjustBalances');
      if (!canTransfer) {
        throw new ForbiddenError('You do not have permission to perform transfers');
      }

      const {
        fromUserId,
        toUserId,
        fromWalletId,
        toWalletId,
        amount,
        currency = 'USD',
        description,
        metadata,
      } = data;

      await Promise.all([
        validateUserEligibility(fromUserId, 'admin transfer (sender)'),
        validateUserEligibility(toUserId, 'admin transfer (recipient)'),
      ]);

      if (fromUserId === toUserId && (!fromWalletId || !toWalletId || fromWalletId === toWalletId)) {
        throw new ValidationError('Cannot transfer to the same account');
      }

      if (!amount || amount <= 0) {
        throw new ValidationError('Amount must be greater than zero');
      }

      const [fromUser, toUser] = await Promise.all([
        Users.findById(fromUserId).session(session),
        Users.findById(toUserId).session(session),
      ]);

      if (!fromUser) throw new NotFoundError('Sender not found');
      if (!toUser) throw new NotFoundError('Recipient not found');

      let fromWallet = null;
      if (fromWalletId) {
        if (mongoose.Types.ObjectId.isValid(fromWalletId)) {
          fromWallet = await Wallets.findOne({ _id: fromWalletId, user: fromUserId }).session(session);
        }
        if (!fromWallet) {
          fromWallet = await Wallets.findOne({ walletNumber: fromWalletId, user: fromUserId }).session(session);
        }
      }
      if (!fromWallet) {
        fromWallet = await Wallets.findOne({ user: fromUserId, isPrimary: true, status: 'active' }).session(session) ||
                     await Wallets.findOne({ user: fromUserId, status: 'active' }).session(session);
      }

      let toWallet = null;
      if (toWalletId) {
        if (mongoose.Types.ObjectId.isValid(toWalletId)) {
          toWallet = await Wallets.findOne({ _id: toWalletId, user: toUserId }).session(session);
        }
        if (!toWallet) {
          toWallet = await Wallets.findOne({ walletNumber: toWalletId, user: toUserId }).session(session);
        }
      }
      if (!toWallet) {
        toWallet = await Wallets.findOne({ user: toUserId, isPrimary: true, status: 'active' }).session(session) ||
                   await Wallets.findOne({ user: toUserId, status: 'active' }).session(session);
      }

      if (!fromWallet) throw new NotFoundError('Sender wallet not found');
      if (!toWallet) throw new NotFoundError('Recipient wallet not found');

      const fromPreviousBalance = getWalletBalance(fromWallet, currency);

      if (fromPreviousBalance < amount) {
        throw new InsufficientBalanceError(amount, fromPreviousBalance);
      }

      const toPreviousBalance = getWalletBalance(toWallet, currency);

      updateWalletBalance(fromWallet, currency, -amount);
      updateWalletBalance(toWallet, currency, amount);

      const fromNewBalance = getWalletBalance(fromWallet, currency);
      const toNewBalance = getWalletBalance(toWallet, currency);

      await fromWallet.save({ session });
      await toWallet.save({ session });

      const referenceNumber = generateReferenceNumber();

      const fromTransaction = new Transactions({
        wallet: fromWallet._id,
        referenceNumber,
        type: 'transfer',
        category: 'bankAccounts',
        amount,
        currency,
        status: 'completed',
        description: description || 'Admin initiated transfer',
        initiatedBy: fromUserId,
        recipientWallet: toWallet._id,
        recipientName: `${toUser.firstName} ${toUser.lastName}`,
        meta: {
          adminInitiated: true,
          adminId: currentUserId,
          adminEmail: currentUserEmail,
          previousBalance: fromPreviousBalance,
          newBalance: fromNewBalance,
          ...metadata,
        },
        completedAt: new Date(),
        channel: 'web',
        ipAddress: ip,
        userAgent,
      });

      const toTransaction = new Transactions({
        wallet: toWallet._id,
        referenceNumber: `${referenceNumber}-RCV`,
        type: 'deposit',
        category: 'bankAccounts',
        amount,
        currency,
        status: 'completed',
        description: description || 'Admin initiated transfer (received)',
        initiatedBy: toUserId,
        meta: {
          adminInitiated: true,
          adminId: currentUserId,
          relatedReference: referenceNumber,
          senderName: `${fromUser.firstName} ${fromUser.lastName}`,
          previousBalance: toPreviousBalance,
          newBalance: toNewBalance,
          ...metadata,
        },
        completedAt: new Date(),
        channel: 'web',
      });

      await fromTransaction.save({ session });
      await toTransaction.save({ session });

      await logAdminAction(
        currentUserId,
        'ADMIN_TRANSFER',
        'transaction',
        referenceNumber,
        {
          fromUserId,
          toUserId,
          amount,
          currency,
          fromPreviousBalance,
          fromNewBalance,
          toPreviousBalance,
          toNewBalance,
        },
        ip,
        userAgent,
        'success',
      );

      await session.commitTransaction();
      await Promise.all([
        cacheDelete(`${CACHE_KEYS.USER_WALLETS}${fromUserId}`),
        cacheDelete(`${CACHE_KEYS.USER_WALLETS}${toUserId}`),
      ]);

      await notifyUser(
        fromUserId,
        'Funds Transferred',
        `${currency} ${amount.toFixed(2)} has been transferred from your account. Reference: ${referenceNumber}`,
        'transaction',
        { transactionId: fromTransaction._id, amount, currency },
      );
      await notifyUser(
        toUserId,
        'Funds Received',
        `You have received ${currency} ${amount.toFixed(2)}. Reference: ${referenceNumber}`,
        'transaction',
        { transactionId: toTransaction._id, amount, currency },
      );

      return {
        transfer: {
          referenceNumber,
          amount,
          currency,
          from: {
            userId: fromUserId,
            name: `${fromUser.firstName} ${fromUser.lastName}`,
            previousBalance: fromPreviousBalance,
            newBalance: fromNewBalance,
          },
          to: {
            userId: toUserId,
            name: `${toUser.firstName} ${toUser.lastName}`,
            previousBalance: toPreviousBalance,
            newBalance: toNewBalance,
          },
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Bulk credit users
   */
  static async bulkCredit(currentUserId: string, data: any, ip: string, userAgent: string) {
    const admin = await AdminUsers.findById(currentUserId);
    if (admin?.role !== 'super_admin') {
      throw new ForbiddenError('Only super admin can perform bulk operations');
    }

    const { operations, description } = data;

    if (!Array.isArray(operations) || operations.length === 0) {
      throw new ValidationError('Operations array is required');
    }

    if (operations.length > 100) {
      throw new ValidationError('Maximum 100 operations per batch');
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const op of operations) {
      try {
        await validateUserEligibility(op.userId, 'bulk credit');

        const session = await mongoose.startSession();
        session.startTransaction();

        const user = await Users.findById(op.userId).session(session);
        if (!user) {
          errors.push({ userId: op.userId, error: 'User not found' });
          await session.abortTransaction();
          session.endSession();
          continue;
        }

        let wallet = await Wallets.findOne({ user: op.userId, status: 'active' }).session(session);
        if (!wallet) {
          wallet = new Wallets({
            user: op.userId,
            walletNumber: `W${Date.now()}${Math.random().toString(36).substring(7)}`,
            balances: new Map([[op.currency || 'USD', 0]]),
            status: 'active',
            walletType: 'personal',
            isPrimary: true,
          });
        }

        const currency = op.currency || 'USD';
        const previousBalance = getWalletBalance(wallet, currency);
        updateWalletBalance(wallet, currency, op.amount);
        const newBalance = getWalletBalance(wallet, currency);

        await wallet.save({ session });

        const referenceNumber = generateReferenceNumber();
        const transaction = new Transactions({
          wallet: wallet._id,
          referenceNumber,
          type: 'deposit',
          category: 'bankAccounts',
          amount: op.amount,
          currency,
          status: 'completed',
          description: description || 'Bulk credit',
          initiatedBy: op.userId,
          meta: { adminInitiated: true, adminId: currentUserId, bulkOperation: true },
          completedAt: new Date(),
          channel: 'web',
        });

        await transaction.save({ session });
        await session.commitTransaction();
        session.endSession();

        results.push({
          userId: op.userId,
          amount: op.amount,
          currency,
          previousBalance,
          newBalance,
          referenceNumber,
        });
      } catch (err: any) {
        errors.push({ userId: op.userId, error: err.message });
      }
    }

    await logAdminAction(
      currentUserId,
      'BULK_CREDIT',
      'wallet',
      'bulk',
      {
        totalOperations: operations.length,
        successful: results.length,
        failed: errors.length,
        description,
      },
      ip,
      userAgent,
      errors.length === operations.length ? 'failed' : 'success',
    );

    results.forEach((r: any) => {
      if (r.userId) {
        emitToUser(String(r.userId), WS.ADMIN.WALLET_FUND, {
          amount: r.amount,
          reference: r.referenceNumber,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return {
      summary: { total: operations.length, successful: results.length, failed: errors.length },
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get account applications (all statuses by default, or filtered by status/type)
   */
  static async getPendingApplications(filters?: { status?: string; type?: string }) {
    const { AccountApplications } = await import('../accounts/accounts.model.js');
    const query: any = {};
    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters?.type && filters.type !== 'all') {
      query.type = filters.type;
    }

    const apps = await AccountApplications.find(query)
      .sort({ submittedAt: -1 })
      .populate('user', 'firstName lastName email accountNumber mobileNumber country kycStatus status profilePicture')
      .lean();

    // Attach wallet info for approved applications that don't yet have walletNumber populated
    const userIds = Array.from(
      new Set(apps.map((a: any) => String(a.user?._id || a.user || '')).filter(Boolean)),
    );
    const wallets = userIds.length > 0
      ? await Wallets.find({ user: { $in: userIds } }).lean()
      : [];

    return apps.map((app: any) => {
      const uid = String(app.user?._id || app.user || '');
      const matchedWallet = wallets.find(
        (w: any) =>
          (w.applicationId && String(w.applicationId) === String(app._id)) ||
          (app.walletId && String(w._id) === String(app.walletId)) ||
          (String(w.user) === uid && w.walletType === app.type && w.status !== 'closed'),
      );
      const userWallets = wallets
        .filter((w: any) => String(w.user) === uid)
        .map((w: any) => ({
          id: w._id,
          walletNumber: w.walletNumber,
          walletType: w.walletType,
          status: w.status,
          isPrimary: w.isPrimary,
          nickname: w.nickname || w.notes,
          balances: w.balances instanceof Map ? Object.fromEntries(w.balances) : w.balances,
        }));

      return {
        ...app,
        id: app._id,
        walletId: app.walletId || matchedWallet?._id,
        walletNumber: app.walletNumber || matchedWallet?.walletNumber,
        userWallets,
      };
    });
  }

  /**
   * Approve an account application
   */
  static async approveApplication(
    currentUserId: string,
    applicationId: string,
    ip: string,
    userAgent: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { AccountApplications } = await import('../accounts/accounts.model.js');

      const application = await AccountApplications.findById(applicationId).session(session);
      if (!application) throw new NotFoundError('Application not found');
      if (application.status !== 'pending')
        throw new ValidationError('Application is already processed');

      // Create the wallet for the approved application
      const walletType = application.type; // savings, current, fixed_deposit
      const currency = application.currency || 'USD';

      // Guard: check if a wallet was already created specifically for this application
      const existingWallet = await Wallets.findOne({
        applicationId: application._id,
        status: { $ne: 'closed' },
      }).session(session);

      if (existingWallet) {
        application.status = 'approved';
        application.reviewedAt = new Date();
        application.reviewedBy = currentUserId;
        application.walletId = String(existingWallet._id);
        application.walletNumber = existingWallet.walletNumber;
        await application.save({ session });
        await session.commitTransaction();
        await cacheDelete(`${CACHE_KEYS.USER_WALLETS}${application.user}`);
        return { success: true, application, wallet: existingWallet, alreadyExisted: true };
      }

      const defaultInterestRate =
        application.interestRate ||
        (walletType === 'savings' ? 2.75 : walletType === 'fixed_deposit' ? 5.25 : undefined);

      let calculatedMaturityDate = application.maturityDate || undefined;
      if (!calculatedMaturityDate && walletType === 'fixed_deposit' && application.termMonths) {
        const d = new Date();
        d.setMonth(d.getMonth() + Number(application.termMonths));
        calculatedMaturityDate = d;
      }

      const wallet = new Wallets({
        user: application.user,
        walletNumber: `W${Date.now()}${Math.random().toString(36).substring(7)}`,
        balances: new Map([[currency, 0]]),
        status: 'active',
        walletType: walletType,
        isPrimary: false,
        applicationId: String(application._id),
        nickname: application.nickname || application.businessName || application.goal || undefined,
        notes: application.nickname || application.businessName || application.goal || `${walletType} account`,
        initialDeposit: application.initialDeposit || undefined,
        goal: application.goal || undefined,
        autoSave: application.autoSave || false,
        autoSaveAmount: application.autoSaveAmount || undefined,
        purpose: application.purpose || undefined,
        businessName: application.businessName || undefined,
        expectedMonthlyVolume: application.expectedMonthlyVolume || undefined,
        overdraftRequested: application.overdraftRequested || false,
        principal: application.principal || undefined,
        termMonths: application.termMonths || undefined,
        interestRate: defaultInterestRate,
        maturityDate: calculatedMaturityDate,
        autoRenew: application.autoRenew || false,
        overdraftLimit: application.overdraftRequested ? 5000 : 0,
      });
      await wallet.save({ session });

      application.status = 'approved';
      application.reviewedAt = new Date();
      application.reviewedBy = currentUserId;
      application.walletId = String(wallet._id);
      application.walletNumber = wallet.walletNumber;
      if (defaultInterestRate && !application.interestRate) {
        application.interestRate = defaultInterestRate;
      }
      if (calculatedMaturityDate && !application.maturityDate) {
        application.maturityDate = calculatedMaturityDate;
      }
      await application.save({ session });

      // Handle initial deposits if applicable
      const initialDeposit = application.initialDeposit || application.principal;
      if (initialDeposit && initialDeposit > 0) {
        // Attempt to deduct from primary wallet
        const primaryWallet = await Wallets.findOne({
          user: application.user,
          isPrimary: true,
          status: 'active',
        }).session(session);
        if (primaryWallet && getWalletBalance(primaryWallet, currency) >= initialDeposit) {
          updateWalletBalance(primaryWallet, currency, -initialDeposit);
          await primaryWallet.save({ session });

          updateWalletBalance(wallet, currency, initialDeposit);
          await wallet.save({ session });

          // Log the ledger entries
          await LedgerEntries.insertMany(
            [
              {
                wallet: primaryWallet._id,
                transaction: application._id,
                entryType: 'debit',
                amount: initialDeposit,
                currency,
                balance: getWalletBalance(primaryWallet, currency),
                description: `Initial deposit for ${walletType} account transfer`,
                accountingDate: new Date(),
              },
              {
                wallet: wallet._id,
                transaction: application._id,
                entryType: 'credit',
                amount: initialDeposit,
                currency,
                balance: getWalletBalance(wallet, currency),
                description: `Initial deposit from primary account`,
                accountingDate: new Date(),
              },
            ],
            { session },
          );
        } else {
          // Credit the new wallet with the requested initial deposit / principal
          updateWalletBalance(wallet, currency, initialDeposit);
          await wallet.save({ session });
        }
      }

      await logAdminAction(
        currentUserId,
        'APPROVE_ACCOUNT_APPLICATION',
        'application',
        applicationId,
        { type: walletType, userId: application.user },
        ip,
        userAgent,
        'success',
      );

      await session.commitTransaction();
      await cacheDelete(`${CACHE_KEYS.USER_WALLETS}${application.user}`);

      await notifyUser(
        String(application.user),
        'Account Approved',
        `Your ${walletType.replace('_', ' ')} account application has been approved. Account #${wallet.walletNumber}`,
        'account',
      );

      return { success: true, application, wallet };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reject an account application
   */
  static async rejectApplication(
    currentUserId: string,
    applicationId: string,
    reason: string,
    ip: string,
    userAgent: string,
  ) {
    if (!reason) throw new ValidationError('Rejection reason is required');

    const { AccountApplications } = await import('../accounts/accounts.model.js');

    const application = await AccountApplications.findById(applicationId);
    if (!application) throw new NotFoundError('Application not found');
    if (application.status !== 'pending')
      throw new ValidationError('Application is already processed');

    application.status = 'rejected';
    application.rejectionReason = reason;
    application.reviewedAt = new Date();
    application.reviewedBy = currentUserId;
    await application.save();
    await cacheDelete(`${CACHE_KEYS.USER_WALLETS}${application.user}`);

    await logAdminAction(
      currentUserId,
      'REJECT_ACCOUNT_APPLICATION',
      'application',
      applicationId,
      { type: application.type, userId: application.user, reason },
      ip,
      userAgent,
      'success',
    );

    await notifyUser(
      String(application.user),
      'Account Rejected',
      `Your ${application.type} account application has been rejected. Reason: ${reason}`,
      'account',
    );

    return { success: true, application };
  }
}
