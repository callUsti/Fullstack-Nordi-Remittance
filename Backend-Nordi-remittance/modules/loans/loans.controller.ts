// ============================================================================
// LOANS CONTROLLER
// ============================================================================

import { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../types/index.js";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
} from "../../core/helpers/response.helper.js";
import { UnauthorizedError } from "../../core/errors/AppError.js";
import { LoansUserService } from "./loans-user.service.js";
import { LoansAdminService } from "./loans-admin.service.js";

// ============================================================================
// GET USER LOANS
// ============================================================================

export async function getLoans(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const result = await LoansUserService.getLoans(req.user.userId, req.query);

    sendPaginated(res, result.loans, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// GET SINGLE LOAN
// ============================================================================

export async function getLoanById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const id = (req.params.loanId || req.params.id) as string;
    const result = await LoansUserService.getLoanById(req.user.userId, id);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// CHECK LOAN ELIGIBILITY
// ============================================================================

export async function checkEligibility(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const result = await LoansUserService.checkEligibility(req.user.userId);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// SEND LOAN APPLICATION OTP
// ============================================================================

export async function sendApplicationOtp(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const result = await LoansUserService.sendApplicationOtp(
      req.user.userId,
      req.body,
    );

    sendSuccess(
      res,
      result,
      "Verification OTP sent to your email. Please enter the 6-digit code to confirm your loan application.",
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// APPLY FOR LOAN
// ============================================================================

export async function applyForLoan(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const result = await LoansUserService.applyForLoan(
      req.user.userId,
      req.body,
    );

    sendCreated(res, result, "Loan application submitted successfully");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// GET LOAN APPLICATIONS
// ============================================================================

export async function getApplications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const result = await LoansUserService.getApplications(req.user.userId);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// GET LOAN PRODUCTS
// ============================================================================

export async function getProducts(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const products = [
      {
        type: "personal",
        name: "Personal Loan",
        description: "Flexible financing for personal and household needs",
        minAmount: 500,
        maxAmount: 250000,
        minTerm: 3,
        maxTerm: 60,
        interestRate: 8.5,
        rate: "8.5%",
        isAvailable: true,
      },
      {
        type: "business",
        name: "Business Expansion Loan",
        description: "High-capacity working capital scaled to your transaction volume",
        minAmount: 5000,
        maxAmount: 2500000,
        minTerm: 6,
        maxTerm: 60,
        interestRate: 10.2,
        rate: "10.2%",
        isAvailable: true,
      },
      {
        type: "student",
        name: "Education Loan",
        description: "Low-rate financing for tuition and professional certification",
        minAmount: 1000,
        maxAmount: 150000,
        minTerm: 6,
        maxTerm: 60,
        interestRate: 6.8,
        rate: "6.8%",
        isAvailable: true,
      },
      {
        type: "mortgage",
        name: "Home & Property Loan",
        description: "Long-term financing for real estate and home improvement",
        minAmount: 10000,
        maxAmount: 5000000,
        minTerm: 12,
        maxTerm: 60,
        interestRate: 7.5,
        rate: "7.5%",
        isAvailable: true,
      },
    ];
    sendSuccess(res, { products });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// MAKE LOAN PAYMENT
// ============================================================================

export async function makePayment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const id = (req.params.loanId || req.params.id) as string;
    const result = await LoansUserService.makePayment(
      req.user.userId,
      id,
      req.body,
    );

    sendSuccess(res, result, "Payment processed successfully");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// GET REPAYMENT SCHEDULE
// ============================================================================

export async function getRepaymentSchedule(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const id = (req.params.loanId || req.params.id) as string;
    const result = await LoansUserService.getRepaymentSchedule(
      req.user.userId,
      id,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN: GET ALL APPLICATIONS
// ============================================================================

export async function getAllApplications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const result = await LoansAdminService.getAllApplications(req.query);

    sendPaginated(res, result.applications, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN: REVIEW APPLICATION
// ============================================================================

export async function reviewApplication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const id = (req.params.applicationId || req.params.id) as string;
    const result = await LoansAdminService.reviewApplication(
      req.user.userId,
      id,
      req.body,
    );

    sendSuccess(
      res,
      { application: result.application },
      `Application ${result.decision}ed successfully`,
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN: DISBURSE LOAN
// ============================================================================

export async function disburseLoan(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const id = (req.params.loanId || req.params.id) as string;
    const result = await LoansAdminService.disburseLoan(req.user.userId, id);

    sendSuccess(res, result, "Loan disbursed successfully");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN: UPDATE USER LOAN SETTINGS (Limit, Default Fee %, Record Default, Suspend)
// ============================================================================

export async function updateUserLoanSettings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const userId = (req.params.userId || req.body.userId) as string;
    const result = await LoansAdminService.updateUserLoanSettings(
      req.user.userId,
      userId,
      req.body,
    );

    sendSuccess(res, result, "User loan settings updated successfully");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN: DEBIT USER ACCOUNT FOR LOAN REPAYMENT
// ============================================================================

export async function adminDebitLoanRepayment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const loanId = (req.params.loanId || req.params.id) as string;
    const result = await LoansAdminService.adminDebitLoanRepayment(
      req.user.userId,
      loanId,
      req.body,
    );

    sendSuccess(res, result, "Loan repayment debited from user account successfully");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  getLoans,
  getLoanById,
  checkEligibility,
  sendApplicationOtp,
  applyForLoan,
  getApplications,
  getProducts,
  makePayment,
  getRepaymentSchedule,
  getAllApplications,
  reviewApplication,
  disburseLoan,
  updateUserLoanSettings,
  adminDebitLoanRepayment,
};
