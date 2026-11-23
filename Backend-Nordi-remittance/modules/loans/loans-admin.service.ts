// ============================================================================
// LOANS ADMIN SERVICE
// ============================================================================

import mongoose from "mongoose";
import {
  Loans,
  LoanApplications,
  RepaymentSchedules,
  LoanRepayments,
} from "./loans.model.js";
import { Wallets, LedgerEntries } from "../accounts/accounts.model.js";
import Transactions from "../transactions/transactions.model.js";
import Users from "../users/users.model.js";
import { LoansUserService } from "./loans-user.service.js";
import { generateReferenceNumber } from "../../core/helpers/generator.js";
import {
  ValidationError,
  NotFoundError,
} from "../../core/errors/AppError.js";
import { queueTemplatedMail } from "../../services/workers.js";
import { sendTemplatedMail } from "../../services/mailer.service.js";
import { generateLoanDecisionPDF } from "../../core/pdf/pdf-renderer.js";
import EmailContentGenerator from "../../core/mail/Mail-content.js";
import { emitToUser } from "../../services/websocket.service.js";
import { WS } from "../../core/constants/ws-events.js";

const emailGenerator = new EmailContentGenerator();

export class LoansAdminService {
  // --------------------------------------------------------------------------
  // GET ALL APPLICATIONS (Enriched with user wallets, loan state & loanConfig)
  // --------------------------------------------------------------------------
  static async getAllApplications(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 50, 200);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) filter.status = query.status;

    const [applications, total] = await Promise.all([
      LoanApplications.find(filter)
        .populate("user", "firstName lastName email kycStatus loanConfig")
        .populate("loan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoanApplications.countDocuments(filter),
    ]);

    const userIds = Array.from(
      new Set(
        applications
          .map((a: any) => String(a.user?._id || a.user || ""))
          .filter(Boolean),
      ),
    );

    const wallets = await Wallets.find({
      user: { $in: userIds },
      status: "active",
    })
      .select("_id user walletNumber walletType isPrimary balances status")
      .lean();

    const walletsByUser: Record<string, any[]> = {};
    for (const w of wallets as any[]) {
      const uid = String(w.user);
      if (!walletsByUser[uid]) walletsByUser[uid] = [];
      let bal = 0;
      if (w.balances instanceof Map) {
        for (const v of w.balances.values()) bal += Number(v) || 0;
      } else if (w.balances && typeof w.balances === "object") {
        for (const v of Object.values(w.balances)) bal += Number(v) || 0;
      }
      walletsByUser[uid].push({
        id: String(w._id),
        _id: String(w._id),
        walletNumber: w.walletNumber,
        walletType: w.walletType || "personal",
        isPrimary: Boolean(w.isPrimary),
        balance: Math.round(bal * 100) / 100,
        currency: "USD",
      });
    }

    const enriched = applications.map((app: any) => {
      const uid = String(app.user?._id || app.user || "");
      return {
        ...app,
        userWallets: walletsByUser[uid] || [],
        loanConfig: app.user?.loanConfig || {
          loanSuspended: false,
          defaultFeePercentPerDefault: 2.5,
          customMaxLoanAmount: null,
        },
      };
    });

    return { applications: enriched, page, limit, total };
  }

  // --------------------------------------------------------------------------
  // REVIEW APPLICATION
  // --------------------------------------------------------------------------
  static async reviewApplication(adminId: string, id: string, body: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { decision, approvedAmount, notes, reason } = body;

      const findQuery: any = mongoose.isValidObjectId(id)
        ? { $or: [{ _id: id }, { applicationId: id }] }
        : { applicationId: id };

      const application = await LoanApplications.findOne(findQuery)
        .populate("user")
        .session(session);

      if (!application) throw new NotFoundError("Application not found");
      if (
        application.status !== "submitted" &&
        application.status !== "under_review"
      ) {
        throw new ValidationError(
          "Application has already been reviewed or is not ready for review",
        );
      }

      const user = application.user as any;
      const applicantUserId = String(user?._id || application.user);

      if (decision === "approve") {
        if (user?.kycStatus && user.kycStatus !== "approved" && user.kycStatus !== "verified") {
          throw new ValidationError(
            "Applicant's KYC must be approved by an Admin before approving their loan application",
          );
        }

        const finalAmount = approvedAmount || application.requestedAmount;
        let targetWalletId = (application as any).disbursementWallet;
        if (!targetWalletId) {
          const fallbackWallet = await Wallets.findOne({
            user: applicantUserId,
            status: "active",
          })
            .sort({ isPrimary: -1 })
            .session(session);
          if (!fallbackWallet) {
            throw new NotFoundError("Applicant has no active wallet for loan disbursement");
          }
          targetWalletId = fallbackWallet._id;
        }

        const validLoanTypes = [
          "personal",
          "business",
          "mortgage",
          "auto",
          "student",
          "payday",
          "line_of_credit",
        ];
        const rawType = String(application.loanType || "personal").toLowerCase();
        const normalizedLoanType = validLoanTypes.includes(rawType) ? rawType : "personal";

        const userDefaultFeePct =
          Number(user?.loanConfig?.defaultFeePercentPerDefault) ||
          Number((application as any).defaultFeePercentage) ||
          2.5;
        const userDefaultCount =
          Number(user?.loanConfig?.defaultCountOverride ?? (application as any).defaultCount ?? 0);

        const loan = new Loans({
          user: applicantUserId,
          wallet: targetWalletId,
          application: application._id,
          loanType: normalizedLoanType as any,
          principalAmount: finalAmount,
          outstandingBalance:
            finalAmount * (1 + ((application as any).interestRate || 10) / 100),
          interestRate: (application as any).interestRate || 10,
          term: application.term,
          monthlyPayment:
            (application as any).monthlyPayment || finalAmount / application.term,
          totalInterest:
            (finalAmount * ((application as any).interestRate || 10)) / 100,
          totalRepayment:
            finalAmount * (1 + ((application as any).interestRate || 10) / 100),
          status: "pending",
          disbursementMethod: "wallet",
          purpose: application.purpose,
          defaultFeePercentage: userDefaultFeePct,
          defaultCount: userDefaultCount,
          autoDebitEnabled: false,
          isThirdParty: Boolean((application as any).isThirdParty),
          thirdPartyApplicant: (application as any).thirdPartyApplicant || undefined,
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextPaymentAmount:
            (application as any).monthlyPayment || finalAmount / application.term,
          startDate: new Date(),
          maturityDate: new Date(
            Date.now() + application.term * 30 * 24 * 60 * 60 * 1000,
          ),
        });

        await loan.save({ session });
        application.loan = loan._id as any;

        const installments = [];
        for (let i = 1; i <= application.term; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          const monthlyPayment =
            (application as any).monthlyPayment || finalAmount / application.term;

          installments.push({
            installmentNumber: i,
            dueDate,
            totalAmount: monthlyPayment,
            principalAmount: finalAmount / application.term,
            interestAmount: monthlyPayment - finalAmount / application.term,
            feeAmount: 0,
            status: "pending",
          });
        }

        const repaymentSchedule = new RepaymentSchedules({
          loan: loan._id,
          user: application.user,
          currency: (application as any).currency || "USD",
          totalPrincipal: finalAmount,
          totalInterest:
            (finalAmount * ((application as any).interestRate || 10)) / 100,
          totalAmount:
            finalAmount * (1 + ((application as any).interestRate || 10) / 100),
          installments,
          generatedAt: new Date(),
        });

        await repaymentSchedule.save({ session });

        application.status = "approved";
        application.approvedAmount = finalAmount;
        application.reviewedBy = adminId as any;
        application.reviewedAt = new Date();
        application.reviewNotes = notes || reason || "Approved by Lending Committee";

        const rateVal = Number((application as any).interestRate || 10);
        const monthlyVal =
          Number((application as any).monthlyPayment) ||
          Math.round((finalAmount / Math.max(1, application.term)) * 100) / 100;
        const totalInterestVal = Math.round(((finalAmount * rateVal) / 100) * 100) / 100;
        const totalRepaymentVal = Math.round((finalAmount + totalInterestVal) * 100) / 100;
        const tp = (application as any).thirdPartyApplicant;
        const isTP = Boolean((application as any).isThirdParty && tp);
        const sponsorFullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Account Holder";
        const borrowerDisplayName = isTP ? tp.fullName || sponsorFullName : sponsorFullName;

        const approvalEmailContent = emailGenerator.loanApplicationEmail({
          applicantName: borrowerDisplayName,
          applicationId: application.applicationId || application._id.toString(),
          status: "approved",
          amount: String(finalAmount),
          requestedAmount: String(application.requestedAmount),
          currency: "USD",
          loanType: isTP
            ? `Third-Party Sponsored (${tp.relationshipToSponsor}) — ${application.loanType}`
            : application.loanType,
          term: application.term,
          interestRate: `${rateVal}% p.a.`,
          monthlyPayment: String(monthlyVal),
          reason: notes || reason || "Approved following credit & KYC underwriting verification.",
        } as any);

        generateLoanDecisionPDF({
          application: application.toObject ? application.toObject() : application,
          decision: "approve",
          applicantName: borrowerDisplayName,
          sponsorName: sponsorFullName,
          amount: finalAmount,
          requestedAmount: application.requestedAmount,
          interestRate: rateVal,
          defaultFeePercentage: userDefaultFeePct,
          termMonths: application.term,
          monthlyPayment: monthlyVal,
          totalInterest: totalInterestVal,
          totalRepayment: totalRepaymentVal,
          currency: "USD",
          reason: notes || reason || "Approved following credit & KYC underwriting verification.",
          notes,
          isThirdParty: isTP,
          thirdPartyApplicant: tp,
          schedule: installments,
        })
          .then((pdfBuffer) => {
            const pdfAttachment = {
              filename: `Nordi-Loan-Approval-${application.applicationId || application._id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            };
            if (user?.email) {
              sendTemplatedMail(user.email, approvalEmailContent, [pdfAttachment]).catch(() =>
                queueTemplatedMail(user.email, approvalEmailContent).catch(console.error),
              );
            }
            if (isTP && tp?.email && tp.email !== user?.email) {
              sendTemplatedMail(tp.email, approvalEmailContent, [pdfAttachment]).catch(() =>
                queueTemplatedMail(tp.email, approvalEmailContent).catch(console.error),
              );
            }
          })
          .catch(console.error);
      } else if (decision === "reject") {
        const rejectReasonText = reason || notes || "Application did not meet current credit underwriting criteria.";
        application.status = "rejected";
        application.rejectionReason = rejectReasonText;
        application.reviewedBy = adminId as any;
        application.reviewedAt = new Date();
        application.reviewNotes = notes || rejectReasonText;

        const rateVal = Number((application as any).interestRate || 10);
        const monthlyVal =
          Number((application as any).monthlyPayment) ||
          Math.round((application.requestedAmount / Math.max(1, application.term)) * 100) / 100;
        const totalInterestVal = Math.round(((application.requestedAmount * rateVal) / 100) * 100) / 100;
        const totalRepaymentVal = Math.round((application.requestedAmount + totalInterestVal) * 100) / 100;
        const tp = (application as any).thirdPartyApplicant;
        const isTP = Boolean((application as any).isThirdParty && tp);
        const sponsorFullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Account Holder";
        const borrowerDisplayName = isTP ? tp.fullName || sponsorFullName : sponsorFullName;

        const rejectionEmailContent = emailGenerator.loanApplicationEmail({
          applicantName: borrowerDisplayName,
          applicationId: application.applicationId || application._id.toString(),
          status: "rejected",
          amount: String(application.requestedAmount),
          requestedAmount: String(application.requestedAmount),
          currency: "USD",
          loanType: isTP
            ? `Third-Party Sponsored (${tp.relationshipToSponsor}) — ${application.loanType}`
            : application.loanType,
          term: application.term,
          interestRate: `${rateVal}% p.a.`,
          monthlyPayment: String(monthlyVal),
          reason: rejectReasonText,
        } as any);

        generateLoanDecisionPDF({
          application: application.toObject ? application.toObject() : application,
          decision: "reject",
          applicantName: borrowerDisplayName,
          sponsorName: sponsorFullName,
          amount: application.requestedAmount,
          requestedAmount: application.requestedAmount,
          interestRate: rateVal,
          defaultFeePercentage: Number((application as any).defaultFeePercentage || 2.5),
          termMonths: application.term,
          monthlyPayment: monthlyVal,
          totalInterest: totalInterestVal,
          totalRepayment: totalRepaymentVal,
          currency: "USD",
          reason: rejectReasonText,
          notes,
          isThirdParty: isTP,
          thirdPartyApplicant: tp,
        })
          .then((pdfBuffer) => {
            const pdfAttachment = {
              filename: `Nordi-Loan-Decision-${application.applicationId || application._id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            };
            if (user?.email) {
              sendTemplatedMail(user.email, rejectionEmailContent, [pdfAttachment]).catch(() =>
                queueTemplatedMail(user.email, rejectionEmailContent).catch(console.error),
              );
            }
            if (isTP && tp?.email && tp.email !== user?.email) {
              sendTemplatedMail(tp.email, rejectionEmailContent, [pdfAttachment]).catch(() =>
                queueTemplatedMail(tp.email, rejectionEmailContent).catch(console.error),
              );
            }
          })
          .catch(console.error);
      }

      await application.save({ session });
      await session.commitTransaction();

      emitToUser(String(application.user), WS.LOAN.APPLICATION_REVIEWED, {
        applicationId: application.applicationId || application._id,
        decision,
        timestamp: new Date().toISOString(),
      });

      return { application, decision };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --------------------------------------------------------------------------
  // DISBURSE LOAN
  // --------------------------------------------------------------------------
  static async disburseLoan(adminId: string, id: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const findQuery: any = mongoose.isValidObjectId(id)
        ? { $or: [{ _id: id }, { loanId: id }], status: "pending" }
        : { loanId: id, status: "pending" };

      const loan = await Loans.findOne(findQuery).session(session);

      if (!loan) throw new NotFoundError("Pending approved loan not found");

      const wallet = await Wallets.findById(loan.wallet).session(session);
      if (!wallet) throw new NotFoundError("Disbursement wallet not found");

      const walletCurrency =
        wallet.balances instanceof Map
          ? Array.from(wallet.balances.keys())[0] || "USD"
          : Object.keys(wallet.balances || {})[0] || "USD";

      const getWalletBalance = (w: any, currency: string = "USD"): number => {
        if (!w || !w.balances) return 0;
        const balances =
          w.balances instanceof Map
            ? w.balances
            : new Map(Object.entries(w.balances));
        return balances.get(currency) || 0;
      };

      const currentBalance = getWalletBalance(wallet, walletCurrency);
      
      if (!wallet.balances) {
        wallet.balances = new Map();
      }
      wallet.balances.set(walletCurrency, currentBalance + loan.principalAmount);
      await wallet.save({ session });

      const reference = generateReferenceNumber();
      const transaction = new Transactions({
        wallet: wallet._id,
        type: "deposit",
        category: "loans",
        amount: loan.principalAmount,
        currency: walletCurrency,
        status: "completed",
        referenceNumber: reference,
        initiatedBy: adminId,
        description: `Loan disbursement - ${loan.loanId || loan._id}`,
        completedAt: new Date(),
      });
      await transaction.save({ session });

      await LedgerEntries.create(
        [
          {
            wallet: wallet._id,
            transaction: transaction._id,
            entryType: "credit",
            amount: loan.principalAmount,
            currency: walletCurrency,
            balance: currentBalance + loan.principalAmount,
            description: `Loan disbursement - ${loan.loanId || loan._id}`,
            accountingDate: new Date(),
          },
        ],
        { session },
      );

      loan.status = "active";
      (loan as any).disbursementDate = new Date();
      await loan.save({ session });

      await session.commitTransaction();

      const user = await Users.findById(loan.user);
      if (user) {
        const disbursementEmailContent = emailGenerator.loanDisbursedEmail({
          applicantName: (user as any).firstName || "Customer",
          loanId: loan.loanId || loan._id.toString(),
          loanType: (loan as any).loanType || "Personal Loan",
          amount: String(loan.principalAmount),
          currency: walletCurrency,
          disbursedTo: wallet.walletNumber,
          disbursedAt: new Date().toISOString(),
          repaymentStartDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          monthlyPayment: String(loan.monthlyPayment),
        });

        queueTemplatedMail((user as any).email, disbursementEmailContent).catch(
          console.error,
        );
      }

      emitToUser(String(loan.user), WS.LOAN.DISBURSED, {
        loanId: loan.loanId || loan._id,
        amount: loan.principalAmount,
        disbursementReference: reference,
        status: loan.status,
        timestamp: new Date().toISOString(),
      });

      return {
        loan: {
          id: loan._id,
          loanId: loan.loanId,
          status: loan.status,
          disbursementDate: (loan as any).disbursementDate,
          disbursementReference: reference,
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
  // ADMIN: UPDATE USER LOAN SETTINGS (Limit, Default Fee %, Record Default, Suspend)
  // --------------------------------------------------------------------------
  static async updateUserLoanSettings(adminId: string, userId: string, body: any) {
    const user: any = await Users.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const currentConfig = user.loanConfig || {};
    const {
      customMaxLoanAmount,
      defaultFeePercentPerDefault,
      defaultCountOverride,
      loanSuspended,
      suspensionReason,
      loanId,
      recordDefault,
    } = body;

    user.loanConfig = {
      ...currentConfig,
      customMaxLoanAmount:
        customMaxLoanAmount === null || customMaxLoanAmount === ""
          ? undefined
          : customMaxLoanAmount !== undefined
            ? Number(customMaxLoanAmount)
            : currentConfig.customMaxLoanAmount,
      defaultFeePercentPerDefault:
        defaultFeePercentPerDefault !== undefined
          ? Number(defaultFeePercentPerDefault)
          : currentConfig.defaultFeePercentPerDefault ?? 2.5,
      defaultCountOverride:
        defaultCountOverride === null || defaultCountOverride === ""
          ? undefined
          : defaultCountOverride !== undefined
            ? Number(defaultCountOverride)
            : currentConfig.defaultCountOverride,
      loanSuspended:
        loanSuspended !== undefined
          ? Boolean(loanSuspended)
          : Boolean(currentConfig.loanSuspended),
      suspensionReason:
        suspensionReason !== undefined
          ? suspensionReason
          : currentConfig.suspensionReason,
      updatedBy: adminId,
      updatedAt: new Date(),
    };

    await user.save();

    let updatedLoan: any = null;
    if (loanId) {
      const loanQuery: any = mongoose.isValidObjectId(loanId)
        ? { $or: [{ _id: loanId }, { loanId }] }
        : { loanId };
      const loan: any = await Loans.findOne(loanQuery);
      if (loan) {
        const feePct = Number(user.loanConfig.defaultFeePercentPerDefault ?? 2.5);
        loan.defaultFeePercentage = feePct;
        loan.lateFeePercentage = feePct;

        if (recordDefault) {
          loan.missedPayments = (Number(loan.missedPayments) || 0) + 1;
          loan.defaultCount = (Number(loan.defaultCount) || 0) + 1;
          const feeIncreaseAmount = Math.round(
            Number(loan.outstandingBalance || 0) * (feePct / 100) * 100,
          ) / 100;
          loan.outstandingBalance =
            Math.round((Number(loan.outstandingBalance || 0) + feeIncreaseAmount) * 100) / 100;
          loan.monthlyPayment =
            Math.round(Number(loan.monthlyPayment || 0) * (1 + feePct / 100) * 100) / 100;
          loan.interestRate =
            Math.round((Number(loan.interestRate || 10) + feePct) * 100) / 100;
        }
        await loan.save();
        updatedLoan = loan;
      }
    }

    const updatedEligibility = await LoansUserService.checkEligibility(userId);

    return {
      userId,
      loanConfig: user.loanConfig,
      updatedLoan,
      eligibility: updatedEligibility,
    };
  }

  // --------------------------------------------------------------------------
  // ADMIN: DEBIT USER ACCOUNT FOR LOAN REPAYMENT (Manual Admin Debit)
  // --------------------------------------------------------------------------
  static async adminDebitLoanRepayment(adminId: string, loanId: string, body: any) {
    const loanQuery: any = mongoose.isValidObjectId(loanId)
      ? { $or: [{ _id: loanId }, { loanId }] }
      : { loanId };

    const loan: any = await Loans.findOne(loanQuery);
    if (!loan) throw new NotFoundError("Loan not found for debit repayment");

    const userId = String(loan.user);
    const result = await LoansUserService.makePayment(userId, String(loan._id), {
      amount: body.amount,
      walletId: body.walletId || body.accountId || String(loan.wallet),
      paymentType: body.paymentType || "regular",
      initiatedByAdmin: adminId,
    });

    return result;
  }
}
