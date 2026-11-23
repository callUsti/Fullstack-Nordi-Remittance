// ============================================================================
// LOAN ROUTES
// ============================================================================

import { Router } from "express";
import LoansController from "./loans.controller.js";
import {
  authenticate,
  requireAdmin,
  verifyAccountStatus,
} from "../../middleware/auth.middleware.js";
import {
  transactionRateLimit,
  sanitizeInput,
} from "../../middleware/security.middleware.js";
import {
  requestLoggingMiddleware,
  auditLogMiddleware,
} from "../../middleware/core.middleware.js";
import { requireKycVerified } from "../../middleware/kyc.middleware.js";

const router = Router();

// Apply common middleware
router.use(requestLoggingMiddleware);
router.use(sanitizeInput);
router.use(authenticate);
router.use(verifyAccountStatus);

// ============================================================================
// USER LOAN ROUTES
// ============================================================================

/**
 * @route   GET /api/loans
 * @desc    Get user's loans
 * @access  Private
 */
router.get("/", LoansController.getLoans);

/**
 * @route   GET /api/loans/eligibility/check
 * @desc    Check loan eligibility
 * @access  Private
 */
router.get(
  "/eligibility/check",
  LoansController.checkEligibility,
);

/**
 * @route   POST /api/loans/apply/send-otp
 * @desc    Send 6-digit email OTP to confirm loan application (self or third-party)
 * @access  Private
 */
router.post(
  "/apply/send-otp",
  transactionRateLimit,
  requireKycVerified,
  auditLogMiddleware,
  LoansController.sendApplicationOtp,
);

/**
 * @route   POST /api/loans/apply
 * @desc    Apply for a new loan (confirmed with OTP)
 * @access  Private
 */
router.post(
  "/apply",
  transactionRateLimit,
  requireKycVerified,
  auditLogMiddleware,
  LoansController.applyForLoan,
);

/**
 * @route   GET /api/loans/applications
 * @desc    Get user's loan applications
 * @access  Private
 */
router.get("/applications", LoansController.getApplications);

/**
 * @route   GET /api/loans/products
 * @desc    Get available loan products
 * @access  Private
 */
router.get("/products", LoansController.getProducts);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @route   GET /api/loans/admin/applications
 * @desc    Get all loan applications
 * @access  Admin
 */
router.get(
  "/admin/applications",
  requireAdmin,
  LoansController.getAllApplications,
);

/**
 * @route   POST /api/loans/admin/applications/:applicationId/review
 * @desc    Review loan application
 * @access  Admin
 */
router.post(
  "/admin/applications/:applicationId/review",
  requireAdmin,
  auditLogMiddleware,
  LoansController.reviewApplication,
);

/**
 * @route   POST /api/loans/admin/:loanId/disburse
 * @desc    Disburse approved loan
 * @access  Admin
 */
router.post(
  "/admin/:loanId/disburse",
  requireAdmin,
  auditLogMiddleware,
  LoansController.disburseLoan,
);

/**
 * @route   PATCH /api/loans/admin/users/:userId/loan-settings
 * @desc    Admin update user loan limit, default fee %, default count, or suspend loan feature
 * @access  Admin
 */
router.patch(
  "/admin/users/:userId/loan-settings",
  requireAdmin,
  auditLogMiddleware,
  LoansController.updateUserLoanSettings,
);

/**
 * @route   POST /api/loans/admin/:loanId/debit-repayment
 * @desc    Admin manually debit user account to repay a loan (>= monthly requirement)
 * @access  Admin
 */
router.post(
  "/admin/:loanId/debit-repayment",
  requireAdmin,
  auditLogMiddleware,
  LoansController.adminDebitLoanRepayment,
);

/**
 * @route   GET /api/loans/:loanId
 * @desc    Get specific loan details
 * @access  Private
 */
router.get("/:loanId", LoansController.getLoanById);

/**
 * @route   GET /api/loans/:loanId/schedule
 * @desc    Get loan repayment schedule
 * @access  Private
 */
router.get("/:loanId/schedule", LoansController.getRepaymentSchedule);

/**
 * @route   POST /api/loans/:loanId/pay
 * @desc    Make a manual loan payment (never auto-debits)
 * @access  Private
 */
router.post(
  "/:loanId/pay",
  transactionRateLimit,
  auditLogMiddleware,
  LoansController.makePayment,
);

export default router;
