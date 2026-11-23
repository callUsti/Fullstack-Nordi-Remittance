import mongoose from "mongoose";
import type { TransactionData } from "../../types/Mail.types.js";
import Transactions from "./transactions.model.js";
import { Wallets, LedgerEntries } from "../accounts/accounts.model.js";
import Users from "../users/users.model.js";
import { SystemSettings } from "../admin/admin.model.js";
import { TransferVerifications } from "../transfer-verification/transfer-verification.model.js";
import { Notifications } from "../notifications/notifications.model.js";
import {
  generateReferenceNumber,
  generateUUID,
} from "../../core/helpers/generator.js";
import {
  ValidationError,
  NotFoundError,
  InsufficientBalanceError,
} from "../../core/errors/AppError.js";
import { validateUserEligibility } from "../../core/guards/user-eligibility.guard.js";
import { queueTemplatedMail } from "../../services/workers.js";
import EmailContentGenerator from "../../core/mail/Mail-content.js";
import { emitToUser } from "../../services/websocket.service.js";
import {
  cacheTransaction,
  invalidateTransactionCache,
  cacheUserWallets,
  incrementUnreadCount,
} from "../../services/redis.service.js";
import { onTransactionWrite } from "../../services/query-cache.service.js";
import { getKafkaService, KafkaTopics } from "../../services/kafka.service.js";
import { WS_EVENTS, getWalletBalance, updateWalletBalance } from "./transactions.helpers.js";

const emailGenerator = new EmailContentGenerator();

export class TransactionsTransferService {
  static async internalTransfer(userId: string, body: any, ip: string, userAgent: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await validateUserEligibility(userId, "transfer");

      const {
        sourceAccountId,
        fromWalletId,
        destinationAccountId,
        toWalletId,
        recipientAccountNumber,
        toAccountNumber,
        recipientEmail,
        toAccountName,
        accountName,
        toBankName,
        bankName,
        routingNumber,
        transferType,
        transferDate,
        saveBeneficiary,
        fee: submittedFee,
        amount,
        currency,
        description,
      } = body;

      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        throw new ValidationError("Invalid transfer amount");
      }

      const sender: any = await Users.findById(userId).session(session);
      if (!sender) throw new NotFoundError("Sender not found");

      const requestedWalletId = sourceAccountId || fromWalletId;
      const senderWallet: any = requestedWalletId
        ? await Wallets.findOne({
            _id: requestedWalletId,
            user: String(sender._id),
            status: "active",
          }).session(session)
        : await Wallets.findOne({
            user: String(sender._id),
            status: "active",
          })
            .sort({ isPrimary: -1 })
            .session(session);

      if (!senderWallet) throw new NotFoundError("Sender wallet not found");

      const transferCurrency = (currency || "USD").toUpperCase();
      const senderBalance = getWalletBalance(senderWallet, transferCurrency);

      const fee =
        submittedFee !== undefined && submittedFee !== null && submittedFee !== "" && !Number.isNaN(Number(submittedFee))
          ? Math.max(0, Math.round(Number(submittedFee) * 100) / 100)
          : toAccountNumber && !recipientEmail
            ? 0
            : Math.round(Math.max(parsedAmount * 0.005, 0.5) * 100) / 100;

      if (senderBalance < parsedAmount + fee) {
        throw new InsufficientBalanceError(parsedAmount + fee, senderBalance);
      }

      const targetAcctNo = recipientAccountNumber || toAccountNumber;
      const targetWalletId = destinationAccountId || toWalletId;

      let recipient: any = null;
      let recipientWallet: any = null;

      if (targetWalletId && mongoose.Types.ObjectId.isValid(String(targetWalletId))) {
        recipientWallet = await Wallets.findOne({ _id: targetWalletId, status: "active" }).session(session);
        if (recipientWallet) {
          recipient = await Users.findById(recipientWallet.user).session(session);
        }
      }

      if (!recipient && (targetAcctNo || recipientEmail)) {
        const recipientQuery: Record<string, any> = {};
        if (targetAcctNo) {
          recipientQuery.accountNumber = targetAcctNo;
        } else if (recipientEmail) {
          recipientQuery.email = String(recipientEmail).toLowerCase();
        }
        recipient = await Users.findOne(recipientQuery).session(session);
      }

