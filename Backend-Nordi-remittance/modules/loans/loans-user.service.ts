// ============================================================================
// LOANS USER SERVICE
// ============================================================================

import mongoose from "mongoose";
import {
  Loans,
  LoanApplications,
  CreditAssessments,
  RepaymentSchedules,
  LoanRepayments,
} from "./loans.model.js";
import { Wallets, LedgerEntries } from "../accounts/accounts.model.js";
import Transactions from "../transactions/transactions.model.js";
import Users from "../users/users.model.js";
import { Cards } from "../cards/cards.model.js";
import {
  SavingsGoals,
  InvestmentAccounts,
  Portfolios,
} from "../investments/investments.model.js";
import { generateReferenceNumber } from "../../core/helpers/generator.js";
import {
  ValidationError,
  NotFoundError,
} from "../../core/errors/AppError.js";
import { queueTemplatedMail } from "../../services/workers.js";
import { sendTemplatedMail } from "../../services/mailer.service.js";
import EmailContentGenerator from "../../core/mail/Mail-content.js";
import { emitToUser } from "../../services/websocket.service.js";
import { WS } from "../../core/constants/ws-events.js";
import { validateUserEligibility } from "../../core/guards/user-eligibility.guard.js";

const emailGenerator = new EmailContentGenerator();

const loanApplicationOtpStore = new Map<
  string,
  {
    code: string;
    expiresAt: number;
    isThirdParty: boolean;
    thirdPartyEmail?: string | null;
  }
>();

const IBAN_COUNTRIES = [
  "germany",
  "france",
  "netherlands",
  "spain",
  "italy",
  "sweden",
  "norway",
  "finland",
  "denmark",
  "belgium",
  "switzerland",
  "austria",
  "ireland",
  "poland",
  "portugal",
  "greece",
  "luxembourg",
];

function validateThirdPartyApplicantData(tp: any) {
  if (!tp || typeof tp !== "object") {
    throw new ValidationError("Third-party applicant details are required");
  }
  if (!tp.fullName || String(tp.fullName).trim().length < 2) {
    throw new ValidationError("Third-party applicant's full name is required");
  }
  if (!tp.relationshipToSponsor) {
    throw new ValidationError("Third-party applicant's relationship with you is required");
  }
  if (!tp.email || !String(tp.email).includes("@")) {
    throw new ValidationError("Third-party applicant's valid email address is required");
  }
  if (!tp.phoneNumber) {
    throw new ValidationError("Third-party applicant's phone number is required");
  }
  if (!tp.dateOfBirth) {
    throw new ValidationError("Third-party applicant's date of birth is required");
  }
  if (!tp.gender) {
    throw new ValidationError("Third-party applicant's gender is required");
  }
  if (!tp.maritalStatus) {
    throw new ValidationError("Third-party applicant's marital status is required");
  }
  if (!tp.occupation) {
    throw new ValidationError("Third-party applicant's occupation is required");
  }
  if (!tp.monthlyIncome || Number(tp.monthlyIncome) <= 0) {
    throw new ValidationError("Third-party applicant's monthly income is required");
  }
  if (!tp.country || !tp.state || !tp.city || !tp.address) {
    throw new ValidationError("Third-party applicant's country, state, city, and residential address are required");
  }
  if (!tp.nationalIdOrPassportNumber) {
    throw new ValidationError("Third-party applicant's National ID or Passport number is required");
  }

  const countryLower = String(tp.country || "").trim().toLowerCase();
  const isUSA =
    countryLower === "united states" ||
    countryLower === "usa" ||
    countryLower === "us" ||
    countryLower === "united states of america";
  const isUK =
    countryLower === "united kingdom" ||
    countryLower === "uk" ||
    countryLower === "gb" ||
    countryLower === "great britain";
  const isIbanCountry = IBAN_COUNTRIES.includes(countryLower);

  if (isUSA && (!tp.ssn || String(tp.ssn).trim().length < 4)) {
    throw new ValidationError("SSN (Social Security Number) is compulsory for third-party applicants in the USA");
  }

  const bank = tp.bankDetails || {};
  if (!bank.bankName || !bank.accountNumber) {
    throw new ValidationError("Third-party applicant's bank name and account number are required");
  }
  if (isUSA && !bank.routingNumber) {
    throw new ValidationError("Routing Number is required for third-party applicants in the USA");
  }
  if (isUK && !bank.sortCode && !bank.iban) {
    throw new ValidationError("Sort Code (or IBAN) is required for third-party applicants in the United Kingdom");
  }
  if (isIbanCountry && !bank.iban) {
    throw new ValidationError(`IBAN is required for third-party applicants in ${tp.country}`);
  }

  const nok = tp.nextOfKin || {};
  if (!nok.fullName || !nok.relationship || !nok.phoneNumber) {
    throw new ValidationError("Third-party applicant's Next of Kin full name, relationship, and phone number are required");
  }

  if (!tp.driversLicenseFrontUrl || !tp.driversLicenseBackUrl) {
    throw new ValidationError(
      "Both Driver's License Front and Back images are compulsory for third-party loan applications",
    );
  }
  if (!tp.bankStatementUrl) {
    throw new ValidationError(
      "Third-party applicant's Bank Account Statement document upload is compulsory",
    );
  }
}

