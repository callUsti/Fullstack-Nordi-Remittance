// ============================================================================
// ACTIVITY SIMULATOR SERVICE
// Generates realistic, real-world banking, card, loan, investment, FX, and
// internal transfer activity ONLY for users explicitly enabled by an Admin.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Users from '../users/users.model.js';
import { Wallets, LedgerEntries } from '../accounts/accounts.model.js';
import { Cards, CardTransactions } from '../cards/cards.model.js';
import Loans from '../loans/loans.model.js';
import { InvestmentAccounts } from '../investments/investments.model.js';
import Transactions from '../transactions/transactions.model.js';
import ActivitySimulatorConfigs, { IActivitySimulatorConfig } from './activity-simulator.model.js';
import { generateReferenceNumber } from '../../core/helpers/generator.js';
import { getWalletBalance, updateWalletBalance, logAdminAction } from './ops.helpers.js';
import { cacheDelete, CACHE_KEYS } from '../../services/redis.service.js';
import { createLogger } from '../../logs/logger.js';

const log = createLogger('ActivitySimulator');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON datasets once at module load
const DATA_DIR = path.resolve(__dirname, '../../core/data/simulation');
const counterpartiesData: {
  banks: any[];
  businesses: any[];
  individuals: any[];
  merchants: any[];
} = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'senders-counterparties.json'), 'utf8'),
);
const descriptionsData: Record<string, any> = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'transaction-descriptions.json'), 'utf8'),
);

// Approximate FX rates relative to 1 USD (used for realistic multi-currency scaling & conversions)
const FX_RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.38,
  AUD: 1.53,
  CHF: 0.88,
  SEK: 10.6,
  NOK: 10.8,
  DKK: 6.86,
  NGN: 1580,
  KES: 129,
  GHS: 15.8,
  ZAR: 18.2,
};

type Cadence = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function convertFromUsd(usdAmount: number, targetCurrency: string): number {
  const rate = FX_RATES_FROM_USD[targetCurrency] || 1;
  return Number((usdAmount * rate).toFixed(2));
}

function getFxRate(fromCurr: string, toCurr: string): number {
  const fromRate = FX_RATES_FROM_USD[fromCurr] || 1;
  const toRate = FX_RATES_FROM_USD[toCurr] || 1;
  return Number((toRate / fromRate).toFixed(4));
}

function getWalletCurrencies(wallet: any): string[] {
  if (!wallet?.balances) return ['USD'];
  const keys =
    wallet.balances instanceof Map
      ? (Array.from(wallet.balances.keys()) as string[])
      : Object.keys(wallet.balances);
  return keys.length > 0 ? keys : ['USD'];
}

function pickStatus(): 'completed' | 'pending' | 'failed' {
  const r = Math.random();
  if (r < 0.85) return 'completed';
  if (r < 0.93) return 'pending';
  return 'failed';
}

function pickChannel(category: string, isOnline?: boolean): 'web' | 'mobile' | 'api' | 'branch' | 'atm' {
  if (category === 'cards') return isOnline ? 'web' : Math.random() < 0.12 ? 'atm' : 'mobile';
  return pickRandom(['web', 'mobile', 'api']);
}

export class ActivitySimulatorService {
  /**
   * List all users along with their simulator config and asset counts (Admin UI)
   */
  static async listUsersWithSimulatorStatus(search?: string, page = 1, limit = 50) {
    const query: any = { role: { $ne: 'admin' } };
    if (search && search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { accountNumber: rx }];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      Users.find(query)
        .select('firstName lastName email accountNumber country currency status kycStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Users.countDocuments(query),
    ]);

    const userIds = users.map((u: any) => String(u._id));

    const [configs, wallets, cards, loans, investments] = await Promise.all([
      ActivitySimulatorConfigs.find({ user: { $in: userIds } }).lean(),
      Wallets.find({ user: { $in: userIds }, status: 'active' }).select('user walletType balances').lean(),
      Cards.find({ user: { $in: userIds }, status: 'active' }).select('user cardType cardBrand currency').lean(),
      Loans.find({ user: { $in: userIds }, status: { $in: ['active', 'pending'] } }).select('user loanType status').lean(),
      InvestmentAccounts.find({ user: { $in: userIds }, status: 'active' }).select('user accountType currency').lean(),
    ]);

    const configMap = new Map(configs.map((c: any) => [String(c.user), c]));