      // External domestic bank transfer (Standard / Same-Day / Wire) when recipient is outside Nordi
      if (!recipient && targetAcctNo) {
        const extName = toAccountName || accountName || "External Recipient";
        const extBank = toBankName || bankName || "External Bank";
        const reference = generateReferenceNumber();

        const transaction = new Transactions({
          wallet: senderWallet._id,
          referenceNumber: reference,
          type: "transfer",
          category: "bankAccounts",
          initiatedBy: sender._id,
          recipientAccountNumber: String(targetAcctNo),
          recipientBankName: extBank,
          recipientName: extName,
          routingNumber,
          transferType: transferType || "standard",
          sourceWalletType: senderWallet.walletType,
          scheduledFor: transferDate ? new Date(transferDate) : undefined,
          amount: parsedAmount,
          currency: transferCurrency,
          fee,
          feeCurrency: transferCurrency,
          status: transferType === "wire" ? "processing" : "completed",
          completedAt: transferType === "wire" ? undefined : new Date(),
          description: description || `Domestic transfer to ${extName} (${extBank})`,
          channel: "web",
          ipAddress: ip,
          userAgent,
          meta: {
            senderName: `${sender.firstName} ${sender.lastName}`,
            senderAccountNumber: sender.accountNumber,
            recipientName: extName,
            recipientAccountNumber: String(targetAcctNo),
            bankName: extBank,
            routingNumber,
            transferType: transferType || "standard",
            transferDate,
            isExternal: true,
          },
        });

        await transaction.save({ session });

        if (saveBeneficiary) {
          const existingList = Array.isArray(sender.beneficiaries) ? sender.beneficiaries : [];
          const alreadyExists = existingList.some(
            (b: any) => String(b.accountNumber || "") === String(targetAcctNo),
          );
          if (!alreadyExists) {
            existingList.push({
              id: generateUUID(),
              name: extName,
              accountNumber: String(targetAcctNo),
              bankName: extBank,
              routingNumber,
              currency: transferCurrency,
              type: "external",
              createdAt: new Date(),
            });
            sender.beneficiaries = existingList;
            await sender.save({ session });
          }
        }

        await transaction.save({ session });

        updateWalletBalance(senderWallet, transferCurrency, -(parsedAmount + fee));
        senderWallet.updatedAt = new Date();
        senderWallet.lastTransactionAt = new Date();
        await senderWallet.save({ session });
        const senderBalanceAfter = getWalletBalance(senderWallet, transferCurrency);

        await LedgerEntries.create(
          [
            {
              wallet: senderWallet._id,
              transaction: transaction._id,
              entryType: "debit",
              amount: parsedAmount + fee,
              currency: transferCurrency,
              balance: senderBalanceAfter,
              description: `Domestic transfer to ${extName} (${extBank})`,
              accountingDate: new Date(),
            },
          ],
          { session },
        );

        await session.commitTransaction();

        await Promise.all([
          invalidateTransactionCache(sender._id.toString()),
          cacheUserWallets(sender._id.toString(), [senderWallet]),
        ]);

        onTransactionWrite(sender._id.toString()).catch(() => {});

        return {
          transaction: {
            id: transaction._id,
            referenceNumber: transaction.referenceNumber,
            amount: transaction.amount,
            fee: transaction.fee,
            currency: transaction.currency,
            status: transaction.status,
            recipientName: extName,
            createdAt: transaction.createdAt,
          },
          referenceNumber: transaction.referenceNumber,
          newBalance: senderBalanceAfter,
        };
      }

      if (!recipient) throw new NotFoundError("Recipient not found");

      await validateUserEligibility(String(recipient._id), "receive transfer");

      if (recipient._id.toString() === sender._id.toString() && (!recipientWallet || String(recipientWallet._id) === String(senderWallet._id))) {
        throw new ValidationError("Cannot transfer to the same wallet");
      }

      if (!recipientWallet) {
        recipientWallet = await Wallets.findOne({
          user: String(recipient._id),
          status: "active",
        }).session(session);
      }

      if (!recipientWallet) {
        recipientWallet = new Wallets({
          user: String(recipient._id),
          walletNumber: `W${Date.now()}${Math.random().toString(36).substring(7)}`,
          balances: new Map([[transferCurrency, 0]]),
          status: "active",
          walletType: "personal",
          isPrimary: false,
        });
        await recipientWallet.save({ session });
      }

      const reference = generateReferenceNumber();

      const transaction = new Transactions({
        wallet: senderWallet._id,
        referenceNumber: reference,
        type: "transfer",
        category: "bankAccounts",
        initiatedBy: sender._id,
        recipientWallet: recipientWallet._id,
        recipientAccountNumber: recipient.accountNumber,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        amount,
        currency: transferCurrency,
        fee,
        status: "pending",
        description: description || `Transfer to ${recipient.firstName} ${recipient.lastName}`,
        channel: "web",
        ipAddress: ip,
        userAgent,
        meta: {
          senderName: `${sender.firstName} ${sender.lastName}`,
          senderAccountNumber: sender.accountNumber,
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          recipientAccountNumber: recipient.accountNumber,
        },
      });

      await transaction.save({ session });

      const kafkaService = await getKafkaService();
      await kafkaService.publish(KafkaTopics.TRANSACTION_INITIATED, {
        transactionId: transaction._id.toString(),
        reference: transaction.referenceNumber,
        userId: sender._id.toString(),
        recipientId: recipient._id.toString(),
        amount: transaction.amount,
        currency: transaction.currency,
        type: "transfer",
        timestamp: new Date().toISOString(),
      });

      updateWalletBalance(senderWallet, transferCurrency, -(amount + fee));
      senderWallet.updatedAt = new Date();
      senderWallet.lastTransactionAt = new Date();
      await senderWallet.save({ session });
      const senderBalanceAfter = getWalletBalance(senderWallet, transferCurrency);