export class LoansUserService {
  // --------------------------------------------------------------------------
  // GET LOANS
  // --------------------------------------------------------------------------
  static async getLoans(userId: string, query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { user: userId };
    if (query.status) filter.status = query.status;

    const [loans, total] = await Promise.all([
      Loans.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("application")
        .lean(),
      Loans.countDocuments(filter),
    ]);

    return { loans, page, limit, total };
  }

  // --------------------------------------------------------------------------
  // GET SINGLE LOAN
  // --------------------------------------------------------------------------
  static async getLoanById(userId: string, id: string) {
    const findQuery: any = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { loanId: id }], user: userId }
      : { loanId: id, user: userId };

    const loan = await Loans.findOne(findQuery)
      .populate("application")
      .lean();

    if (!loan) throw new NotFoundError("Loan not found");

    const schedule = await RepaymentSchedules.find({ loan: loan._id })
      .sort({ dueDate: 1 })
      .lean();

    const payments = await LoanRepayments.find({ loan: loan._id })
      .sort({ paymentDate: -1 })
      .lean();

    return { loan, schedule, payments };
  }

  // --------------------------------------------------------------------------
  // CHECK ELIGIBILITY (Includes Full KYC Checklist & Admin Approval State)
  // --------------------------------------------------------------------------
  static async checkEligibility(userId: string) {
    const user: any = await Users.findById(userId).lean();
    if (!user) throw new NotFoundError("User not found");

    const kycStatus = (user.kycStatus || "pending") as string;
    const isKycApproved = kycStatus === "approved" || kycStatus === "verified";
    const isKycInReview = kycStatus === "in_review" || kycStatus === "under_review";

    const kycChecklist = [
      {
        key: "personal_info",
        label: "Personal Information",
        description: "Full legal name and date of birth on your profile",
        completed: Boolean(user.firstName && user.lastName && user.dateOfBirth),
        status:
          isKycApproved || (user.firstName && user.lastName && user.dateOfBirth)
            ? isKycApproved
              ? "approved"
              : isKycInReview
                ? "in_review"
                : "completed"
            : "missing",
        fieldType: "profile",
      },
      {
        key: "address",
        label: "Residential Address",
        description: "Verified street address, city, and country of residence",
        completed: Boolean(user.homeAddress && user.city && user.country),
        status:
          isKycApproved || (user.homeAddress && user.city && user.country)
            ? isKycApproved
              ? "approved"
              : isKycInReview
                ? "in_review"
                : "completed"
            : "missing",
        fieldType: "address",
      },
      {
        key: "identity_document",
        label: "Government-Issued ID",
        description: "Passport, National ID card, or Driver's License",
        completed: Boolean(user.governmentId || user.idNumber),
        status:
          isKycApproved || user.governmentId || user.idNumber
            ? isKycApproved
              ? "approved"
              : isKycInReview
                ? "in_review"
                : "completed"
            : "missing",
        detail: user.idType ? `${String(user.idType).replace(/_/g, " ").toUpperCase()} ${user.idNumber || ""}`.trim() : undefined,
        fieldType: "document",
      },
      {
        key: "proof_of_address",
        label: "Proof of Address Document",
        description: "Recent utility bill or bank statement showing your address",
        completed: Boolean(user.proofOfAddress || user.addressDocType),
        status:
          isKycApproved || user.proofOfAddress || user.addressDocType
            ? isKycApproved
              ? "approved"
              : isKycInReview
                ? "in_review"
                : "completed"
            : "missing",
        fieldType: "document",
      },
      {
        key: "selfie",
        label: "Selfie Verification with ID",
        description: "Live portrait or photo holding your government ID",
        completed: Boolean(user.selfieWithId),
        status:
          isKycApproved || user.selfieWithId
            ? isKycApproved
              ? "approved"
              : isKycInReview
                ? "in_review"
                : "completed"
            : "missing",
        fieldType: "document",
      },
      {
        key: "signature",
        label: "Digital / Specimen Signature",
        description: "Authorized signature for loan and banking agreements",
        completed: Boolean(user.signature),
        status:
          isKycApproved || user.signature
            ? isKycApproved
              ? "approved"
              : isKycInReview
                ? "in_review"
                : "completed"
            : "missing",
        fieldType: "document",
      },
    ];

    const completedStepsCount = kycChecklist.filter((s) => s.completed).length;

    if (!isKycApproved) {
      const missingCount = kycChecklist.length - completedStepsCount;
      let reason =
        "Complete the remaining KYC requirements below and submit for Admin approval to unlock loan eligibility.";
      if (isKycInReview) {
        reason =
          "Your KYC verification has been submitted and is awaiting Admin approval. Once an Admin approves your KYC, you can proceed with your loan application.";
      } else if (kycStatus === "rejected") {
        reason =
          user.kycRejectionReason ||
          "Your previous KYC submission was rejected by an Admin. Please update the items below and resubmit for Admin approval.";
      } else if (missingCount === 0) {
        reason =
          "All KYC items are filled! Click 'Submit KYC for Admin Approval' below so an Admin can verify and approve your account.";
      }

      return {
        eligible: false,
        kycStatus,
        kycChecklist,
        completedStepsCount,
        totalStepsCount: kycChecklist.length,
        rejectionReason: user.kycRejectionReason || null,
        reason,
        maxAmount: 0,
        creditScore: 0,
      };
    }

    const [
      allUserLoans,
      userWallets,
      userCards,
      userSavingsGoals,
      userInvestmentAccounts,
      userPortfolios,
    ] = await Promise.all([
      Loans.find({ user: userId })
        .select("_id loanId principalAmount outstandingBalance status missedPayments latePayments defaultCount defaultFeePercentage")
        .lean(),
      Wallets.find({ user: userId, status: "active" }).lean(),
      Cards.find({ user: userId }).select("balance creditLimit totalRepaid status").lean().catch(() => []),
      SavingsGoals.find({ user: userId }).select("currentAmount targetAmount status").lean().catch(() => []),
      InvestmentAccounts.find({ user: userId }).select("totalValue totalInvested cashBalance").lean().catch(() => []),
      Portfolios.find({ user: userId }).select("currentValue totalInvested").lean().catch(() => []),
    ]);

    const activeLoans = allUserLoans.filter((l: any) =>
      ["active", "pending", "defaulted", "paused"].includes(l.status),
    );
    const paidLoansCount = allUserLoans.filter((l: any) => l.status === "paid").length;

    const totalOutstanding = activeLoans.reduce(
      (sum, loan: any) => sum + (Number(loan.outstandingBalance) || 0),
      0,
    );

    let totalWalletBalance = 0;
    const walletIds = userWallets.map((w: any) => {
      if (w.balances instanceof Map) {
        for (const val of w.balances.values()) totalWalletBalance += Number(val) || 0;
      } else if (w.balances && typeof w.balances === "object") {
        for (const val of Object.values(w.balances)) totalWalletBalance += Number(val) || 0;
      } else {
        totalWalletBalance += Number(w.balance || 0);
      }
      return w._id;
    });

    const userCreatedAt = user.createdAt || new Date();
    const accountAge = Math.max(
      1,
      Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24)),
    );

    const [allTransactions, userRepayments] = await Promise.all([
      Transactions.find({
        $or: [{ wallet: { $in: walletIds } }, { initiatedBy: userId }],
        status: "completed",
      })
        .select("amount createdAt")
        .lean(),
      LoanRepayments.find({
        loan: { $in: allUserLoans.map((l: any) => l._id) },
        status: "completed",
      })
        .select("amount isEarlyRepayment paymentDate")
        .lean()
        .catch(() => []),
    ]);

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentTransactions = allTransactions.filter(
      (t: any) => !t.createdAt || new Date(t.createdAt) >= ninetyDaysAgo,
    );

    const transactionVolume = Math.round(
      allTransactions.reduce((sum, t: any) => sum + (Number(t.amount) || 0), 0),
    );
    const recentTxVolume = recentTransactions.reduce(
      (sum, t: any) => sum + (Number(t.amount) || 0),
      0,
    );

    const cardsVolume = Math.round(
      (userCards as any[]).reduce(
        (sum, c: any) =>
          sum +
          (Number(c.balance) || 0) +
          (Number(c.creditLimit) || 0) +
          (Number(c.totalRepaid) || 0),
        0,
      ),
    );

    const savingsVolume = (userSavingsGoals as any[]).reduce(
      (sum, g: any) => sum + (Number(g.currentAmount) || 0),
      0,
    );
    const invAccountVolume = (userInvestmentAccounts as any[]).reduce(
      (sum, ia: any) =>
        sum + (Number(ia.totalValue) || Number(ia.totalInvested) || 0) + (Number(ia.cashBalance) || 0),
      0,
    );
    const portfolioVolume = (userPortfolios as any[]).reduce(
      (sum, p: any) => sum + (Number(p.currentValue) || Number(p.totalInvested) || 0),
      0,
    );
    const investmentsVolume = Math.round(savingsVolume + invAccountVolume + portfolioVolume);
    const accountsBalance = Math.round(totalWalletBalance);
    const totalFinancialVolume =
      accountsBalance + transactionVolume + cardsVolume + investmentsVolume;

    // Repayment speed & defaults metrics
    const completedRepaymentsCount = (userRepayments as any[]).length;
    const earlyRepaymentsCount = (userRepayments as any[]).filter((r: any) => r.isEarlyRepayment).length;
    const rawDefaults = allUserLoans.reduce(
      (sum, l: any) =>
        sum +
        (l.status === "defaulted" ? 1 : 0) +
        (Number(l.missedPayments) || 0) +
        (Number(l.defaultCount) || 0),
      0,
    );

    const loanConfig = user.loanConfig || {};
    const defaultCount =
      loanConfig.defaultCountOverride != null
        ? Number(loanConfig.defaultCountOverride)
        : rawDefaults;
    const defaultFeePercentPerDefault =
      loanConfig.defaultFeePercentPerDefault != null
        ? Number(loanConfig.defaultFeePercentPerDefault)
        : 2.5;
    const totalDefaultFeePercent =
      Math.round(defaultCount * defaultFeePercentPerDefault * 100) / 100;

    const repaymentSpeedMultiplier = Math.round(
      Math.max(
        0.4,
        Math.min(
          2.5,
          1.0 +
            paidLoansCount * 0.25 +
            Math.min(completedRepaymentsCount * 0.05, 0.5) +
            earlyRepaymentsCount * 0.1 -
            defaultCount * 0.2,
        ),
      ) * 100,
    ) / 100;

    const repaymentSpeedLabel =
      defaultCount > 0
        ? `Delinquent (${defaultCount} default${defaultCount > 1 ? "s" : ""})`
        : paidLoansCount > 0 || earlyRepaymentsCount > 0
          ? "Fast / Priority Repayer"
          : "Good Standing";

    const txMonthlyAvg = recentTxVolume > 0 ? recentTxVolume / 3 : transactionVolume / 6;
    const monthlyIncome = Math.round(
      Math.max(txMonthlyAvg, totalWalletBalance * 0.3, investmentsVolume * 0.2, 5000),
    );

    let creditScore = 660; // Base score for KYC-approved user
    if (accountAge > 30) creditScore += 20;
    if (accountAge > 90) creditScore += 20;
    if (allTransactions.length > 5) creditScore += 25;
    if (allTransactions.length > 20) creditScore += 30;
    if (totalFinancialVolume > 25000) creditScore += 30;
    if (totalFinancialVolume > 100000) creditScore += 35;
    if (paidLoansCount > 0) creditScore += Math.min(paidLoansCount * 20, 40);
    if (defaultCount > 0) creditScore -= defaultCount * 45;
    creditScore = Math.min(850, Math.max(450, creditScore));

    // Volume-driven large loan limit calculation (Accounts + Transactions + Cards + Investments) * Repayment Speed
    const volumeBasedLimit = Math.round(
      (accountsBalance * 1.6 +
        transactionVolume * 0.9 +
        cardsVolume * 1.3 +
        investmentsVolume * 1.6) *
        repaymentSpeedMultiplier,
    );
    const calculatedMaxLimit = Math.max(
      75000,
      Math.min(5000000, 75000 + volumeBasedLimit),
    );

    const effectiveMaxLimit =
      loanConfig.customMaxLoanAmount != null && Number(loanConfig.customMaxLoanAmount) >= 0
        ? Number(loanConfig.customMaxLoanAmount)
        : calculatedMaxLimit;

    const maxAmount = Math.max(0, Math.round(effectiveMaxLimit - totalOutstanding));

    const loanSuspended = Boolean(loanConfig.loanSuspended);
    const suspensionReason =
      loanConfig.suspensionReason ||
      "Your loan feature has been temporarily suspended by an Administrator.";

    const volumeBreakdown = {
      accountsBalance,
      transactionVolume,
      cardsVolume,
      investmentsVolume,
      totalFinancialVolume,
      paidLoansCount,
      completedRepaymentsCount,
      earlyRepaymentsCount,
      repaymentSpeedMultiplier,
      repaymentSpeedLabel,
      defaultCount,
      defaultFeePercentPerDefault,
      totalDefaultFeePercent,
      calculatedMaxLimit,
      customMaxLoanAmount:
        loanConfig.customMaxLoanAmount != null ? Number(loanConfig.customMaxLoanAmount) : null,
      loanSuspended,
      suspensionReason: loanSuspended ? suspensionReason : null,
    };

    if (loanSuspended) {
      return {
        eligible: false,
        loanSuspended: true,
        kycStatus: "approved",
        kycChecklist,
        completedStepsCount: kycChecklist.length,
        totalStepsCount: kycChecklist.length,
        creditScore,
        maxAmount: 0,
        monthlyIncome,
        outstandingDebt: totalOutstanding,
        accountAgeDays: accountAge,
        volumeBreakdown,
        reason: suspensionReason,
      };
    }

    let creditAssessment = await CreditAssessments.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!creditAssessment) {
      creditAssessment = new CreditAssessments({
        user: userId,
        creditScore,
        monthlyIncome,
        existingDebts: totalOutstanding,
        debtToIncomeRatio: monthlyIncome > 0 ? totalOutstanding / monthlyIncome : 0,
        recommendation: creditScore >= 550 ? "approve" : "reject",
        recommendedAmount: maxAmount,
        maxRecommendedAmount: maxAmount,
        assessmentDate: new Date(),
      });
      await creditAssessment.save().catch(() => {});
    }

    return {
      eligible: maxAmount > 0,
      loanSuspended: false,
      kycStatus: "approved",
      kycChecklist,
      completedStepsCount: kycChecklist.length,
      totalStepsCount: kycChecklist.length,
      creditScore,
      maxAmount,
      monthlyIncome,
      outstandingDebt: totalOutstanding,
      accountAgeDays: accountAge,
      volumeBreakdown,
      reason: maxAmount > 0 ? null : "Existing loan balance has reached your current borrowing limit",
    };
  }

  // --------------------------------------------------------------------------
  // SEND LOAN APPLICATION CONFIRMATION OTP (Self & Third-Party)
  // --------------------------------------------------------------------------
  static async sendApplicationOtp(userId: string, body: any) {
    await validateUserEligibility(userId, "loan application");

    const user: any = await Users.findById(userId).lean();
    if (!user) throw new NotFoundError("User not found");

    if (user.loanConfig?.loanSuspended) {
      throw new ValidationError(
        user.loanConfig.suspensionReason ||
          "Your loan feature has been suspended by an Administrator. Please contact support.",
      );
    }

    const { amount, termMonths, isThirdParty, thirdPartyApplicant } = body;
    if (!amount || Number(amount) < 100) {
      throw new ValidationError("Minimum loan amount is $100");
    }
    if (!termMonths || Number(termMonths) < 1 || Number(termMonths) > 60) {
      throw new ValidationError("Loan term must be between 1 and 60 months");
    }

    if (isThirdParty) {
      validateThirdPartyApplicantData(thirdPartyApplicant);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    loanApplicationOtpStore.set(userId, {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      isThirdParty: Boolean(isThirdParty),
      thirdPartyEmail: isThirdParty ? thirdPartyApplicant?.email || null : null,
    });

    const userOtpTemplate = emailGenerator.otpEmail({
      firstName: user.firstName || "Customer",
      userName: user.firstName || "Customer",
      otpCode,
      purpose: isThirdParty
        ? `Confirm Sponsored Third-Party Loan Application for ${thirdPartyApplicant?.fullName} ($${Number(amount).toLocaleString()})`
        : `Confirm Your Loan Application ($${Number(amount).toLocaleString()})`,
      expiresIn: "10 minutes",
      expiryMinutes: 10,
    } as any);

    sendTemplatedMail(user.email, userOtpTemplate).catch(() =>
      queueTemplatedMail(user.email, userOtpTemplate).catch(console.error),
    );

    if (isThirdParty && thirdPartyApplicant?.email) {
      const tpOtpTemplate = emailGenerator.otpEmail({
        firstName: thirdPartyApplicant.fullName || "Applicant",
        userName: thirdPartyApplicant.fullName || "Applicant",
        otpCode,
        purpose: `Sponsored Loan Application Confirmation (Sponsored by ${user.firstName} ${user.lastName} for $${Number(amount).toLocaleString()})`,
        expiresIn: "10 minutes",
        expiryMinutes: 10,
      } as any);
      sendTemplatedMail(thirdPartyApplicant.email, tpOtpTemplate).catch(() =>
        queueTemplatedMail(thirdPartyApplicant.email, tpOtpTemplate).catch(console.error),
      );
    }

    return {
      otpSent: true,
      email: user.email,
      thirdPartyEmail: isThirdParty ? thirdPartyApplicant?.email || null : null,
      expiresIn: "10 minutes",
    };
  }

  // --------------------------------------------------------------------------
  // APPLY FOR LOAN (Requires Email OTP Confirmation; Supports Self & Third-Party)
  // --------------------------------------------------------------------------
  static async applyForLoan(userId: string, body: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await validateUserEligibility(userId, "loan application");

      const {
        amount,
        purpose,
        termMonths,
        disbursementWalletId,
        otpCode,
        isThirdParty,
        thirdPartyApplicant,
      } = body;

      if (!otpCode || String(otpCode).trim().length < 6) {
        throw new ValidationError(
          "Please enter the 6-digit OTP sent to your email to confirm your loan application",
        );
      }

      const storedOtp = loanApplicationOtpStore.get(userId);
      if (!storedOtp || Date.now() > storedOtp.expiresAt) {
        loanApplicationOtpStore.delete(userId);
        throw new ValidationError(
          "Your loan confirmation OTP has expired or was not requested. Please request a new OTP.",
        );
      }
      if (String(storedOtp.code).trim() !== String(otpCode).trim()) {
        throw new ValidationError(
          "Invalid loan confirmation OTP code. Please check your email and enter the 6-digit code.",
        );
      }

      if (isThirdParty) {
        validateThirdPartyApplicantData(thirdPartyApplicant);
      }

      // Consume OTP after verification
      loanApplicationOtpStore.delete(userId);

      const user: any = await Users.findById(userId).session(session);
      if (!user) throw new NotFoundError("User not found");

      if (user.loanConfig?.loanSuspended) {
        throw new ValidationError(
          user.loanConfig.suspensionReason ||
            "Your loan feature has been suspended by an Administrator. Please contact support.",
        );
      }

      const eligibility = await this.checkEligibility(userId);
      const allowedMax = Math.max(eligibility.maxAmount || 75000, 75000);

      if (amount < 100) throw new ValidationError("Minimum loan amount is $100");
      if (amount > allowedMax) {
        throw new ValidationError(
          `Requested loan amount ($${Number(amount).toLocaleString()}) exceeds your current credit capacity of $${allowedMax.toLocaleString()}`,
        );
      }
      if (termMonths < 1 || termMonths > 60) {
        throw new ValidationError("Loan term must be between 1 and 60 months");
      }

      let wallet =
        disbursementWalletId && mongoose.isValidObjectId(disbursementWalletId)
          ? await Wallets.findOne({
              _id: disbursementWalletId,
              user: userId,
              status: "active",
            }).session(session)
          : null;

      if (!wallet) {
        wallet = await Wallets.findOne({
          user: userId,
          status: "active",
        })
          .sort({ isPrimary: -1 })
          .session(session);
      }

      if (!wallet) throw new NotFoundError("Disbursement wallet not found");

      if (!isThirdParty) {
        const pendingApp = await LoanApplications.findOne({
          user: userId,
          isThirdParty: { $ne: true },
          status: { $in: ["submitted", "under_review"] },
        }).session(session);

        if (pendingApp) {
          throw new ValidationError("You already have a pending personal loan application awaiting Admin review");
        }
      }

      const creditAssessment = await CreditAssessments.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .session(session);

      let interestRate = 12;
      if (creditAssessment) {
        if (creditAssessment.creditScore >= 700) interestRate = 8;
        else if (creditAssessment.creditScore >= 650) interestRate = 10;
        else if (creditAssessment.creditScore >= 600) interestRate = 12;
      }

      if (termMonths > 24) interestRate += 1;
      if (termMonths > 36) interestRate += 1;

      const vb: any = (eligibility as any).volumeBreakdown || {};
      const defaultFeePercentPerDefault = Number(vb.defaultFeePercentPerDefault ?? 2.5);
      const defaultCount = Number(vb.defaultCount ?? 0);
      const defaultFeePenalty = Math.round(defaultCount * defaultFeePercentPerDefault * 100) / 100;
      interestRate = Math.round((interestRate + defaultFeePenalty) * 100) / 100;

      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment =
        (amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
      const totalRepayment = monthlyPayment * termMonths;

      const purposeLower = String(purpose || "personal").toLowerCase();
      const mappedLoanType = purposeLower.includes("business")
        ? "business"
        : purposeLower.includes("education") || purposeLower.includes("student")
          ? "student"
          : purposeLower.includes("home") || purposeLower.includes("mortgage")
            ? "mortgage"
            : purposeLower.includes("auto") || purposeLower.includes("car")
              ? "auto"
              : "personal";

      const tpDocs = isThirdParty
        ? [
            {
              type: "drivers_license_front",
              filename: "Drivers-License-Front",
              url: thirdPartyApplicant.driversLicenseFrontUrl,
              uploadedAt: new Date(),
            },
            {
              type: "drivers_license_back",
              filename: "Drivers-License-Back",
              url: thirdPartyApplicant.driversLicenseBackUrl,
              uploadedAt: new Date(),
            },
            {
              type: "bank_statement",
              filename: "Bank-Account-Statement",
              url: thirdPartyApplicant.bankStatementUrl,
              uploadedAt: new Date(),
            },
          ]
        : [];

      const application = new LoanApplications({
        user: userId,
        loanType: mappedLoanType,
        requestedAmount: amount,
        term: termMonths,
        purpose: purpose || "Personal expenses",
        status: "submitted",
        interestRate,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        defaultFeePercentage: defaultFeePercentPerDefault,
        defaultCount,
        volumeMetrics: vb,
        disbursementWallet: wallet._id,
        isThirdParty: Boolean(isThirdParty),
        applicantType: isThirdParty ? "third_party" : "self",
        otpVerified: true,
        otpVerifiedAt: new Date(),
        ...(isThirdParty
          ? {
              thirdPartyApplicant: {
                ...thirdPartyApplicant,
                monthlyIncome: Number(thirdPartyApplicant.monthlyIncome || 0),
                sponsorCreditScoreUsed: eligibility.creditScore || 720,
                sponsorMaxCapacityUsed: allowedMax,
              },
              documents: tpDocs,
            }
          : {}),
        employmentInfo: {
          employmentStatus: isThirdParty
            ? thirdPartyApplicant?.employmentStatus || "employed"
            : (user as any).employmentStatus || "employed",
          employer: isThirdParty ? thirdPartyApplicant?.employerName : (user as any).employerName,
          occupation: isThirdParty
            ? thirdPartyApplicant?.occupation || "Professional"
            : (user as any).occupation || "Professional",
          monthlyIncome: isThirdParty
            ? Number(thirdPartyApplicant?.monthlyIncome || 5000)
            : creditAssessment?.monthlyIncome || vb.totalFinancialVolume || 5000,
        },
        financialInfo: {
          monthlyExpenses: 1500,
          existingDebts: creditAssessment?.existingDebts || 0,
          assets: vb.totalFinancialVolume || 10000,
          bankStatements: isThirdParty && thirdPartyApplicant?.bankStatementUrl ? [thirdPartyApplicant.bankStatementUrl] : [],
        },
        submittedAt: new Date(),
      });

      await application.save({ session });
      await session.commitTransaction();

      const emailContent = emailGenerator.loanApplicationEmail({
        applicantName: isThirdParty
          ? `${(user as any).firstName || "Customer"} (Sponsoring ${thirdPartyApplicant?.fullName})`
          : (user as any).firstName || "Customer",
        applicationId: application.applicationId || application._id.toString(),
        status: "under_review",
        amount: String(amount),
        requestedAmount: String(amount),
        currency: "USD",
        loanType: isThirdParty
          ? `Third-Party Sponsored Loan (${thirdPartyApplicant?.relationshipToSponsor}) — ${purpose || "Personal"}`
          : purpose || "Personal Loan",
        term: termMonths,
        interestRate: `${interestRate}% p.a.`,
      } as any);

      sendTemplatedMail((user as any).email, emailContent).catch(() =>
        queueTemplatedMail((user as any).email, emailContent).catch(console.error),
      );

      if (isThirdParty && thirdPartyApplicant?.email) {
        const tpPendingEmail = emailGenerator.loanApplicationEmail({
          applicantName: thirdPartyApplicant.fullName || "Applicant",
          applicationId: application.applicationId || application._id.toString(),
          status: "under_review",
          amount: String(amount),
          requestedAmount: String(amount),
          currency: "USD",
          loanType: `Sponsored Loan via ${(user as any).firstName || ""} ${(user as any).lastName || ""} (${purpose || "Personal Loan"})`,
          term: termMonths,
          interestRate: `${interestRate}% p.a.`,
        } as any);
        sendTemplatedMail(thirdPartyApplicant.email, tpPendingEmail).catch(() =>
          queueTemplatedMail(thirdPartyApplicant.email, tpPendingEmail).catch(console.error),
        );
      }

      emitToUser(userId, WS.LOAN.APPLICATION_SUBMITTED, {
        applicationId: application.applicationId || application._id,
        amount,
        termMonths,
        status: application.status,
        timestamp: new Date().toISOString(),
      });

      return {
        application: {
          id: application._id,
          applicationId: application.applicationId,
          status: application.status,
          requestedAmount: amount,
          interestRate,
          termMonths,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          totalRepayment: Math.round(totalRepayment * 100) / 100,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --------------------------------------------------------------------------
  // GET LOAN APPLICATIONS
  // --------------------------------------------------------------------------
  static async getApplications(userId: string) {
    const applications = await LoanApplications.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
    return { applications };
  }

  // --------------------------------------------------------------------------
  // MAKE PAYMENT (Manual Only — Enforces >= Monthly Requirement)
  // --------------------------------------------------------------------------
  static async makePayment(userId: string, id: string, body: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await validateUserEligibility(userId, "loan payment");

      const { amount, paymentType } = body;
      const resolvedWalletId = body.walletId || body.sourceAccountId || body.accountId;

      const loanQuery: any = mongoose.isValidObjectId(id)
        ? {
            $or: [{ _id: id }, { loanId: id }],
            user: userId,
            status: { $in: ["active", "pending", "defaulted", "paused"] },
          }
        : {
            loanId: id,
            user: userId,
            status: { $in: ["active", "pending", "defaulted", "paused"] },
          };

      const loan = await Loans.findOne(loanQuery).session(session);
      if (!loan) throw new NotFoundError("Active loan not found");

      let wallet =
        resolvedWalletId && mongoose.isValidObjectId(resolvedWalletId)
          ? await Wallets.findOne({
              _id: resolvedWalletId,
              user: userId,
              status: "active",
            }).session(session)
          : null;

      if (!wallet) {
        wallet = await Wallets.findOne({
          user: userId,
          status: "active",
        })
          .sort({ isPrimary: -1 })
          .session(session);
      }

      if (!wallet) throw new NotFoundError("Selected account / wallet not found");

      const getWalletBalance = (w: any, currency: string = "USD"): number => {
        if (!w || !w.balances) return 0;
        const balances =
          w.balances instanceof Map
            ? w.balances
            : new Map(Object.entries(w.balances));
        return Number(balances.get(currency) ?? balances.get("USD") ?? 0);
      };

      const currency = loan.currency || "USD";
      const walletBalance = getWalletBalance(wallet, currency);

      const baseMonthly =
        Number(loan.monthlyPayment) ||
        Number(loan.principalAmount) / Math.max(1, Number(loan.term) || 12);
      const loanDefaultCount =
        Number((loan as any).defaultCount || 0) + Number(loan.missedPayments || 0);
      const defaultFeePct = Number((loan as any).defaultFeePercentage ?? loan.lateFeePercentage ?? 2.5);
      const defaultFeeAmount =
        loanDefaultCount > 0
          ? Math.round(baseMonthly * ((loanDefaultCount * defaultFeePct) / 100) * 100) / 100
          : 0;
      const minimumMonthlyRequirement = Math.min(
        Number(loan.outstandingBalance),
        Math.round((baseMonthly + defaultFeeAmount) * 100) / 100,
      );

      let paymentAmount = Number(amount);
      if (paymentType === "full" || paymentType === "payoff") {
        paymentAmount = Number(loan.outstandingBalance);
      }

      if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new ValidationError("Please enter a valid repayment amount");
      }

      if (paymentAmount < minimumMonthlyRequirement - 0.01) {
        throw new ValidationError(
          `Repayment amount ($${paymentAmount.toFixed(2)}) cannot be below the monthly requirement of $${minimumMonthlyRequirement.toFixed(2)}`,
        );
      }

      if (paymentAmount > loan.outstandingBalance) {
        paymentAmount = loan.outstandingBalance;
      }

      if (walletBalance < paymentAmount) {
        throw new ValidationError(
          `Insufficient funds in selected account (${wallet.walletNumber}). Available: $${walletBalance.toFixed(2)}, Required: $${paymentAmount.toFixed(2)}`,
        );
      }

      if (!wallet.balances) {
        wallet.balances = new Map();
      }
      wallet.balances.set(currency, walletBalance - paymentAmount);
      await wallet.save({ session });

      const reference = generateReferenceNumber();
      const transaction = await Transactions.create(
        [
          {
            wallet: wallet._id,
            type: "payment",
            category: "loans",
            categoryItemId: loan._id.toString(),
            amount: paymentAmount,
            currency,
            status: "completed",
            referenceNumber: reference,
            initiatedBy: userId,
            description: `Loan payment - ${loan.loanId}`,
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
            amount: paymentAmount,
            currency,
            balance: getWalletBalance(wallet, currency),
            description: `Loan payment - ${loan.loanId}`,
            accountingDate: new Date(),
          },
        ],
        { session },
      );

      const interestPortion = Math.min(
        paymentAmount,
        loan.outstandingBalance * (loan.interestRate / 100 / 12),
      );
      const principalPortion = paymentAmount - interestPortion;

      const payment = new LoanRepayments({
        loan: loan._id,
        amount: paymentAmount,
        principalPaid: principalPortion,
        interestPaid: interestPortion,
        currency,
        paymentMethod: "wallet",
        transaction: transaction[0]._id,
        status: "completed",
        remainingBalance: loan.outstandingBalance - paymentAmount,
        paymentDate: new Date(),
      });

      await payment.save({ session });

      loan.outstandingBalance -= paymentAmount;
      if (loan.outstandingBalance <= 0) {
        loan.status = "paid";
        loan.closedAt = new Date();
      }
      await loan.save({ session });

      const scheduleDoc = await RepaymentSchedules.findOne({
        loan: loan._id,
      }).session(session);

      if (scheduleDoc && scheduleDoc.installments) {
        let remaining = paymentAmount;
        for (const installment of scheduleDoc.installments) {
          if (remaining <= 0) break;

          if (
            installment.status === "pending" ||
            installment.status === "overdue" ||
            installment.status === "partially_paid"
          ) {
            const installmentTotal = installment.totalAmount || 0;
            const alreadyPaid = installment.paidAmount || 0;
            const needed = Math.max(0, installmentTotal - alreadyPaid);
            if (remaining >= needed) {
              installment.status = "paid";
              installment.paidDate = new Date();
              installment.paidAmount = installmentTotal;
              remaining -= needed;
            } else {
              installment.paidAmount = alreadyPaid + remaining;
              installment.status = "partially_paid";
              remaining = 0;
            }
          }
        }
        await scheduleDoc.save({ session });
      }

      await session.commitTransaction();

      emitToUser(userId, WS.LOAN.PAYMENT_MADE, {
        loanId: loan.loanId || loan._id,
        paymentAmount,
        reference,
        outstandingBalance: loan.outstandingBalance,
        loanStatus: loan.status,
        timestamp: new Date().toISOString(),
      });

      return {
        payment: {
          id: payment._id,
          amount: paymentAmount,
          principalPortion,
          interestPortion,
          reference,
        },
        loan: {
          id: loan._id,
          loanId: loan.loanId,
          status: loan.status,
          outstandingBalance: loan.outstandingBalance,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --------------------------------------------------------------------------
  // GET REPAYMENT SCHEDULE
  // --------------------------------------------------------------------------
  static async getRepaymentSchedule(userId: string, id: string) {
    const loan = await Loans.findOne({
      $or: [{ _id: id }, { loanId: id }],
      user: userId,
    });

    if (!loan) throw new NotFoundError("Loan not found");

    const schedule = await RepaymentSchedules.findOne({ loan: loan._id }).lean();

    if (!schedule) {
      return { schedule: null, summary: null };
    }

    const installments = (schedule as any).installments || [];
    const summary = {
      totalScheduled: installments.reduce(
        (sum: number, s: any) => sum + (s.totalAmount || 0),
        0,
      ),
      totalPaid: installments
        .filter((s: any) => s.status === "paid")
        .reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0),
      nextPayment: installments.find((s: any) => s.status === "pending"),
      overduePayments: installments.filter((s: any) => s.status === "overdue").length,
    };

    return { schedule, summary };
  }
}
