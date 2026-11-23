// ============================================================================
// TRANSFER LIMITS SERVICE
// Single source of truth for Domestic & International transfer limits,
// live daily/monthly usage calculation, client limit change requests,
// and admin limit adjustments.
// ============================================================================

import Users from "../users/users.model.js";
import Transactions from "../transactions/transactions.model.js";
import LimitRequests from "./limit-requests.model.js";
import { NotFoundError, ValidationError } from "../../core/errors/AppError.js";

export type TransferScope = "domestic" | "international";

export interface ScopeLimits {
  perTransaction: number;
  daily: number;
  monthly: number;
}

export interface EffectiveScopeLimits extends ScopeLimits {
  dailyUsed: number;
  monthlyUsed: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  isCustom: boolean;
}

export const DEFAULT_SCOPE_LIMITS: Record<string, Record<TransferScope, ScopeLimits>> = {
  approved: {
    domestic: {
      perTransaction: 25000,
      daily: 500000,
      monthly: 2000000,
    },
    international: {
      perTransaction: 5000000,
      daily: 10000000,
      monthly: 50000000,
    },
  },
  pending: {
    domestic: {
      perTransaction: 200,
      daily: 500,
      monthly: 2000,
    },
    international: {
      perTransaction: 1000,
      daily: 5000,
      monthly: 20000,
    },
  },
  expired: {
    domestic: {
      perTransaction: 200,
      daily: 500,
      monthly: 2000,
    },
    international: {
      perTransaction: 1000,
      daily: 5000,
      monthly: 20000,
    },
  },
  rejected: {
    domestic: { perTransaction: 0, daily: 0, monthly: 0 },
    international: { perTransaction: 0, daily: 0, monthly: 0 },
  },
};

function resolveScopeLimits(
  kycStatus: string,
  customLimits: any,
  scope: TransferScope,
): { limits: ScopeLimits; isCustom: boolean } {
  const statusKey = DEFAULT_SCOPE_LIMITS[kycStatus] ? kycStatus : "pending";
  const base = DEFAULT_SCOPE_LIMITS[statusKey][scope];
  const custom = customLimits?.[scope];

  const hasCustom =
    custom &&
    (typeof custom.perTransaction === "number" ||
      typeof custom.daily === "number" ||
      typeof custom.monthly === "number");

  return {
    limits: {
      perTransaction:
        typeof custom?.perTransaction === "number" ? custom.perTransaction : base.perTransaction,
      daily: typeof custom?.daily === "number" ? custom.daily : base.daily,
      monthly: typeof custom?.monthly === "number" ? custom.monthly : base.monthly,
    },
    isCustom: Boolean(hasCustom),
  };
}

export class LimitsService {
  /**
   * Compute effective domestic & international limits + live daily/monthly usage for a user.
   */
  static async getEffectiveLimits(userId: string) {
    const user: any = await Users.findById(userId)
      .select("kycStatus customLimits firstName lastName email")
      .lean();
    if (!user) throw new NotFoundError("User not found");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [dailyAgg, monthlyAgg, requests] = await Promise.all([
      Transactions.aggregate([
        {
          $match: {
            initiatedBy: user._id,
            type: { $in: ["transfer", "withdrawal", "payment"] },
            status: { $in: ["completed", "pending", "processing"] },
            createdAt: { $gte: startOfDay },
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$isInternational", false] },
            total: { $sum: "$amount" },
          },
        },
      ]),
      Transactions.aggregate([
        {
          $match: {
            initiatedBy: user._id,
            type: { $in: ["transfer", "withdrawal", "payment"] },
            status: { $in: ["completed", "pending", "processing"] },
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: { $ifNull: ["$isInternational", false] },
            total: { $sum: "$amount" },
          },
        },
      ]),
      LimitRequests.find({ user: user._id }).sort({ createdAt: -1 }).limit(15).lean(),
    ]);

    const dailyDomUsed = dailyAgg.find((d) => d._id === false)?.total || 0;
    const dailyIntlUsed = dailyAgg.find((d) => d._id === true)?.total || 0;
    const monthlyDomUsed = monthlyAgg.find((d) => d._id === false)?.total || 0;
    const monthlyIntlUsed = monthlyAgg.find((d) => d._id === true)?.total || 0;

    const dom = resolveScopeLimits(user.kycStatus, user.customLimits, "domestic");
    const intl = resolveScopeLimits(user.kycStatus, user.customLimits, "international");

    const domestic: EffectiveScopeLimits = {
      ...dom.limits,
      dailyUsed: dailyDomUsed,
      monthlyUsed: monthlyDomUsed,
      dailyRemaining: Math.max(0, dom.limits.daily - dailyDomUsed),
      monthlyRemaining: Math.max(0, dom.limits.monthly - monthlyDomUsed),
      isCustom: dom.isCustom,
    };

    const international: EffectiveScopeLimits = {
      ...intl.limits,
      dailyUsed: dailyIntlUsed,
      monthlyUsed: monthlyIntlUsed,
      dailyRemaining: Math.max(0, intl.limits.daily - dailyIntlUsed),
      monthlyRemaining: Math.max(0, intl.limits.monthly - monthlyIntlUsed),
      isCustom: intl.isCustom,
    };

    return {
      kycStatus: user.kycStatus,
      customLimits: user.customLimits || {},
      domestic,
      international,
      limitRequests: requests,
    };
  }