      await LedgerEntries.create(
        [{
          wallet: senderWallet._id,
          transaction: transaction._id,
          entryType: "debit",
          amount: amount + fee,
          currency: transferCurrency,
          balance: senderBalanceAfter,
          description: `Transfer to ${recipient.accountNumber}`,
          accountingDate: new Date(),
        }],
        { session }
      );

      updateWalletBalance(recipientWallet, transferCurrency, amount);
      recipientWallet.updatedAt = new Date();
      recipientWallet.lastTransactionAt = new Date();
      await recipientWallet.save({ session });
      const recipientBalanceAfter = getWalletBalance(recipientWallet, transferCurrency);

      await LedgerEntries.create(
        [{
          wallet: recipientWallet._id,
          transaction: transaction._id,
          entryType: "credit",
          amount,
          currency: transferCurrency,
          balance: recipientBalanceAfter,
          description: `Transfer from ${sender.accountNumber}`,
          accountingDate: new Date(),
        }],
        { session }
      );

      transaction.status = "completed";
      transaction.completedAt = new Date();
      await transaction.save({ session });

      await session.commitTransaction();

      await Promise.all([
        invalidateTransactionCache(sender._id.toString()),
        invalidateTransactionCache(recipient._id.toString()),
        cacheUserWallets(sender._id.toString(), [senderWallet]),
        cacheUserWallets(recipient._id.toString(), [recipientWallet]),
        cacheTransaction(transaction._id.toString(), {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          type: transaction.type,
          amount: transaction.amount,
          fee: transaction.fee,
          currency: transaction.currency,
          status: transaction.status,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt,
        }),
      ]);

      Promise.all([
        (async () => {
          const senderEmailData: TransactionData = {
            userName: `${sender.firstName} ${sender.lastName}`,
            type: "transfer",
            amount: String(amount),
            currency: transferCurrency,
            referenceNumber: reference,
            status: "completed",
            transactionId: transaction._id.toString(),
            newBalance: String(senderBalanceAfter),
            accountNumber: String(sender.accountNumber || ""),
            createdAt: new Date().toISOString(),
          };
          const senderEmailContent = emailGenerator.transactionNotification(senderEmailData);
          await queueTemplatedMail(String(sender.email), senderEmailContent);
        })(),
        (async () => {
          const recipientEmailData: TransactionData = {
            userName: `${recipient.firstName} ${recipient.lastName}`,
            type: "transfer",
            amount: String(amount),
            currency: transferCurrency,
            referenceNumber: reference,
            status: "completed",
            transactionId: transaction._id.toString(),
            newBalance: String(recipientBalanceAfter),
            accountNumber: String(recipient.accountNumber || ""),
            createdAt: new Date().toISOString(),
          };
          const recipientEmailContent = emailGenerator.transactionNotification(recipientEmailData);
          await queueTemplatedMail(String(recipient.email), recipientEmailContent);
        })(),
        Notifications.insertMany([
          {
            userId: sender._id,
            type: "transaction",
            title: "Transfer Successful",
            message: `Your transfer of ${amount} ${transferCurrency} to ${recipient.firstName} was successful.`,
            data: { transactionId: transaction._id, reference },
            read: false,
            createdAt: new Date(),
          },
          {
            userId: recipient._id,
            type: "transaction",
            title: "Money Received",
            message: `You received ${amount} ${transferCurrency} from ${sender.firstName}.`,
            data: { transactionId: transaction._id, reference },
            read: false,
            createdAt: new Date(),
          },
        ]),
        incrementUnreadCount(sender._id.toString()),
        incrementUnreadCount(recipient._id.toString()),
        emitToUser(sender._id.toString(), WS_EVENTS.MONEY_SENT, {
          type: "debit",
          transactionId: transaction._id.toString(),
          amount,
          currency: transferCurrency,
          reference,
          recipient: `${recipient.firstName} ${recipient.lastName}`,
          newBalance: senderBalanceAfter,
          timestamp: new Date().toISOString(),
        }),
        emitToUser(sender._id.toString(), WS_EVENTS.BALANCE_UPDATED, {
          currency: transferCurrency,
          balance: senderBalanceAfter,
          timestamp: new Date().toISOString(),
        }),
        emitToUser(recipient._id.toString(), WS_EVENTS.MONEY_RECEIVED, {
          type: "credit",
          transactionId: transaction._id.toString(),
          amount,
          currency: transferCurrency,
          reference,
          sender: `${sender.firstName} ${sender.lastName}`,
          newBalance: recipientBalanceAfter,
          timestamp: new Date().toISOString(),
        }),
        emitToUser(recipient._id.toString(), WS_EVENTS.BALANCE_UPDATED, {
          currency: transferCurrency,
          balance: recipientBalanceAfter,
          timestamp: new Date().toISOString(),
        }),
      ]).catch((err) => console.error("Notification error:", err));

      onTransactionWrite(userId).catch(() => {});

      await kafkaService.publish(KafkaTopics.TRANSACTION_COMPLETED, {
        transactionId: transaction._id.toString(),
        reference: transaction.referenceNumber,
        status: "completed",
        timestamp: new Date().toISOString(),
      });