    const items = users.map((u: any) => {
      const uid = String(u._id);
      const userWallets = wallets.filter((w: any) => String(w.user) === uid);
      const userCards = cards.filter((c: any) => String(c.user) === uid);
      const userLoans = loans.filter((l: any) => String(l.user) === uid);
      const userInvestments = investments.filter((i: any) => String(i.user) === uid);
      const cfg = configMap.get(uid);

      return {
        userId: uid,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        accountNumber: u.accountNumber || '—',
        country: u.country || '—',
        currency: u.currency || 'USD',
        userStatus: u.status,
        kycStatus: u.kycStatus,
        assets: {
          wallets: userWallets.length,
          walletTypes: userWallets.map((w: any) => w.walletType),
          cards: userCards.length,
          cardTypes: userCards.map((c: any) => `${c.cardBrand} ${c.cardType}`),
          loans: userLoans.length,
          investments: userInvestments.length,
        },
        simulator: cfg || {
          enabled: false,
          intensity: 'normal',
          enabledScopes: {
            accounts: true,
            cards: true,
            loans: true,
            investments: true,
            internalTransfers: true,
            fxConversions: true,
          },
          totalTransactionsGenerated: 0,
          totalVolumeGenerated: 0,
        },
      };
    });

    const totalEnabled = await ActivitySimulatorConfigs.countDocuments({ enabled: true });

