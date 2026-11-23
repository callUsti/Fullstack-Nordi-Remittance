import mongoose from "mongoose";
import Users from "../users/users.model.js";
import { Wallets } from "./accounts.model.js";
import { ValidationError, NotFoundError } from "../../core/errors/AppError.js";
import { emitToUser } from "../../services/websocket.service.js";

const WS_EVENTS = {
  BENEFICIARY_ADDED: "beneficiary:added",
  BENEFICIARY_REMOVED: "beneficiary:removed",
} as const;

export class BeneficiaryService {
  /**
   * Get saved beneficiaries
   */
  static async getBeneficiaries(userId: string) {
    const user: any = await Users.findById(userId).select("beneficiaries").lean();
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const list = Array.isArray(user.beneficiaries)
      ? user.beneficiaries.map((b: any) => ({
          ...b,
          id: String(b.id || b._id || ""),
        }))
      : [];

    return { beneficiaries: list };
  }

  /**
   * Add new beneficiary (supports both internal Nordi wallets/users and external bank accounts)
   */
  static async addBeneficiary(
    userId: string,
    data: {
      accountNumber?: string;
      email?: string;
      name?: string;
      nickname?: string;
      bankName?: string;
      bankCode?: string;
      currency?: string;
      country?: string;
      type?: string;
    },
  ) {
    const { accountNumber, email, name, nickname, bankName, bankCode, currency, country, type } = data;

    if (!accountNumber && !email) {
      throw new ValidationError("Account number or email is required");
    }

    let resolvedName = name?.trim() || "";
    let resolvedEmail = email?.trim() || undefined;
    let resolvedBankName = bankName?.trim() || undefined;
    let resolvedType = type || (bankName ? "external" : "internal");

    // Try to enrich from internal Users or Wallets if matching
    if (accountNumber) {
      const beneficiaryUser: any = await Users.findOne({ accountNumber }).select("firstName lastName email accountNumber").lean();
      if (beneficiaryUser) {
        if (!resolvedName) resolvedName = `${beneficiaryUser.firstName} ${beneficiaryUser.lastName}`.trim();
        if (!resolvedEmail) resolvedEmail = beneficiaryUser.email;
        resolvedType = "internal";
      } else {
        const matchingWallet: any = await Wallets.findOne({ walletNumber: accountNumber })
          .populate("user", "firstName lastName email")
          .lean();
        if (matchingWallet?.user) {
          if (!resolvedName) {
            resolvedName = `${matchingWallet.user.firstName || ""} ${matchingWallet.user.lastName || ""}`.trim();
          }
          if (!resolvedEmail) resolvedEmail = matchingWallet.user.email;
          resolvedType = "internal";
        }
      }
    } else if (email && !resolvedName) {
      const beneficiaryUser: any = await Users.findOne({ email: email.toLowerCase() })
        .select("firstName lastName email accountNumber")
        .lean();
      if (beneficiaryUser) {
        resolvedName = `${beneficiaryUser.firstName} ${beneficiaryUser.lastName}`.trim();
      }
    }

    const beneficiary = {
      id: new mongoose.Types.ObjectId(),
      accountNumber: accountNumber?.trim() || undefined,
      email: resolvedEmail,
      name: resolvedName || nickname?.trim() || email || accountNumber || "Saved Recipient",
      nickname: nickname?.trim() || resolvedName || email || accountNumber || "Saved Recipient",
      bankName: resolvedBankName || (resolvedType === "internal" ? "Nordi Remittance" : undefined),
      bankCode: bankCode?.trim() || undefined,
      currency: currency || "USD",
      country: country || undefined,
      type: resolvedType,
      createdAt: new Date(),
    };

    await Users.updateOne({ _id: userId }, { $push: { beneficiaries: beneficiary } });

    emitToUser(userId, WS_EVENTS.BENEFICIARY_ADDED, {
      beneficiary,
      message: "Beneficiary added successfully",
      timestamp: new Date().toISOString(),
    });

    return { beneficiary: { ...beneficiary, id: String(beneficiary.id) } };
  }

  /**
   * Remove beneficiary
   */
  static async removeBeneficiary(userId: string, beneficiaryId: string | string[]) {
    const idStr = Array.isArray(beneficiaryId) ? beneficiaryId[0] : beneficiaryId;
    const pullConditions: any[] = [{ id: idStr }];
    if (mongoose.Types.ObjectId.isValid(idStr)) {
      pullConditions.push({ id: new mongoose.Types.ObjectId(idStr) });
      pullConditions.push({ _id: new mongoose.Types.ObjectId(idStr) });
    }

    await Users.updateOne(
      { _id: userId },
      { $pull: { beneficiaries: { $or: pullConditions } } },
    );

    emitToUser(userId, WS_EVENTS.BENEFICIARY_REMOVED, {
      beneficiaryId: idStr,
      message: "Beneficiary removed successfully",
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }
}
