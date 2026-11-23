import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const { Schema } = mongoose;

// Schemas
const LoanSchema = new Schema({
  loanId: { type: String, required: true, unique: true, default: uuidv4 },
  user: { type: String, ref: "Users", required: true },
  wallet: { type: Schema.Types.ObjectId, ref: "Wallets", required: true },
  loanType: {
    type: String,
    enum: [
      "personal",
      "business",
      "mortgage",
      "auto",
      "student",
      "payday",
      "line_of_credit",
    ],
    required: true,
  },
  principalAmount: { type: Number, required: true },
  outstandingBalance: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  term: { type: Number, required: true },
  startDate: { type: Date, required: true },
  maturityDate: { type: Date, required: true },
  monthlyPayment: { type: Number, required: true },
  totalInterest: { type: Number, required: true },
  totalRepayment: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "active", "paid", "defaulted", "written_off", "paused"],
    default: "pending",
  },
  currency: { type: String, required: true, default: "USD" },
  disbursementDate: { type: Date },
  disbursementMethod: {
    type: String,
    enum: ["bank_transfer", "wallet", "check"],
    required: true,
  },
  disbursementAccount: { type: String },
  collateral: { type: Schema.Types.ObjectId, ref: "Collaterals" },
  hasCollateral: { type: Boolean, default: false },
  purpose: { type: String, required: true },
  creditScore: { type: Number },
  creditAssessment: { type: Schema.Types.ObjectId, ref: "CreditAssessments" },
  repaymentSchedule: { type: Schema.Types.ObjectId, ref: "RepaymentSchedules" },
  nextPaymentDate: { type: Date },
  nextPaymentAmount: { type: Number },
  missedPayments: { type: Number, default: 0 },
  latePayments: { type: Number, default: 0 },
  defaultCount: { type: Number, default: 0 },
  defaultFeePercentage: { type: Number, default: 2.5 },
  autoDebitEnabled: { type: Boolean, default: false },
  isThirdParty: { type: Boolean, default: false },
  thirdPartyApplicant: { type: Schema.Types.Mixed },
  application: { type: Schema.Types.ObjectId, ref: "LoanApplications" },
  gracePeriodDays: { type: Number, default: 5 },
  lateFeePercentage: { type: Number, default: 5 },
  earlyRepaymentAllowed: { type: Boolean, default: true },
  earlyRepaymentPenalty: { type: Number },
  insuranceRequired: { type: Boolean, default: false },
  insuranceProvider: { type: String },
  insurancePremium: { type: Number },
  metadata: { type: Schema.Types.Mixed },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  rejectedReason: { type: String },
  closedAt: { type: Date },
  walletLocked: { type: Boolean, default: false }, // once true, wallet ref becomes immutable
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Immutability guard: once a loan is bound to a wallet, it cannot be moved
LoanSchema.pre('save', function (this: any) {
  if (this.walletLocked && this.isModified('wallet')) {
    throw new Error('Cannot change wallet on a locked loan. Loan-wallet binding is immutable.');
  }
  // Lock the wallet on first save if wallet is set
  if (this.wallet && !this.walletLocked) {
    this.walletLocked = true;
  }
});

const LoanApplicationSchema = new Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4,
  },
  user: { type: String, ref: "Users", required: true },
  loanType: { type: String, required: true },
  requestedAmount: { type: Number, required: true },
  term: { type: Number, required: true },
  purpose: { type: String, required: true },
  status: {
    type: String,
    enum: [
      "draft",
      "submitted",
      "under_review",
      "approved",
      "rejected",
      "cancelled",
    ],
    default: "draft",
  },
  employmentInfo: {
    employmentStatus: { type: String, required: true },
    employer: { type: String },
    occupation: { type: String, required: true },
    monthlyIncome: { type: Number, required: true },
    yearsEmployed: { type: Number },
  },
  financialInfo: {
    monthlyExpenses: { type: Number, required: true },
    existingDebts: { type: Number, required: true },
    assets: { type: Number, required: true },
    bankStatements: [{ type: String }],
  },
  creditCheck: {
    creditScore: { type: Number },
    creditReportProvider: { type: String },
    creditReportDate: { type: Date },
  },
  documents: [
    {
      type: { type: String, required: true },
      filename: { type: String, required: true },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  reviewNotes: { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  approvalNotes: { type: String },
  approvedAmount: { type: Number },
  approvedRate: { type: Number },
  approvedTerm: { type: Number },
  interestRate: { type: Number },
  monthlyPayment: { type: Number },
  defaultFeePercentage: { type: Number, default: 2.5 },
  defaultCount: { type: Number, default: 0 },
  volumeMetrics: { type: Schema.Types.Mixed },
  isThirdParty: { type: Boolean, default: false },
  applicantType: {
    type: String,
    enum: ["self", "third_party"],
    default: "self",
  },
  otpVerified: { type: Boolean, default: false },
  otpVerifiedAt: { type: Date },
  thirdPartyApplicant: {
    fullName: { type: String },
    firstName: { type: String },
    middleName: { type: String },
    lastName: { type: String },
    relationshipToSponsor: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    alternatePhone: { type: String },
    dateOfBirth: { type: String },
    gender: { type: String },
    maritalStatus: { type: String },
    occupation: { type: String },
    employerName: { type: String },
    employmentStatus: { type: String },
    monthlyIncome: { type: Number },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    address: { type: String },
    postalCode: { type: String },
    idDocumentType: { type: String },
    nationalIdOrPassportNumber: { type: String },
    ssn: { type: String },
    taxId: { type: String },
    driversLicenseFrontUrl: { type: String },
    driversLicenseBackUrl: { type: String },
    bankStatementUrl: { type: String },
    bankDetails: {
      bankName: { type: String },
      accountName: { type: String },
      accountNumber: { type: String },
      routingNumber: { type: String },
      sortCode: { type: String },
      iban: { type: String },
      swiftBic: { type: String },
      currency: { type: String, default: "USD" },
    },
    nextOfKin: {
      fullName: { type: String },
      relationship: { type: String },
      phoneNumber: { type: String },
      email: { type: String },
      address: { type: String },
    },
    sponsorCreditScoreUsed: { type: Number },
    sponsorMaxCapacityUsed: { type: Number },
  },
  disbursementWallet: { type: Schema.Types.ObjectId, ref: "Wallets" },
  rejectionReason: { type: String },
  loan: { type: Schema.Types.ObjectId, ref: "Loans" },
  submittedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CreditAssessmentSchema = new Schema({
  user: { type: String, ref: "Users", required: true },
  loanApplication: {
    type: Schema.Types.ObjectId,
    ref: "LoanApplications",
  },
  creditScore: { type: Number, required: true },
  creditReportProvider: { type: String, default: "Nordi Internal Bureau" },
  creditReportDate: { type: Date, default: Date.now },
  debtToIncomeRatio: { type: Number, default: 0 },
  employmentStability: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
    default: "good",
  },
  paymentHistory: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
    default: "good",
  },
  existingDebts: { type: Number, default: 0 },
  monthlyIncome: { type: Number, default: 0 },
  riskScore: { type: Number, default: 25, min: 0, max: 100 },
  riskCategory: {
    type: String,
    enum: ["low", "medium", "high", "very_high"],
    default: "low",
  },
  recommendation: {
    type: String,
    enum: ["approve", "approve_with_conditions", "reject", "deny"],
    default: "approve",
  },
  recommendedAmount: { type: Number },
  maxRecommendedAmount: { type: Number },
  recommendedRate: { type: Number },
  recommendedTerm: { type: Number },
  conditions: [{ type: String }],
  assessedBy: { type: String, default: "system" },
  assessmentNotes: { type: String },
  assessmentDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, immutable: true },
});