    return {
      users: items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      totalEnabled,
    };
  }

  /**
   * Toggle activity simulator ON or OFF for a specific user (and update settings)
   */
  static async toggleUserSimulator(
    adminId: string,
    userId: string,
    payload: {
      enabled: boolean;
      intensity?: 'low' | 'normal' | 'high';
      enabledScopes?: Partial<IActivitySimulatorConfig['enabledScopes']>;
    },
    ip = '',
    userAgent = '',
  ) {
    const user = await Users.findById(userId).select('email firstName lastName').lean();
    if (!user) throw new Error('User not found');

    const existing = await ActivitySimulatorConfigs.findOne({ user: userId });

    const nextRunAt = payload.enabled
      ? new Date(Date.now() + randInt(15, 90) * 60 * 1000)
      : undefined;

    const updateDoc: any = {
      enabled: payload.enabled,
      ...(payload.intensity ? { intensity: payload.intensity } : {}),
      ...(payload.enabled ? { enabledBy: adminId, enabledAt: new Date(), nextRunAt } : { nextRunAt: null }),
    };

    if (payload.enabledScopes) {
      updateDoc.enabledScopes = {
        ...(existing?.enabledScopes || {
          accounts: true,
          cards: true,
          loans: true,
          investments: true,
          internalTransfers: true,
          fxConversions: true,
        }),
        ...payload.enabledScopes,
      };
    }

    const config = await ActivitySimulatorConfigs.findOneAndUpdate(
      { user: userId },
      { $set: updateDoc, $setOnInsert: { user: userId } },
      { new: true, upsert: true },
    );

    await logAdminAction(
      adminId,
      payload.enabled ? 'ENABLE_ACTIVITY_SIMULATOR' : 'DISABLE_ACTIVITY_SIMULATOR',
      'activity_simulator',
      userId,
      { enabled: payload.enabled, intensity: config.intensity },
      ip,
      userAgent,
      'success',
    );

    return config;
  }

  /**
   * Cron entry point: finds all enabled users whose nextRunAt <= now (or never ran)
   * and executes realistic transactions matching due cadences.
   */
  static async runDueSimulations(): Promise<{ processedUsers: number; totalGenerated: number }> {
    const now = new Date();
    const dueConfigs = await ActivitySimulatorConfigs.find({
      enabled: true,
      $or: [{ nextRunAt: { $lte: now } }, { nextRunAt: { $exists: false } }, { nextRunAt: null }],
    }).lean();

    if (dueConfigs.length === 0) {
      return { processedUsers: 0, totalGenerated: 0 };
    }

    let totalGenerated = 0;
    for (const cfg of dueConfigs) {
      try {
        const res = await this.simulateForUser(String(cfg.user), {
          cadenceOverride: 'auto',
        });
        totalGenerated += res.generatedCount;
      } catch (err: any) {
        log.error('Simulation failed for user', { userId: cfg.user, error: err?.message });
      }
    }

    return { processedUsers: dueConfigs.length, totalGenerated };
  }

  /**
   * Run simulation batch for all currently enabled users (Admin manual trigger)
   */
  static async runAllEnabledNow(cadenceOverride: Cadence | 'mixed' | 'auto' = 'mixed') {
    const enabled = await ActivitySimulatorConfigs.find({ enabled: true }).lean();
    let totalGenerated = 0;
    const results: any[] = [];

    for (const cfg of enabled) {
      try {
        const res = await this.simulateForUser(String(cfg.user), { cadenceOverride });
        totalGenerated += res.generatedCount;
        results.push({ userId: cfg.user, ...res });
      } catch (err: any) {
        results.push({ userId: cfg.user, error: err?.message });
      }
    }

    return { processedUsers: enabled.length, totalGenerated, results };
  }

  /**
   * Generate realistic transactions for a single user across all their assets
   */
  static async simulateForUser(
    userId: string,
    options: { cadenceOverride?: Cadence | 'mixed' | 'auto'; countOverride?: number } = {},
  ) {
    const now = new Date();
    let config = await ActivitySimulatorConfigs.findOne({ user: userId });
    if (!config) {
      config = await ActivitySimulatorConfigs.create({ user: userId, enabled: false });
    }

    const [user, wallets, cards, loans, investments] = await Promise.all([
      Users.findById(userId).lean() as any,
      Wallets.find({ user: userId, status: 'active' }),
      Cards.find({ user: userId, status: 'active' }),
      Loans.find({ user: userId, status: 'active' }),
      InvestmentAccounts.find({ user: userId, status: 'active' }),
    ]);

    if (!user) throw new Error('User not found');
    if (wallets.length === 0) {
      return { generatedCount: 0, message: 'User has no active wallets to simulate' };
    }

    // Determine which cadences are due
    const dueCadences: Cadence[] = [];
    const mode = options.cadenceOverride || 'auto';

    if (mode === 'mixed') {
      dueCadences.push('daily', 'weekly', 'biweekly', 'monthly');
      if (Math.random() < 0.35) dueCadences.push('yearly');
    } else if (mode !== 'auto') {
      dueCadences.push(mode);
    } else {
      const h = config.cadenceHistory || {};
      const hoursSince = (d?: Date) => (d ? (now.getTime() - new Date(d).getTime()) / 36e5 : 9999);
      dueCadences.push('daily');
      if (hoursSince(h.lastWeeklyAt) >= 24 * 7) dueCadences.push('weekly');
      if (hoursSince(h.lastBiweeklyAt) >= 24 * 14) dueCadences.push('biweekly');
      if (hoursSince(h.lastMonthlyAt) >= 24 * 30) dueCadences.push('monthly');
      if (hoursSince(h.lastYearlyAt) >= 24 * 365) dueCadences.push('yearly');
    }

    const intensityCounts = {
      low: randInt(2, 4),
      normal: randInt(4, 7),
      high: randInt(7, 12),
    };
    const targetCount = options.countOverride || intensityCounts[config.intensity || 'normal'];
    const scopes = config.enabledScopes || {
      accounts: true,
      cards: true,
      loans: true,
      investments: true,
      internalTransfers: true,
      fxConversions: true,
    };

    const summary = {
      credits: 0,
      debits: 0,
      cardTxns: 0,
      internalTransfers: 0,
      fxConversions: 0,
      loanEvents: 0,
      investmentEvents: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalVolume: 0,
      cadencesExecuted: dueCadences,
    };

    let generatedCount = 0;

    for (let i = 0; i < targetCount; i++) {
      const cadence = pickRandom(dueCadences);
      const roll = Math.random();

      try {
        // 1. Card Transaction (if user has active cards and scope enabled)
        if (scopes.cards && cards.length > 0 && roll < 0.32) {
          const res = await this.generateCardTransaction(userId, cards, wallets, cadence);
          if (res) {
            generatedCount++;
            summary.cardTxns++;
            summary[res.status]++;
            summary.totalVolume += res.amount;
            continue;
          }
        }

        // 2. Internal Transfer (wallet-to-wallet or wallet-to-card)
        if (scopes.internalTransfers && (wallets.length >= 2 || cards.length >= 1) && roll < 0.45) {
          const res = await this.generateInternalMove(userId, wallets, cards);
          if (res) {
            generatedCount++;
            summary.internalTransfers++;
            summary[res.status]++;
            summary.totalVolume += res.amount;
            continue;
          }
        }

        // 3. FX Conversion / International Settlement
        if (scopes.fxConversions && roll < 0.54) {
          const res = await this.generateFxTransaction(userId, wallets);
          if (res) {
            generatedCount++;
            summary.fxConversions++;
            summary[res.status]++;
            summary.totalVolume += res.amount;
            continue;
          }
        }

        // 4. Loan Repayment / Grant Event
        if (scopes.loans && loans.length > 0 && (cadence === 'monthly' || roll < 0.62)) {
          const res = await this.generateLoanTransaction(userId, loans, wallets);
          if (res) {
            generatedCount++;
            summary.loanEvents++;
            summary[res.status]++;
            summary.totalVolume += res.amount;
            continue;
          }
        }

        // 5. Investment Buy / Dividend Cashout / Market Loss
        if (scopes.investments && investments.length > 0 && roll < 0.72) {
          const res = await this.generateInvestmentTransaction(userId, investments, wallets, cadence);
          if (res) {
            generatedCount++;
            summary.investmentEvents++;
            summary[res.status]++;
            summary.totalVolume += res.amount;
            continue;
          }
        }

        // 6. Standard Account Credit / Debit matching wallet type (savings, fixed_deposit, current, business, personal)
        if (scopes.accounts) {
          const res = await this.generateAccountTransaction(userId, wallets, cadence);
          if (res) {
            generatedCount++;
            if (res.direction === 'credit') summary.credits++;
            else summary.debits++;
            summary[res.status]++;
            summary.totalVolume += res.amount;
          }
        }
      } catch (err: any) {
        log.warn('Skipped single simulated tx', { userId, error: err?.message });
      }
    }

    // Update cadence timestamps & stats
    const cadenceUpdate: any = { 'cadenceHistory.lastDailyAt': now };
    if (dueCadences.includes('weekly')) cadenceUpdate['cadenceHistory.lastWeeklyAt'] = now;
    if (dueCadences.includes('biweekly')) cadenceUpdate['cadenceHistory.lastBiweeklyAt'] = now;
    if (dueCadences.includes('monthly')) cadenceUpdate['cadenceHistory.lastMonthlyAt'] = now;
    if (dueCadences.includes('yearly')) cadenceUpdate['cadenceHistory.lastYearlyAt'] = now;

    // Next random run between 4 and 14 hours from now
    const nextRunAt = config.enabled
      ? new Date(now.getTime() + randInt(240, 840) * 60 * 1000)
      : undefined;

    await ActivitySimulatorConfigs.updateOne(
      { user: userId },
      {
        $set: {
          ...cadenceUpdate,
          lastRunAt: now,
          ...(nextRunAt ? { nextRunAt } : {}),
          lastRunSummary: summary,
        },
        $inc: {
          totalTransactionsGenerated: generatedCount,
          totalVolumeGenerated: Math.round(summary.totalVolume * 100) / 100,
        },
      },
    );

    await cacheDelete(`${CACHE_KEYS.USER_WALLETS}${userId}`);

    return { generatedCount, summary };
  }

  // --------------------------------------------------------------------------
  // GENERATOR 1: Wallet / Bank Account Credit or Debit (account-type aware)
  // --------------------------------------------------------------------------
  private static async generateAccountTransaction(userId: string, wallets: any[], cadence: Cadence) {
    const wallet = pickRandom(wallets);
    const currency = pickRandom(getWalletCurrencies(wallet));
    const wType = wallet.walletType || 'personal';

    // Real-world behavior by account type:
    // - fixed_deposit: only interest/maturity credits
    // - savings: 82% credits (deposits/interest), 18% rare withdrawals
    // - business: B2B contracts, payroll, supplier payouts, taxes
    // - current / personal: balanced daily life credits & debits
    let direction: 'credit' | 'debit' = 'debit';
    if (wType === 'fixed_deposit') {
      direction = 'credit';
    } else if (wType === 'savings') {
      direction = Math.random() < 0.82 ? 'credit' : 'debit';
    } else {
      direction = Math.random() < 0.44 ? 'credit' : 'debit';
    }

    const pool: any[] = descriptionsData[cadence]?.[direction === 'credit' ? 'credits' : 'debits'] || descriptionsData.daily.debits;
    const bankAccountsPool = pool.filter((item: any) => item.category === 'bankAccounts' || !item.isInternal);
    const template: any = pickRandom(bankAccountsPool.length > 0 ? bankAccountsPool : pool);

    // Pick realistic counterparty
    const isBusinessCounterparty =
      wType === 'business' ||
      cadence === 'yearly' ||
      cadence === 'biweekly' ||
      template.purpose.toLowerCase().includes('contract') ||
      template.purpose.toLowerCase().includes('salary') ||
      template.purpose.toLowerCase().includes('tax') ||
      template.purpose.toLowerCase().includes('mortgage') ||
      template.purpose.toLowerCase().includes('vehicle');

    const counterparty = isBusinessCounterparty
      ? pickRandom(counterpartiesData.businesses)
      : pickRandom(counterpartiesData.individuals);

    const usdAmount = randFloat(template.min || 25, template.max || 450);
    const amount = convertFromUsd(usdAmount, currency);
    const fee = template.feeRate ? Number((amount * template.feeRate).toFixed(2)) : 0;
    const totalDeduction = amount + fee;
    const isInternational = Boolean(template.isInternational || (counterparty.currency && counterparty.currency !== currency));

    let status = pickStatus();
    const currentBal = getWalletBalance(wallet, currency);

    if (direction === 'debit' && currentBal < totalDeduction) {
      // If wallet lacks funds for a debit, either fail realistically or switch to a credit
      if (Math.random() < 0.3) {
        status = 'failed';
      } else {
        direction = 'credit';
      }
    }

    const ref = generateReferenceNumber();
    const failedReason: string | undefined =
      status === 'failed' ? String(pickRandom(descriptionsData.special.failureReasons)) : undefined;

    if (status === 'completed') {
      const delta = direction === 'credit' ? amount - fee : -totalDeduction;
      updateWalletBalance(wallet, currency, delta);
      await wallet.save();
    }

    const tx: any = await Transactions.create({
      wallet: wallet._id,
      type: direction === 'credit' ? template.type || 'deposit' : template.type || 'payment',
      category: 'bankAccounts',
      amount,
      currency,
      status,
      description: `${template.purpose} (${counterparty.name})`,
      referenceNumber: ref,
      initiatedBy: userId,
      recipientAccountNumber: counterparty.accountNumber,
      recipientBankName: counterparty.bankName,
      recipientName: counterparty.name,
      fee,
      feeCurrency: currency,
      isInternational,
      sourceWalletType: wType,
      channel: pickChannel('bankAccounts') as any,
      completedAt: status === 'completed' ? new Date() : undefined,
      failedReason,
      meta: {
        simulated: true,
        cadence,
        direction,
        counterpartyCountry: counterparty.country,
      },
    });

    if (status === 'completed') {
      await LedgerEntries.create({
        wallet: wallet._id,
        transaction: tx._id,
        entryType: direction,
        amount,
        currency,
        balance: getWalletBalance(wallet, currency),
        description: `${template.purpose} — ${counterparty.name}`,
        accountingDate: new Date(),
      });
    }

    return { status, amount, direction };
  }

  // --------------------------------------------------------------------------
  // GENERATOR 2: Card Transactions (Debit, Credit, Prepaid, Virtual)
  // --------------------------------------------------------------------------
  private static async generateCardTransaction(
    userId: string,
    cards: any[],
    wallets: any[],
    cadence: Cadence,
  ) {
    const card = pickRandom(cards);
    const linkedWallet =
      wallets.find((w) => String(w._id) === String(card.fundingSource || card.wallet)) || wallets[0];
    const currency = card.currency || getWalletCurrencies(linkedWallet)[0] || 'USD';

    // Virtual cards favor online/subscriptions; physical debit/credit cover fuel, dining, travel, groceries
    const merchants = counterpartiesData.merchants.filter((m: any) => {
      if (card.cardType === 'virtual') return m.isOnline || m.isSubscription;
      if (cadence === 'monthly') return m.isSubscription || m.category === 'travel' || m.category === 'groceries';
      return true;
    });
    const merchant = pickRandom(merchants.length > 0 ? merchants : counterpartiesData.merchants);

    const usdAmount = randFloat(merchant.min, merchant.max);
    const amount = convertFromUsd(usdAmount, currency);
    const isInternational = Math.random() < 0.25;
    const fee = isInternational ? Number((amount * 0.018).toFixed(2)) : 0;
    const totalCharge = amount + fee;

    let status = pickStatus();
    if (card.cardType === 'credit') {
      const avail = Number(card.availableCredit ?? card.creditLimit ?? 5000);
      if (avail < totalCharge) status = 'failed';
    } else if (card.cardType === 'prepaid') {
      if (Number(card.balance || 0) < totalCharge) status = 'failed';
    } else {
      if (getWalletBalance(linkedWallet, currency) < totalCharge) status = 'failed';
    }

    const ref = generateReferenceNumber();
    const txType = merchant.category === 'atm' ? 'withdrawal' : 'payment';
    const cardTxType = merchant.category === 'atm' ? 'withdrawal' : 'purchase';

    if (status === 'completed') {
      if (card.cardType === 'credit') {
        card.availableCredit = Math.max(0, Number(card.availableCredit ?? card.creditLimit ?? 5000) - totalCharge);
        card.balance = Number(card.balance || 0) + totalCharge;
      } else if (card.cardType === 'prepaid') {
        card.balance = Math.max(0, Number(card.balance || 0) - totalCharge);
      } else {
        updateWalletBalance(linkedWallet, currency, -totalCharge);
        await linkedWallet.save();
      }
      card.lastUsedDate = new Date();
      await card.save();
    }

    const tx = await Transactions.create({
      wallet: linkedWallet._id,
      type: txType,
      category: 'cards',
      categoryItemId: String(card._id),
      amount,
      currency,
      status,
      description: `${card.cardBrand.toUpperCase()} ${card.cardType} — ${merchant.name} (${merchant.category})`,
      referenceNumber: ref,
      initiatedBy: userId,
      recipientName: merchant.name,
      fee,
      feeCurrency: currency,
      isInternational,
      sourceWalletType: linkedWallet.walletType,
      channel: pickChannel('cards', merchant.isOnline),
      completedAt: status === 'completed' ? new Date() : undefined,
      failedReason: status === 'failed' ? 'Card authorization declined / insufficient funds' : undefined,
      meta: {
        simulated: true,
        cadence,
        cardId: String(card._id),
        cardType: card.cardType,
        cardBrand: card.cardBrand,
        mcc: merchant.mcc,
        merchantCategory: merchant.category,
        isSubscription: merchant.isSubscription,
      },
    });

    await CardTransactions.create({
      card: card._id,
      transaction: tx._id,
      amount,
      currency,
      transactionType: cardTxType,
      status: status === 'failed' ? 'declined' : status,
      authorizationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      merchantName: merchant.name,
      merchantCategory: merchant.category,
      mcc: merchant.mcc,
      location: { city: merchant.city, country: merchant.country },
      isInternational,
      isOnline: merchant.isOnline,
      declineReason: status === 'failed' ? 'Insufficient available balance or credit limit' : undefined,
      settledAt: status === 'completed' ? new Date() : undefined,
    });

    if (status === 'completed' && card.cardType !== 'credit' && card.cardType !== 'prepaid') {
      await LedgerEntries.create({
        wallet: linkedWallet._id,
        transaction: tx._id,
        entryType: 'debit',
        amount: totalCharge,
        currency,
        balance: getWalletBalance(linkedWallet, currency),
        description: `Card purchase: ${merchant.name}`,
        accountingDate: new Date(),
      });
    }

    return { status, amount };
  }

  // --------------------------------------------------------------------------
  // GENERATOR 3: Internal Money Movement (Account-to-Account or Wallet-to-Card)
  // --------------------------------------------------------------------------
  private static async generateInternalMove(userId: string, wallets: any[], cards: any[]) {
    if (wallets.length < 2 && cards.length === 0) return null;

    const sourceWallet = pickRandom(wallets);
    const currency = getWalletCurrencies(sourceWallet)[0] || 'USD';
    const currentBal = getWalletBalance(sourceWallet, currency);
    const amount = convertFromUsd(randFloat(50, 600), currency);

    if (currentBal < amount) return null;

    const moveToCard = cards.length > 0 && (wallets.length < 2 || Math.random() < 0.4);
    const ref = generateReferenceNumber();

    if (moveToCard) {
      const card = pickRandom(cards);
      updateWalletBalance(sourceWallet, currency, -amount);
      await sourceWallet.save();

      card.balance = Number(card.balance || 0) + amount;
      await card.save();

      const tx = await Transactions.create({
        wallet: sourceWallet._id,
        type: 'funding',
        category: 'cards',
        categoryItemId: String(card._id),
        amount,
        currency,
        status: 'completed',
        description: `Internal Wallet-to-Card Top-Up (${card.cardBrand.toUpperCase()} ${card.cardType})`,
        referenceNumber: ref,
        initiatedBy: userId,
        fee: 0,
        sourceWalletType: sourceWallet.walletType,
        channel: 'mobile',
        completedAt: new Date(),
        meta: { simulated: true, internalMove: true, targetCardId: String(card._id) },
      });

      await LedgerEntries.create({
        wallet: sourceWallet._id,
        transaction: tx._id,
        entryType: 'debit',
        amount,
        currency,
        balance: getWalletBalance(sourceWallet, currency),
        description: `Card funding top-up (${card.cardBrand})`,
        accountingDate: new Date(),
      });

      return { status: 'completed' as const, amount };
    }

    // Wallet-to-Wallet internal move
    const otherWallets = wallets.filter((w) => String(w._id) !== String(sourceWallet._id));
    if (otherWallets.length === 0) return null;
    const destWallet = pickRandom(otherWallets);
    const desc = pickRandom(descriptionsData.special.internalMove);

    updateWalletBalance(sourceWallet, currency, -amount);
    updateWalletBalance(destWallet, currency, amount);
    await Promise.all([sourceWallet.save(), destWallet.save()]);

    const txOut = await Transactions.create({
      wallet: sourceWallet._id,
      recipientWallet: destWallet._id,
      type: 'transfer',
      category: 'bankAccounts',
      amount,
      currency,
      status: 'completed',
      description: `${desc} (${sourceWallet.walletType} → ${destWallet.walletType})`,
      referenceNumber: ref,
      initiatedBy: userId,
      fee: 0,
      sourceWalletType: sourceWallet.walletType,
      channel: 'web',
      completedAt: new Date(),
      meta: { simulated: true, internalMove: true },
    });

    await LedgerEntries.insertMany([
      {
        wallet: sourceWallet._id,
        transaction: txOut._id,
        entryType: 'debit',
        amount,
        currency,
        balance: getWalletBalance(sourceWallet, currency),
        description: `Internal transfer to ${destWallet.walletType} (${destWallet.walletNumber})`,
        accountingDate: new Date(),
      },
      {
        wallet: destWallet._id,
        transaction: txOut._id,
        entryType: 'credit',
        amount,
        currency,
        balance: getWalletBalance(destWallet, currency),
        description: `Internal transfer from ${sourceWallet.walletType} (${sourceWallet.walletNumber})`,
        accountingDate: new Date(),
      },
    ]);

    return { status: 'completed' as const, amount };
  }

  // --------------------------------------------------------------------------
  // GENERATOR 4: Currency Conversion / International FX Exchange
  // --------------------------------------------------------------------------
  private static async generateFxTransaction(userId: string, wallets: any[]) {
    const wallet = pickRandom(wallets);
    const currencies = getWalletCurrencies(wallet);
    const fromCurr = currencies[0] || 'USD';
    const targetPool = ['USD', 'EUR', 'GBP', 'CAD', 'NGN', 'KES'].filter((c) => c !== fromCurr);
    const toCurr = pickRandom(targetPool);

    const amount = convertFromUsd(randFloat(80, 1200), fromCurr);
    const currentBal = getWalletBalance(wallet, fromCurr);
    if (currentBal < amount) return null;

    const rate = getFxRate(fromCurr, toCurr);
    const fee = Number((amount * 0.0075).toFixed(2));
    const convertedAmount = Number(((amount - fee) * rate).toFixed(2));

    updateWalletBalance(wallet, fromCurr, -amount);
    updateWalletBalance(wallet, toCurr, convertedAmount);
    await wallet.save();

    const ref = generateReferenceNumber();
    const desc = pickRandom(descriptionsData.special.fxConversion);

    const tx = await Transactions.create({
      wallet: wallet._id,
      type: 'exchange',
      category: 'bankAccounts',
      amount,
      currency: fromCurr,
      status: 'completed',
      description: `${desc}: ${amount} ${fromCurr} → ${convertedAmount} ${toCurr}`,
      referenceNumber: ref,
      initiatedBy: userId,
      exchangeRate: rate,
      fee,
      feeCurrency: fromCurr,
      isInternational: true,
      sourceWalletType: wallet.walletType,
      channel: 'web',
      completedAt: new Date(),
      meta: { simulated: true, fromCurrency: fromCurr, toCurrency: toCurr, convertedAmount },
    });

    await LedgerEntries.insertMany([
      {
        wallet: wallet._id,
        transaction: tx._id,
        entryType: 'debit',
        amount,
        currency: fromCurr,
        balance: getWalletBalance(wallet, fromCurr),
        description: `FX Conversion out (${fromCurr} → ${toCurr})`,
        accountingDate: new Date(),
      },
      {
        wallet: wallet._id,
        transaction: tx._id,
        entryType: 'credit',
        amount: convertedAmount,
        currency: toCurr,
        balance: getWalletBalance(wallet, toCurr),
        description: `FX Conversion in (${fromCurr} → ${toCurr} @ ${rate})`,
        accountingDate: new Date(),
      },
    ]);

    return { status: 'completed' as const, amount };
  }

  // --------------------------------------------------------------------------
  // GENERATOR 5: Loan Disbursements & Repayments
  // --------------------------------------------------------------------------
  private static async generateLoanTransaction(userId: string, loans: any[], wallets: any[]) {
    const loan = pickRandom(loans);
    const wallet = wallets.find((w) => String(w._id) === String(loan.wallet)) || wallets[0];
    const currency = loan.currency || 'USD';
    const paymentAmount = Math.min(
      Number(loan.outstandingBalance || 0),
      Number(loan.monthlyPayment || convertFromUsd(320, currency)),
    );
    if (paymentAmount <= 0) return null;

    const bal = getWalletBalance(wallet, currency);
    const status = bal >= paymentAmount ? pickStatus() : 'failed';
    const ref = generateReferenceNumber();

    if (status === 'completed') {
      updateWalletBalance(wallet, currency, -paymentAmount);
      await wallet.save();

      loan.outstandingBalance = Math.max(0, Number(loan.outstandingBalance) - paymentAmount);
      if (loan.outstandingBalance === 0) loan.status = 'paid';
      await loan.save();
    }

    const tx = await Transactions.create({
      wallet: wallet._id,
      type: 'loan_repayment',
      category: 'loans',
      categoryItemId: String(loan._id),
      amount: paymentAmount,
      currency,
      status,
      description: `Scheduled ${loan.loanType} loan repayment`,
      referenceNumber: ref,
      initiatedBy: userId,
      fee: 0,
      channel: 'web',
      completedAt: status === 'completed' ? new Date() : undefined,
      failedReason: status === 'failed' ? 'Insufficient funds for scheduled loan installment' : undefined,
      meta: { simulated: true, loanId: loan.loanId, remainingBalance: loan.outstandingBalance },
    });

    if (status === 'completed') {
      await LedgerEntries.create({
        wallet: wallet._id,
        transaction: tx._id,
        entryType: 'debit',
        amount: paymentAmount,
        currency,
        balance: getWalletBalance(wallet, currency),
        description: `Loan repayment (${loan.loanType})`,
        accountingDate: new Date(),
      });
    }

    return { status, amount: paymentAmount };
  }

  // --------------------------------------------------------------------------
  // GENERATOR 6: Investment Purchases, Dividend Cashouts & Market Losses
  // --------------------------------------------------------------------------
  private static async generateInvestmentTransaction(
    userId: string,
    investments: any[],
    wallets: any[],
    cadence: Cadence,
  ) {
    const inv = pickRandom(investments);
    const wallet = wallets.find((w) => String(w._id) === String(inv.wallet)) || wallets[0];
    const currency = inv.currency || 'USD';

    // 45% dividend/profit cashout, 40% new investment allocation, 15% market loss / drawdown
    const r = Math.random();
    const isCashout = r < 0.45;
    const isLoss = r >= 0.85;

    const usdAmt = cadence === 'yearly' ? randFloat(1200, 9500) : randFloat(150, 1800);
    const amount = convertFromUsd(usdAmt, currency);
    const fee = Number((amount * 0.0025).toFixed(2));
    const ref = generateReferenceNumber();

    if (isLoss) {
      inv.currentValue = Math.max(0, Number(inv.currentValue || 0) - amount);
      inv.totalReturns = Number(inv.totalReturns || 0) - amount;
      await inv.save();

      await Transactions.create({
        wallet: wallet._id,
        type: 'investment',
        category: 'investments',
        categoryItemId: String(inv._id),
        amount,
        currency,
        status: 'completed',
        description: `Realized market drawdown / position loss (${inv.accountType})`,
        referenceNumber: ref,
        initiatedBy: userId,
        fee,
        feeCurrency: currency,
        channel: 'api',
        completedAt: new Date(),
        meta: { simulated: true, investmentOutcome: 'loss', accountType: inv.accountType },
      });

      return { status: 'completed' as const, amount };
    }

    if (isCashout) {
      updateWalletBalance(wallet, currency, amount - fee);
      await wallet.save();

      inv.totalReturns = Number(inv.totalReturns || 0) + amount;
      await inv.save();

      const tx = await Transactions.create({
        wallet: wallet._id,
        type: 'credit',
        category: 'investments',
        categoryItemId: String(inv._id),
        amount,
        currency,
        status: 'completed',
        description: `Investment dividend & capital gain cashout (${inv.accountType})`,
        referenceNumber: ref,
        initiatedBy: userId,
        fee,
        feeCurrency: currency,
        channel: 'api',
        completedAt: new Date(),
        meta: { simulated: true, investmentOutcome: 'cashout', accountType: inv.accountType },
      });

      await LedgerEntries.create({
        wallet: wallet._id,
        transaction: tx._id,
        entryType: 'credit',
        amount: amount - fee,
        currency,
        balance: getWalletBalance(wallet, currency),
        description: `Investment cashout (${inv.accountType})`,
        accountingDate: new Date(),
      });

      return { status: 'completed' as const, amount };
    }

    // Buy / allocate to investment
    const bal = getWalletBalance(wallet, currency);
    const status = bal >= amount + fee ? 'completed' : 'failed';

    if (status === 'completed') {
      updateWalletBalance(wallet, currency, -(amount + fee));
      await wallet.save();

      inv.totalInvested = Number(inv.totalInvested || 0) + amount;
      inv.currentValue = Number(inv.currentValue || 0) + amount;
      await inv.save();
    }

    const tx = await Transactions.create({
      wallet: wallet._id,
      type: 'investment',
      category: 'investments',
      categoryItemId: String(inv._id),
      amount,
      currency,
      status,
      description: `Portfolio capital allocation (${inv.accountType})`,
      referenceNumber: ref,
      initiatedBy: userId,
      fee,
      feeCurrency: currency,
      channel: 'web',
      completedAt: status === 'completed' ? new Date() : undefined,
      failedReason: status === 'failed' ? 'Insufficient wallet balance for investment order' : undefined,
      meta: { simulated: true, investmentOutcome: 'buy', accountType: inv.accountType },
    });

    if (status === 'completed') {
      await LedgerEntries.create({
        wallet: wallet._id,
        transaction: tx._id,
        entryType: 'debit',
        amount: amount + fee,
        currency,
        balance: getWalletBalance(wallet, currency),
        description: `Investment allocation (${inv.accountType})`,
        accountingDate: new Date(),
      });
    }

    return { status, amount };
  }
}

export default ActivitySimulatorService;