      return {
        transaction: {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          type: transaction.type,
          amount: transaction.amount,
          fee: transaction.fee,
          currency: transaction.currency,
          status: transaction.status,
          recipient: {
            name: `${recipient.firstName} ${recipient.lastName}`,
            accountNumber: recipient.accountNumber,
          },
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt,
        },
        newBalance: senderBalanceAfter,
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async deposit(userId: string, body: any, ip: string, userAgent: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await validateUserEligibility(userId, "deposit");

      const { amount, currency, paymentMethod, paymentReference } = body;

      if (!amount || amount <= 0) {
        throw new ValidationError("Invalid deposit amount");
      }

      const user: any = await Users.findById(userId).session(session);
      if (!user) throw new NotFoundError("User not found");

      const depositCurrency = currency || "USD";
      let wallet: any = await Wallets.findOne({
        user: String(user._id),
        status: "active",
      }).session(session);

      if (!wallet) {
        wallet = new Wallets({
          user: String(user._id),
          walletNumber: `W${Date.now()}${Math.random().toString(36).substring(7)}`,
          balances: new Map([[depositCurrency, 0]]),
          status: "active",
          walletType: "personal",
          isPrimary: true,
        });
        await wallet.save({ session });
      }

      const reference = generateReferenceNumber();

      const transaction = new Transactions({
        wallet: wallet._id,
        referenceNumber: reference,
        type: "deposit",
        category: "bankAccounts",
        initiatedBy: user._id,
        amount,
        currency: depositCurrency,
        fee: 0,
        status: "completed",
        description: `Deposit via ${paymentMethod || "bank transfer"}`,
        channel: "web",
        ipAddress: ip,
        meta: { paymentMethod, paymentReference },
        completedAt: new Date(),
      });

      await transaction.save({ session });

      const kafkaService = await getKafkaService();
      await kafkaService.publish(KafkaTopics.TRANSACTION_COMPLETED, {
        transactionId: transaction._id.toString(),
        reference: transaction.referenceNumber,
        userId: user._id.toString(),
        amount: transaction.amount,
        currency: transaction.currency,
        type: "deposit",
        status: "completed",
        timestamp: new Date().toISOString(),
      });

      updateWalletBalance(wallet, depositCurrency, amount);
      wallet.updatedAt = new Date();
      wallet.lastTransactionAt = new Date();
      await wallet.save({ session });
      const balanceAfter = getWalletBalance(wallet, depositCurrency);

      await LedgerEntries.create(
        [{
          wallet: wallet._id,
          transaction: transaction._id,
          entryType: "credit",
          amount,
          currency: depositCurrency,
          balance: balanceAfter,
          description: "Deposit",
          accountingDate: new Date(),
        }],
        { session }
      );

      await session.commitTransaction();

      await Promise.all([
        invalidateTransactionCache(user._id.toString()),
        cacheUserWallets(user._id.toString(), [wallet]),
        cacheTransaction(transaction._id.toString(), {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          type: transaction.type,
          amount: transaction.amount,
          currency: depositCurrency,
          status: transaction.status,
          createdAt: transaction.createdAt,
        }),
      ]);

      Promise.all([
        (async () => {
          const depositEmailData: TransactionData = {
            userName: `${user.firstName} ${user.lastName}`,
            type: "deposit",
            amount: String(amount),
            currency: depositCurrency,
            referenceNumber: reference,
            status: "completed",
            transactionId: transaction._id.toString(),
            newBalance: String(balanceAfter),
            accountNumber: String(user.accountNumber || ""),
            createdAt: new Date().toISOString(),
          };
          const depositEmailContent = emailGenerator.transactionNotification(depositEmailData);
          await queueTemplatedMail(String(user.email), depositEmailContent);
        })(),
        Notifications.create({
          userId: user._id,
          type: "transaction",
          title: "Deposit Successful",
          message: `Your deposit of ${amount} ${depositCurrency} was successful.`,
          data: { transactionId: transaction._id, reference },
          read: false,
          createdAt: new Date(),
        }),
        incrementUnreadCount(user._id.toString()),
        emitToUser(user._id.toString(), WS_EVENTS.DEPOSIT_COMPLETED, {
          transactionId: transaction._id.toString(),
          amount,
          currency: depositCurrency,
          reference,
          newBalance: balanceAfter,
          timestamp: new Date().toISOString(),
        }),
        emitToUser(user._id.toString(), WS_EVENTS.BALANCE_UPDATED, {
          currency: depositCurrency,
          balance: balanceAfter,
          timestamp: new Date().toISOString(),
        }),
      ]).catch((err) => console.error("Notification error:", err));

      onTransactionWrite(userId).catch(() => {});

      return {
        transaction: {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
        newBalance: balanceAfter,
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async withdraw(userId: string, body: any, ip: string, userAgent: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await validateUserEligibility(userId, "withdrawal");

      const {
        amount,
        currency,
        withdrawalMethod,
        bankAccount,
        bankName,
        accountName,
        routingNumber,
      } = body;

      if (!amount || amount <= 0) {
        throw new ValidationError("Invalid withdrawal amount");
      }

      const user: any = await Users.findById(userId).session(session);
      if (!user) throw new NotFoundError("User not found");

      const withdrawCurrency = currency || "USD";
      const wallet: any = await Wallets.findOne({
        user: String(user._id),
        status: "active",
      }).session(session);

      if (!wallet) throw new NotFoundError("Wallet not found");

      const fee = Math.max(amount * 0.01, 1.0);
      const walletBalance = getWalletBalance(wallet, withdrawCurrency);

      if (walletBalance < amount + fee) {
        throw new InsufficientBalanceError(amount + fee, walletBalance);
      }

      const reference = generateReferenceNumber();

      const transaction = new Transactions({
        wallet: wallet._id,
        referenceNumber: reference,
        type: "withdrawal",
        category: "bankAccounts",
        initiatedBy: user._id,
        recipientAccountNumber: bankAccount ? `****${bankAccount.slice(-4)}` : undefined,
        recipientBankName: bankName,
        recipientName: accountName,
        amount,
        currency: withdrawCurrency,
        fee,
        status: "pending",
        description: `Withdrawal to ${bankName || "bank account"}`,
        channel: "web",
        ipAddress: ip,
        meta: {
          withdrawalMethod,
          routingNumber: routingNumber ? `****${routingNumber.slice(-4)}` : null,
        },
      });

      await transaction.save({ session });

      const kafkaService = await getKafkaService();
      await kafkaService.publish(KafkaTopics.TRANSACTION_INITIATED, {
        transactionId: transaction._id.toString(),
        reference: transaction.referenceNumber,
        userId: user._id.toString(),
        amount: transaction.amount,
        currency: transaction.currency,
        type: "withdrawal",
        timestamp: new Date().toISOString(),
      });

      updateWalletBalance(wallet, withdrawCurrency, -(amount + fee));
      wallet.updatedAt = new Date();
      wallet.lastTransactionAt = new Date();
      await wallet.save({ session });
      const balanceAfter = getWalletBalance(wallet, withdrawCurrency);

      await LedgerEntries.create(
        [{
          wallet: wallet._id,
          transaction: transaction._id,
          entryType: "debit",
          amount: amount + fee,
          currency: withdrawCurrency,
          balance: balanceAfter,
          description: "Withdrawal (pending)",
          accountingDate: new Date(),
        }],
        { session }
      );

      await session.commitTransaction();

      await Promise.all([
        invalidateTransactionCache(user._id.toString()),
        cacheUserWallets(user._id.toString(), [wallet]),
        cacheTransaction(transaction._id.toString(), {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          type: transaction.type,
          amount: transaction.amount,
          fee: transaction.fee,
          currency: withdrawCurrency,
          status: transaction.status,
          createdAt: transaction.createdAt,
        }),
      ]);

      Promise.all([
        (async () => {
          const withdrawalEmailData: TransactionData = {
            userName: `${user.firstName} ${user.lastName}`,
            type: "withdrawal",
            amount: String(amount),
            currency: withdrawCurrency,
            referenceNumber: reference,
            status: "pending",
            transactionId: transaction._id.toString(),
            newBalance: String(balanceAfter),
            accountNumber: String(user.accountNumber || ""),
            createdAt: new Date().toISOString(),
          };
          const withdrawalEmailContent = emailGenerator.transactionNotification(withdrawalEmailData);
          await queueTemplatedMail(String(user.email), withdrawalEmailContent);
        })(),
        Notifications.create({
          userId: user._id,
          type: "transaction",
          title: "Withdrawal Pending",
          message: `Your withdrawal of ${amount} ${withdrawCurrency} is being processed.`,
          data: { transactionId: transaction._id, reference },
          read: false,
          createdAt: new Date(),
        }),
        incrementUnreadCount(user._id.toString()),
        emitToUser(user._id.toString(), WS_EVENTS.WITHDRAWAL_INITIATED, {
          transactionId: transaction._id.toString(),
          amount,
          fee,
          currency: withdrawCurrency,
          reference,
          newBalance: balanceAfter,
          estimatedCompletion: "1-3 business days",
          timestamp: new Date().toISOString(),
        }),
        emitToUser(user._id.toString(), WS_EVENTS.BALANCE_UPDATED, {
          currency: withdrawCurrency,
          balance: balanceAfter,
          timestamp: new Date().toISOString(),
        }),
      ]).catch((err) => console.error("Notification error:", err));

      onTransactionWrite(userId).catch(() => {});

      return {
        transaction: {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          type: transaction.type,
          amount: transaction.amount,
          fee: transaction.fee,
          currency: transaction.currency,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
        newBalance: balanceAfter,
        message: "Withdrawal request submitted. Processing typically takes 1-3 business days.",
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async cancelTransaction(userId: string, transactionId: string, reason: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transactions.findOne({
        _id: transactionId,
        initiatedBy: userId,
        status: "pending",
      }).session(session);

      if (!transaction) {
        throw new NotFoundError("Pending transaction not found");
      }

      const wallet = await Wallets.findById(transaction.wallet).session(session);
      const refundAmount = transaction.amount + (transaction.fee || 0);
      let newBalance = 0;

      if (wallet) {
        updateWalletBalance(wallet, transaction.currency, refundAmount);
        wallet.updatedAt = new Date();
        await wallet.save({ session });
        newBalance = getWalletBalance(wallet, transaction.currency);

        await LedgerEntries.create(
          [{
            wallet: wallet._id,
            transaction: transaction._id,
            entryType: "credit",
            amount: refundAmount,
            currency: transaction.currency,
            balance: newBalance,
            description: "Transaction cancelled - refund",
            accountingDate: new Date(),
          }],
          { session }
        );
      }

      transaction.status = "cancelled";
      transaction.updatedAt = new Date();
      transaction.meta = {
        ...(transaction.meta || {}),
        cancelledAt: new Date(),
        cancellationReason: reason,
      };
      await transaction.save({ session });

      await session.commitTransaction();

      await Promise.all([
        invalidateTransactionCache(userId.toString()),
        cacheTransaction(transaction._id.toString(), {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          type: transaction.type,
          amount: transaction.amount,
          status: "cancelled",
          cancelledAt: new Date(),
        }),
      ]);

      emitToUser(userId.toString(), WS_EVENTS.TRANSACTION_CANCELLED, {
        transactionId: transaction._id.toString(),
        referenceNumber: transaction.referenceNumber,
        refundedAmount: refundAmount,
        newBalance,
        currency: transaction.currency,
        reason,
        timestamp: new Date().toISOString(),
      });

      if (wallet) {
        emitToUser(userId.toString(), WS_EVENTS.BALANCE_UPDATED, {
          currency: transaction.currency,
          balance: newBalance,
          timestamp: new Date().toISOString(),
        });
      }

      onTransactionWrite(userId.toString()).catch(() => {});

      return {
        transaction: {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          status: transaction.status,
        },
        refundedAmount: refundAmount,
        newBalance,
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ==========================================================================
  // INTERNATIONAL REMITTANCE & RECIPIENTS
  // ==========================================================================

  static getRemittanceCountries() {
    return [
      { code: "GB", name: "United Kingdom", currency: "GBP", supportedMethods: ["bank_transfer"] },
      { code: "DE", name: "Germany", currency: "EUR", supportedMethods: ["bank_transfer"] },
      { code: "FR", name: "France", currency: "EUR", supportedMethods: ["bank_transfer"] },
      { code: "US", name: "United States", currency: "USD", supportedMethods: ["bank_transfer"] },
      { code: "CA", name: "Canada", currency: "CAD", supportedMethods: ["bank_transfer"] },
      { code: "AU", name: "Australia", currency: "AUD", supportedMethods: ["bank_transfer"] },
      { code: "JP", name: "Japan", currency: "JPY", supportedMethods: ["bank_transfer"] },
      { code: "CH", name: "Switzerland", currency: "CHF", supportedMethods: ["bank_transfer"] },
      { code: "SG", name: "Singapore", currency: "SGD", supportedMethods: ["bank_transfer"] },
      { code: "IN", name: "India", currency: "INR", supportedMethods: ["bank_transfer", "mobile_money"] },
      { code: "NG", name: "Nigeria", currency: "NGN", supportedMethods: ["bank_transfer", "mobile_money", "cash_pickup"] },
      { code: "KE", name: "Kenya", currency: "KES", supportedMethods: ["bank_transfer", "mobile_money", "cash_pickup"] },
      { code: "PH", name: "Philippines", currency: "PHP", supportedMethods: ["bank_transfer", "cash_pickup"] },
      { code: "MX", name: "Mexico", currency: "MXN", supportedMethods: ["bank_transfer", "cash_pickup"] },
    ];
  }

  static getRemittanceQuote(body: {
    amount: number;
    sourceCurrency?: string;
    destinationCurrency?: string;
    deliveryMethod?: string;
  }) {
    const FX_USD: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
      AUD: 1.53,
      CHF: 0.88,
      JPY: 151.5,
      CNY: 7.24,
      INR: 83.4,
      SGD: 1.34,
      NGN: 1580,
      KES: 129,
      PHP: 56.8,
      MXN: 17.1,
    };

    const sendAmount = Number(body.amount) || 0;
    const src = (body.sourceCurrency || "USD").toUpperCase();
    const dst = (body.destinationCurrency || "EUR").toUpperCase();
    const srcUsd = FX_USD[src] || 1;
    const dstUsd = FX_USD[dst] || 1;
    const exchangeRate = Number((dstUsd / srcUsd).toFixed(4));

    const feeMap: Record<string, number> = {
      bank_transfer: 15,
      mobile_money: 10,
      cash_pickup: 20,
    };
    const etaMap: Record<string, string> = {
      bank_transfer: "2-5 business days",
      mobile_money: "1-2 business days",
      cash_pickup: "Same day",
    };
    const method = body.deliveryMethod || "bank_transfer";
    const fee = feeMap[method] ?? 15;
    const receiveAmount = Number((sendAmount * exchangeRate).toFixed(2));

    return {
      sendAmount,
      receiveAmount,
      exchangeRate,
      rate: exchangeRate,
      fee,
      totalCost: sendAmount + fee,
      estimatedDelivery: etaMap[method] || "2-5 business days",
    };
  }

  static async getRecipients(userId: string) {
    const user: any = await Users.findById(userId).select("beneficiaries").lean();
    if (!user) throw new NotFoundError("User not found");
    const list = Array.isArray(user.beneficiaries)
      ? user.beneficiaries
          .filter((b: any) => !b.type || b.type === "international" || b.country || b.swiftCode)
          .map((b: any) => ({
            ...b,
            id: String(b.id || b._id || ""),
          }))
      : [];
    return { recipients: list };
  }

  static async createRecipient(userId: string, body: any) {
    const user: any = await Users.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const id = generateUUID();
    const firstName = body.firstName || body.name?.split(" ")[0] || "Recipient";
    const lastName = body.lastName || body.name?.split(" ").slice(1).join(" ") || "";
    const recipient = {
      id,
      type: "international",
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      country: body.country || "GB",
      currency: body.currency || "EUR",
      deliveryMethod: body.deliveryMethod || "bank_transfer",
      bankName: body.bankDetails?.bankName || body.bankName,
      accountNumber: body.bankDetails?.accountNumber || body.accountNumber,
      swiftCode: body.bankDetails?.swiftCode || body.swiftCode,
      bankDetails: body.bankDetails,
      createdAt: new Date(),
    };

    user.beneficiaries = Array.isArray(user.beneficiaries) ? user.beneficiaries : [];
    user.beneficiaries.push(recipient);
    await user.save();
    return { recipient, id };
  }

  static async getTransferVerificationSetting() {
    const doc: any = await SystemSettings.findOne({ key: "require_international_codes" }).lean();
    return { requireInternationalCodes: Boolean(doc?.value) };
  }

  static async setTransferVerificationSetting(enabled: boolean, adminId: string) {
    const doc = await SystemSettings.findOneAndUpdate(
      { key: "require_international_codes" },
      {
        $set: {
          key: "require_international_codes",
          value: Boolean(enabled),
          category: "security",
          description: "Require 3-step verification codes (ISIN, IMF BOP, LEI) for international transfers",
          updatedBy: adminId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    ).lean();
    return { requireInternationalCodes: Boolean((doc as any)?.value) };
  }

  static async sendRemittance(userId: string, body: any, ip: string, userAgent: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await validateUserEligibility(userId, "transfer");

      const {
        sourceAccountId,
        fromWalletId,
        recipientId,
        recipientDetails,
        saveRecipient,
        amount,
        fee: submittedFee,
        sourceCurrency,
        destinationCurrency,
        deliveryMethod,
        purpose,
        reference,
        agreeTos,
        agreeCompliance,
      } = body;

      if (agreeTos !== true || agreeCompliance !== true) {
        throw new ValidationError(
          "You must agree to the international transfer terms and confirm sanctions & regulatory compliance"
        );
      }

      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        throw new ValidationError("Invalid remittance amount");
      }

      const sender: any = await Users.findById(userId).session(session);
      if (!sender) throw new NotFoundError("Sender not found");

      const walletId = sourceAccountId || fromWalletId;
      const senderWallet: any = walletId
        ? await Wallets.findOne({ _id: walletId, user: String(sender._id), status: "active" }).session(session)
        : await Wallets.findOne({ user: String(sender._id), status: "active" }).sort({ isPrimary: -1 }).session(session);

      if (!senderWallet) throw new NotFoundError("Sender wallet not found");

      const srcCurrency = (sourceCurrency || "USD").toUpperCase();
      const dstCurrency = (destinationCurrency || "EUR").toUpperCase();
      const quote = this.getRemittanceQuote({
        amount: parsedAmount,
        sourceCurrency: srcCurrency,
        destinationCurrency: dstCurrency,
        deliveryMethod,
      });

      const fee =
        submittedFee !== undefined && submittedFee !== null && submittedFee !== "" && !Number.isNaN(Number(submittedFee))
          ? Math.max(0, Math.round(Number(submittedFee) * 100) / 100)
          : quote.fee;
      const totalCost = Math.round((parsedAmount + fee) * 100) / 100;

      const senderBalance = getWalletBalance(senderWallet, srcCurrency);
      if (senderBalance < totalCost) {
        throw new InsufficientBalanceError(totalCost, senderBalance);
      }

      const savedRecipient = recipientId
        ? Array.isArray(sender.beneficiaries)
          ? sender.beneficiaries.find((b: any) => String(b.id || b._id) === String(recipientId))
          : null
        : null;

      const recipientName =
        savedRecipient?.name ||
        `${savedRecipient?.firstName || ""} ${savedRecipient?.lastName || ""}`.trim() ||
        recipientDetails?.recipientName ||
        "International Recipient";
      const recipientAcct =
        savedRecipient?.accountNumber ||
        savedRecipient?.bankDetails?.accountNumber ||
        recipientDetails?.recipientAccount ||
        "EXT-INTL";
      const recipientBank =
        savedRecipient?.bankName ||
        savedRecipient?.bankDetails?.bankName ||
        recipientDetails?.bankName ||
        "International Bank";
      const recipientSwift =
        savedRecipient?.swiftCode ||
        savedRecipient?.bankDetails?.swiftCode ||
        recipientDetails?.swiftCode;
      const recipientCountry = savedRecipient?.country || recipientDetails?.country;

      // Save recipient if requested and not already saved
      if (saveRecipient && recipientDetails && !savedRecipient) {
        const parts = String(recipientName).trim().split(" ");
        sender.beneficiaries = Array.isArray(sender.beneficiaries) ? sender.beneficiaries : [];
        sender.beneficiaries.push({
          id: generateUUID(),
          type: "international",
          firstName: parts[0] || recipientName,
          lastName: parts.slice(1).join(" "),
          name: recipientName,
          country: recipientCountry || "GB",
          currency: dstCurrency,
          deliveryMethod: deliveryMethod || "bank_transfer",
          bankName: recipientBank,
          accountNumber: recipientAcct,
          swiftCode: recipientSwift,
          bankDetails: {
            bankName: recipientBank,
            accountNumber: recipientAcct,
            swiftCode: recipientSwift,
          },
          createdAt: new Date(),
        });
        await sender.save({ session });
      }

      // Check admin toggle: require 3-step verification codes (ISIN, IMF BOP, LEI)
      const codeSetting: any = await SystemSettings.findOne({ key: "require_international_codes" }).lean();
      const requiresCodes = Boolean(codeSetting?.value);

      const referenceNumber = generateReferenceNumber();
      const transaction = new Transactions({
        wallet: senderWallet._id,
        referenceNumber,
        type: "transfer",
        category: "international",
        initiatedBy: sender._id,
        recipientAccountNumber: recipientAcct,
        recipientBankName: recipientBank,
        recipientName,
        transferType: "international",
        sourceWalletType: senderWallet.walletType,
        amount: parsedAmount,
        currency: srcCurrency,
        fee,
        feeCurrency: srcCurrency,
        status: requiresCodes ? "pending" : "processing",
        isInternational: true,
        description: reference || `International remittance (${purpose || "transfer"}) to ${recipientName}`,
        channel: "web",
        ipAddress: ip,
        userAgent,
        meta: {
          senderName: `${sender.firstName} ${sender.lastName}`,
          recipientName,
          recipientCountry,
          bankName: recipientBank,
          swiftCode: recipientSwift,
          destinationCurrency: dstCurrency,
          receiveAmount: quote.receiveAmount,
          exchangeRate: quote.exchangeRate,
          deliveryMethod: deliveryMethod || "bank_transfer",
          purpose,
          isInternational: true,
          agreeTos: true,
          agreeCompliance: true,
          complianceConfirmedAt: new Date().toISOString(),
        },
      });

      await transaction.save({ session });

      if (requiresCodes) {
        const verification = await TransferVerifications.create(
          [
            {
              user: String(sender._id),
              transaction: transaction._id,
              transactionDetails: {
                amount: parsedAmount,
                currency: srcCurrency,
                recipientId: String(recipientId || "external"),
                recipientName,
                recipientAccountNumber: recipientAcct,
                type: "transfer",
              },
              taxInfo: {
                taxRate: 0,
                taxAmount: fee,
                grossAmount: totalCost,
                netAmount: parsedAmount,
              },
              currentStep: 1,
              status: "pending_isin",
            },
          ],
          { session },
        );

        await session.commitTransaction();

        return {
          requiresVerification: true,
          verification: {
            id: verification[0]._id,
            verificationId: verification[0].verificationId,
            status: verification[0].status,
            currentStep: 1,
            totalSteps: 3,
            codeType: "isin",
            codeName: "ISIN Code",
          },
          transaction: {
            id: transaction._id,
            referenceNumber: transaction.referenceNumber,
            amount: transaction.amount,
            fee: transaction.fee,
            currency: transaction.currency,
            status: transaction.status,
          },
          referenceNumber: transaction.referenceNumber,
        };
      }

      updateWalletBalance(senderWallet, srcCurrency, -totalCost);
      senderWallet.updatedAt = new Date();
      senderWallet.lastTransactionAt = new Date();
      await senderWallet.save({ session });
      const senderBalanceAfter = getWalletBalance(senderWallet, srcCurrency);

      await LedgerEntries.create(
        [
          {
            wallet: senderWallet._id,
            transaction: transaction._id,
            entryType: "debit",
            amount: totalCost,
            currency: srcCurrency,
            balance: senderBalanceAfter,
            description: `International remittance to ${recipientName} (${dstCurrency})`,
            accountingDate: new Date(),
          },
        ],
        { session },
      );

      await session.commitTransaction();

      await Promise.all([
        invalidateTransactionCache(sender._id.toString()),
        cacheUserWallets(sender._id.toString(), [senderWallet]),
      ]);

      onTransactionWrite(sender._id.toString()).catch(() => {});

      return {
        requiresVerification: false,
        transaction: {
          id: transaction._id,
          referenceNumber: transaction.referenceNumber,
          amount: transaction.amount,
          fee: transaction.fee,
          currency: transaction.currency,
          status: transaction.status,
          receiveAmount: quote.receiveAmount,
          destinationCurrency: dstCurrency,
          exchangeRate: quote.exchangeRate,
          createdAt: transaction.createdAt,
        },
        referenceNumber: transaction.referenceNumber,
        newBalance: senderBalanceAfter,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