  /**
   * Client submits a request to increase or decrease domestic/international transfer limits.
   */
  static async createLimitRequest(
    userId: string,
    body: {
      scope: TransferScope;
      action: "increase" | "decrease";
      perTransaction?: number;
      daily?: number;
      monthly?: number;
      reason?: string;
    },
  ) {
    const { scope, action, perTransaction, daily, monthly, reason } = body;

    if (scope !== "domestic" && scope !== "international") {
      throw new ValidationError("Limit scope must be 'domestic' or 'international'");
    }
    if (action !== "increase" && action !== "decrease") {
      throw new ValidationError("Action must be 'increase' or 'decrease'");
    }

    const requestedLimits: Record<string, number> = {};
    if (perTransaction !== undefined && perTransaction !== null && String(perTransaction) !== "") {
      const val = Number(perTransaction);
      if (!Number.isFinite(val) || val < 0) throw new ValidationError("Invalid per-transaction limit");
      requestedLimits.perTransaction = val;
    }
    if (daily !== undefined && daily !== null && String(daily) !== "") {
      const val = Number(daily);
      if (!Number.isFinite(val) || val < 0) throw new ValidationError("Invalid daily limit");
      requestedLimits.daily = val;
    }
    if (monthly !== undefined && monthly !== null && String(monthly) !== "") {
      const val = Number(monthly);
      if (!Number.isFinite(val) || val < 0) throw new ValidationError("Invalid monthly limit");
      requestedLimits.monthly = val;
    }

    if (Object.keys(requestedLimits).length === 0) {
      throw new ValidationError("Please specify at least one limit value (per-transaction, daily, or monthly)");
    }

    const effective = await this.getEffectiveLimits(userId);
    const current = effective[scope];

    const doc = await LimitRequests.create({
      user: userId,
      scope,
      action,
      requestedLimits,
      currentLimits: {
        perTransaction: current.perTransaction,
        daily: current.daily,
        monthly: current.monthly,
      },
      reason: reason?.trim() || undefined,
      status: "pending",
    });

    return doc;
  }

  /**
   * Admin updates a client's domestic and/or international transfer limits (increase or decrease),
   * optionally resolving a pending limit request.
   */
  static async updateUserLimits(
    adminId: string,
    userId: string,
    body: {
      domestic?: Partial<ScopeLimits>;
      international?: Partial<ScopeLimits>;
      limitRequestId?: string;
      requestStatus?: "approved" | "rejected";
      reviewNote?: string;
    },
  ) {
    const user: any = await Users.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const nextCustom: any = {
      domestic: { ...(user.customLimits?.domestic || {}) },
      international: { ...(user.customLimits?.international || {}) },
    };

    const applyScope = (scope: TransferScope, incoming?: Partial<ScopeLimits>) => {
      if (!incoming) return;
      for (const key of ["perTransaction", "daily", "monthly"] as const) {
        const raw = incoming[key];
        if (raw === null || raw === ("" as any)) {
          delete nextCustom[scope][key];
        } else if (raw !== undefined) {
          const num = Number(raw);
          if (!Number.isFinite(num) || num < 0) {
            throw new ValidationError(`Invalid ${scope} ${key} limit`);
          }
          nextCustom[scope][key] = num;
        }
      }
    };

    if (body.requestStatus !== "rejected") {
      applyScope("domestic", body.domestic);
      applyScope("international", body.international);
      user.customLimits = nextCustom;
      user.markModified("customLimits");
      await user.save();
    }

    if (body.limitRequestId) {
      await LimitRequests.findByIdAndUpdate(body.limitRequestId, {
        status: body.requestStatus || "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: body.reviewNote?.trim() || undefined,
      });
    }

    return this.getEffectiveLimits(userId);
  }

  /**
   * Admin lists limit change requests across all users.
   */
  static async getAdminLimitRequests(status?: string, page = 1, limit = 25) {
    const filter: any = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      LimitRequests.find(filter)
        .populate("user", "firstName lastName email kycStatus accountNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LimitRequests.countDocuments(filter),
    ]);

    return { requests, total, page, limit };
  }
}