const RepaymentScheduleSchema = new Schema({
  loan: {
    type: Schema.Types.ObjectId,
    ref: "Loans",
    required: true,
    unique: true,
  },
  installments: [
    {
      installmentNumber: { type: Number, required: true },
      dueDate: { type: Date, required: true },
      principalAmount: { type: Number, required: true },
      interestAmount: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["pending", "paid", "overdue", "partially_paid"],
        default: "pending",
      },
      paidAmount: { type: Number },
      paidDate: { type: Date },
      lateFee: { type: Number, default: 0 },
      remainingBalance: { type: Number, default: 0 },
    },
  ],
  totalPrincipal: { type: Number, required: true },
  totalInterest: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const LoanRepaymentSchema = new Schema({
  loan: { type: Schema.Types.ObjectId, ref: "Loans", required: true },
  repaymentId: { type: String, required: true, unique: true, default: uuidv4 },
  installmentNumber: { type: Number },
  amount: { type: Number, required: true },
  principalPaid: { type: Number, required: true },
  interestPaid: { type: Number, required: true },
  lateFee: { type: Number, default: 0 },
  currency: { type: String, required: true },
  paymentMethod: {
    type: String,
    enum: ["auto_debit", "manual_transfer", "wallet", "card", "bank_transfer"],
    required: true,
  },
  transaction: { type: Schema.Types.ObjectId, ref: "Transactions" },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "reversed"],
    default: "pending",
  },
  isEarlyRepayment: { type: Boolean, default: false },
  earlyRepaymentPenalty: { type: Number },
  remainingBalance: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  scheduledDate: { type: Date },
  failureReason: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const CollateralSchema = new Schema({
  loan: { type: Schema.Types.ObjectId, ref: "Loans", required: true },
  collateralType: {
    type: String,
    enum: [
      "property",
      "vehicle",
      "securities",
      "equipment",
      "inventory",
      "other",
    ],
    required: true,
  },
  description: { type: String, required: true },
  estimatedValue: { type: Number, required: true },
  currency: { type: String, required: true, default: "USD" },
  appraisalValue: { type: Number },
  appraisalDate: { type: Date },
  appraisedBy: { type: String },
  documents: [
    {
      type: { type: String, required: true },
      filename: { type: String, required: true },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  ownership: {
    ownerName: { type: String, required: true },
    registrationNumber: { type: String },
    location: { type: String },
  },
  status: {
    type: String,
    enum: ["active", "released", "seized", "liquidated"],
    default: "active",
  },
  releasedAt: { type: Date },
  seizedAt: { type: Date },
  seizedReason: { type: String },
  liquidationValue: { type: Number },
  liquidatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
LoanSchema.index({ user: 1, status: 1 });
LoanApplicationSchema.index({ user: 1, status: 1 });
LoanRepaymentSchema.index({ loan: 1, paymentDate: -1 });
CollateralSchema.index({ loan: 1 });

export const Loans = mongoose.model("Loans", LoanSchema);
export const LoanApplications = mongoose.model(
  "LoanApplications",
  LoanApplicationSchema,
);
export const CreditAssessments = mongoose.model(
  "CreditAssessments",
  CreditAssessmentSchema,
);
export const RepaymentSchedules = mongoose.model(
  "RepaymentSchedules",
  RepaymentScheduleSchema,
);
export const LoanRepayments = mongoose.model(
  "LoanRepayments",
  LoanRepaymentSchema,
);
export const Collaterals = mongoose.model("Collaterals", CollateralSchema);

export default Loans;
