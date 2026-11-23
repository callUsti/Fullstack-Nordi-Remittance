import mongoose from "mongoose";
import { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../types/index.js";
import {
  LegalDocuments,
  UserConsents,
  Disputes,
  RegulatoryReports,
  PolicyVersions,
  DisputeClaims,
  RegulatoryFilings,
  Statements,
} from "./legal-reports.model.js";
import Users from "../users/users.model.js";
import Transactions from "../transactions/transactions.model.js";
import { Wallets, LedgerEntries } from "../accounts/accounts.model.js";
import {
  buildStatementPdfBuffer,
  buildStatementCsv,
  buildStatementExcelBuffer,
  type StatementExportPayload,
} from "../../core/helpers/pdf.helper.js";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
} from "../../core/helpers/response.helper.js";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from "../../core/errors/AppError.js";
import { queueTemplatedMail } from "../../services/workers.js";
import EmailContentGenerator from "../../core/mail/Mail-content.js";
import { emitToUser } from "../../services/websocket.service.js";
import { WS } from "../../core/constants/ws-events.js";

// Initialize email content generator
const emailGenerator = new EmailContentGenerator();

import termsData from "../../core/data/terms.json" with { type: "json" };
import privacyData from "../../core/data/privacy-policy.json" with { type: "json" };

// ============================================================================
// DEFAULT LEGAL DOCUMENTS
// Loaded from structured JSON data files in core/data/
// ============================================================================
const DEFAULT_LEGAL_DOCUMENTS: Record<string, any> = {
  terms: {
    ...termsData,
    effectiveDate: new Date("2026-01-01T00:00:00Z"),
    requiresConsent: true,
    status: "active",
  },
  privacy: {
    ...privacyData,
    effectiveDate: new Date("2026-01-01T00:00:00Z"),
    requiresConsent: true,
    status: "active",
  },
};

function normalizeDocType(raw: string): "terms" | "privacy" | string {
  const lower = raw.toLowerCase().trim();
  if (
    lower === "privacy" ||
    lower === "privacy_policy" ||
    lower === "privacy-policy"
  ) {
    return "privacy";
  }
  if (
    lower === "terms" ||
    lower === "terms_and_conditions" ||
    lower === "terms-and-services" ||
    lower === "terms-and-conditions"
  ) {
    return "terms";
  }
  return lower;
}

// ============================================================================
// LEGAL DOCUMENTS
// ============================================================================

export async function getLegalDocuments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filter: any = { status: "active" };
    if (req.query.type) filter.documentType = req.query.type;

    let documents = await LegalDocuments.find(filter)
      .select("title documentType version effectiveDate summary")
      .sort({ documentType: 1, effectiveDate: -1 })
      .lean();

    if (documents.length === 0) {
      documents = Object.values(DEFAULT_LEGAL_DOCUMENTS).map((d) => ({
        title: d.title,
        documentType: d.documentType,
        version: d.version,
        effectiveDate: d.effectiveDate,
        summary: d.summary,
      })) as any;
    }

    sendSuccess(res, { documents });
  } catch (error) {
    next(error);
  }
}

export async function getPrivacyPolicy(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let document = await LegalDocuments.findOne({
      documentType: "privacy",
      status: "active",
    })
      .sort({ effectiveDate: -1 })
      .lean();

    if (!document && DEFAULT_LEGAL_DOCUMENTS.privacy) {
      document = DEFAULT_LEGAL_DOCUMENTS.privacy;
    }

    if (!document) throw new NotFoundError("Privacy policy document not found");

    sendSuccess(res, {
      document,
      version: document.version,
      content: document.content || "",
      title: document.title,
      summary: document.summary,
      effectiveDate: document.effectiveDate,
      lastUpdated: (document as any).lastUpdated || (document as any).updatedAt || document.effectiveDate,
      sections: document.sections || [],
      header: (document as any).header,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTermsOfService(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let document = await LegalDocuments.findOne({
      documentType: "terms",
      status: "active",
    })
      .sort({ effectiveDate: -1 })
      .lean();

    if (!document && DEFAULT_LEGAL_DOCUMENTS.terms) {
      document = DEFAULT_LEGAL_DOCUMENTS.terms;
    }

    if (!document) throw new NotFoundError("Terms of service document not found");

    sendSuccess(res, {
      document,
      version: document.version,
      content: document.content || "",
      title: document.title,
      summary: document.summary,
      effectiveDate: document.effectiveDate,
      lastUpdated: (document as any).lastUpdated || (document as any).updatedAt || document.effectiveDate,
      sections: document.sections || [],
      header: (document as any).header,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLegalDocumentById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let rawId = req.params.documentId || req.params.id;
    if (!rawId) {
      const path = req.path || req.originalUrl || "";
      if (path.includes("privacy")) rawId = "privacy";
      else if (path.includes("terms")) rawId = "terms";
      else throw new ValidationError("Document ID or document type is required");
    }

    const docType = normalizeDocType(rawId);

    let document = await LegalDocuments.findOne({
      $or: [
        { documentType: docType, status: "active" },
        { documentId: rawId },
        ...(mongoose.isValidObjectId(rawId) ? [{ _id: rawId }] : []),
      ],
    })
      .sort({ effectiveDate: -1 })
      .lean();

    // Fallback to built-in default document if not yet in database
    if (!document && DEFAULT_LEGAL_DOCUMENTS[docType]) {
      const def = DEFAULT_LEGAL_DOCUMENTS[docType];
      void LegalDocuments.findOneAndUpdate(
        { documentType: def.documentType, status: "active" },
        { $setOnInsert: def },
        { upsert: true, new: true },
      ).catch(() => { });

      document = def as any;
    }

    if (!document) throw new NotFoundError("Document not found");

    sendSuccess(res, {
      document,
      version: document.version,
      content: document.content || "",
      title: document.title,
      summary: document.summary,
      effectiveDate: document.effectiveDate,
      lastUpdated: (document as any).lastUpdated || (document as any).updatedAt || document.effectiveDate,
      sections: document.sections || [],
      header: (document as any).header,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLegalDocumentByType(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawType = req.params.type;
    if (!rawType) {
      throw new ValidationError("Document type is required");
    }

    const docType = normalizeDocType(rawType);

    let document = await LegalDocuments.findOne({
      documentType: docType,
      status: "active",
    })
      .sort({ effectiveDate: -1 })
      .lean();

    if (!document && DEFAULT_LEGAL_DOCUMENTS[docType]) {
      const def = DEFAULT_LEGAL_DOCUMENTS[docType];
      void LegalDocuments.findOneAndUpdate(
        { documentType: def.documentType, status: "active" },
        { $setOnInsert: def },
        { upsert: true, new: true },
      ).catch(() => { });

      document = def as any;
    }

    if (!document) throw new NotFoundError("Document not found");

    sendSuccess(res, {
      document,
      version: document.version,
      content: document.content || "",
      title: document.title,
      summary: document.summary,
      effectiveDate: document.effectiveDate,
      lastUpdated: (document as any).lastUpdated || (document as any).updatedAt || document.effectiveDate,
      sections: document.sections || [],
      header: (document as any).header,
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptTermsDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { version, documentType = "terms" } = req.body;
    const userId = req.user?.userId;

    if (userId) {
      const activeDoc = await LegalDocuments.findOne({
        documentType: normalizeDocType(documentType),
        status: "active",
      }).select("_id version");

      await UserConsents.findOneAndUpdate(
        { user: userId, documentType },
        {
          user: userId,
          document: activeDoc?._id,
          documentType,
          documentVersion: version || activeDoc?.version || "1.0",
          consentType: "explicit",
          accepted: true,
          consentDate: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        },
        { upsert: true, new: true },
      );
    }

    sendSuccess(
      res,
      { accepted: true, acceptedAt: new Date().toISOString() },
      "Terms accepted successfully",
    );
  } catch (error) {
    next(error);
  }
}

export async function createLegalDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const {
      title,
      documentType,
      content,
      summary,
      version,
      effectiveDate,
      requiresConsent,
    } = req.body;

    // Deactivate previous versions
    await LegalDocuments.updateMany(
      { documentType, status: "active" },
      { status: "archived" },
    );

    const document = new LegalDocuments({
      title,
      documentType,
      content,
      summary,
      version,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      requiresConsent: requiresConsent !== false,
      status: "active",
      createdBy: req.user.userId,
    });

    await document.save();

    // Create policy version record
    await PolicyVersions.create({
      documentType,
      version,
      documentId: document._id,
      changes: req.body.changes || "New version published",
      effectiveDate: document.effectiveDate,
      createdBy: req.user.userId,
    });

    sendCreated(res, { document }, "Legal document created");
  } catch (error) {
    next(error);
  }
}

export async function updateLegalDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { id } = req.params;
    const { title, content, summary, status } = req.body;

    const document = await LegalDocuments.findById(id);
    if (!document) throw new NotFoundError("Document not found");

    if (title) document.title = title;
    if (content) document.content = content;
    if (summary) document.summary = summary;
    if (status) document.status = status;

    document.updatedBy = req.user.userId;
    await document.save();

    sendSuccess(res, { document }, "Document updated");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// USER CONSENTS
// ============================================================================

export async function getUserConsents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const consents = await UserConsents.find({ user: req.user.userId })
      .populate("document", "title documentType version")
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, { consents });
  } catch (error) {
    next(error);
  }
}

export async function recordConsent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { documentId, consentType, accepted } = req.body;

    const document = await LegalDocuments.findById(documentId);
    if (!document) throw new NotFoundError("Document not found");

    // Check if consent already exists
    const existingConsent = await UserConsents.findOne({
      user: req.user.userId,
      document: documentId,
    });

    if (existingConsent) {
      existingConsent.accepted = accepted;
      existingConsent.consentDate = new Date();
      existingConsent.ipAddress = req.ip || "";
      existingConsent.userAgent = req.headers["user-agent"] || "";
      await existingConsent.save();

      sendSuccess(res, { consent: existingConsent }, "Consent updated");
      return;
    }

    const consent = new UserConsents({
      user: req.user.userId,
      document: documentId,
      documentType: document.documentType,
      documentVersion: document.version,
      consentType: consentType || "explicit",
      accepted,
      consentDate: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await consent.save();

    sendCreated(res, { consent }, "Consent recorded");
  } catch (error) {
    next(error);
  }
}

export async function withdrawConsent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { documentId } = req.params;

    const consent = await UserConsents.findOne({
      user: req.user.userId,
      document: documentId,
    });

    if (!consent) throw new NotFoundError("Consent not found");

    consent.accepted = false;
    consent.withdrawnAt = new Date();
    await consent.save();

    sendSuccess(res, { consent }, "Consent withdrawn");
  } catch (error) {
    next(error);
  }
}

export async function checkRequiredConsents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    // Get all active documents requiring consent
    const requiredDocuments = await LegalDocuments.find({
      status: "active",
      requiresConsent: true,
    }).lean();

    // Get user's consents
    const userConsents = await UserConsents.find({
      user: req.user.userId,
      accepted: true,
    }).lean();

    const consentedDocIds = new Set(
      userConsents.map((c) => c.document.toString()),
    );

    const pendingConsents = requiredDocuments.filter(
      (doc) => !consentedDocIds.has(doc._id.toString()),
    );

    sendSuccess(res, {
      allConsented: pendingConsents.length === 0,
      pendingConsents: pendingConsents.map((doc) => ({
        id: doc._id,
        title: doc.title,
        type: doc.documentType,
        version: doc.version,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// DISPUTE CLAIMS
// ============================================================================

export async function getDisputeClaims(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const claims = await DisputeClaims.find({ user: req.user.userId })
      .populate("transaction", "reference amount type")
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(res, { claims });
  } catch (error) {
    next(error);
  }
}

export async function createDisputeClaim(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const {
      transactionId,
      reason,
      description,
      expectedResolution,
      attachments,
    } = req.body;

    // Verify transaction belongs to user
    const transaction = await Transactions.findOne({
      _id: transactionId,
      $or: [{ sender: req.user.userId }, { recipient: req.user.userId }],
    });

    if (!transaction) throw new NotFoundError("Transaction not found");

    // Check if dispute already exists
    const existingDispute = await DisputeClaims.findOne({
      transaction: transactionId,
      status: { $nin: ["closed", "resolved", "rejected"] },
    });

    if (existingDispute) {
      throw new ValidationError(
        "A dispute already exists for this transaction",
      );
    }

    const claim = new DisputeClaims({
      user: req.user.userId,
      transaction: transactionId,
      transactionAmount: transaction.amount,
      reason,
      description,
      expectedResolution,
      attachments: attachments || [],
      status: "submitted",
      priority: "medium",
      timeline: [
        {
          action: "submitted",
          timestamp: new Date(),
          notes: "Dispute claim submitted",
        },
      ],
    });

    await claim.save();

    // Notify user using template
    const user = await Users.findById(req.user.userId);
    if (user) {
      const emailContent = emailGenerator.disputeClaimEmail({
        userName: `${user.firstName} ${user.lastName}`,
        claimId: claim.claimId || claim._id.toString(),
        transactionId:
          transaction.referenceNumber || (transaction._id as any).toString(),
        amount: String(transaction.amount),
        currency: transaction.currency || "USD",
        claimType: claim.claimType,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      });

      queueTemplatedMail(String(user.email), emailContent).catch(console.error);
    }

    emitToUser(req.user!.userId, WS.DISPUTE.CREATED, {
      claimId: claim.claimId || claim._id,
      status: claim.status,
      timestamp: new Date().toISOString(),
    });

    sendCreated(
      res,
      {
        claim: {
          id: claim._id,
          claimId: claim.claimId,
          status: claim.status,
          createdAt: claim.createdAt,
        },
      },
      "Dispute claim submitted successfully",
    );
  } catch (error) {
    next(error);
  }
}

export async function getDisputeClaimById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { id } = req.params;

    const claim = await DisputeClaims.findOne({
      $or: [{ _id: id }, { claimId: id }],
      user: req.user.userId,
    })
      .populate("transaction")
      .lean();

    if (!claim) throw new NotFoundError("Dispute claim not found");

    sendSuccess(res, { claim });
  } catch (error) {
    next(error);
  }
}

export async function addDisputeComment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { id } = req.params;
    const { comment, attachments } = req.body;

    const claim = await DisputeClaims.findOne({
      $or: [{ _id: id }, { claimId: id }],
      user: req.user.userId,
    });

    if (!claim) throw new NotFoundError("Dispute claim not found");

    if (claim.status === "closed" || claim.status === "resolved") {
      throw new ValidationError("Cannot add comments to closed disputes");
    }

    claim.timeline.push({
      action: "comment_added",
      timestamp: new Date(),
      notes: comment,
      performedBy: req.user.userId,
      attachments,
    });

    await claim.save();

    sendSuccess(res, { claim }, "Comment added");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN: DISPUTE MANAGEMENT
// ============================================================================

export async function getAllDisputeClaims(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const [claims, total] = await Promise.all([
      DisputeClaims.find(filter)
        .populate("user", "firstName lastName email")
        .populate("transaction", "reference amount type")
        .populate("assignedTo", "firstName lastName")
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DisputeClaims.countDocuments(filter),
    ]);

    sendPaginated(res, claims, { page, limit, total });
  } catch (error) {
    next(error);
  }
}

export async function updateDisputeClaim(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { id } = req.params;
    const { status, priority, assignedTo, resolution, refundAmount, notes } =
      req.body;

    const claim = await DisputeClaims.findById(id);
    if (!claim) throw new NotFoundError("Dispute claim not found");

    const timelineEntry: any = {
      action: "status_updated",
      timestamp: new Date(),
      performedBy: req.user.userId,
      notes: notes || `Status changed to ${status}`,
    };

    if (status) {
      claim.status = status;

      if (status === "resolved" || status === "closed") {
        claim.resolution = resolution;
        claim.closedAt = new Date();

        if (refundAmount) {
          claim.refundAmount = refundAmount;
          // TODO: Process refund
        }
      }
    }

    if (priority) claim.priority = priority;
    if (assignedTo) claim.assignedTo = assignedTo;

    claim.timeline.push(timelineEntry);
    await claim.save();

    // Notify user of update using template
    const user = await Users.findById(claim.user);
    if (user) {
      const emailContent = emailGenerator.disputeClaimEmail({
        userName: `${user.firstName} ${user.lastName}`,
        claimId: claim.claimId || claim._id.toString(),
        transactionId: claim.transaction?.toString() || "N/A",
        amount: String(claim.amount || 0),
        currency: claim.currency || "USD",
        claimType: claim.claimType,
        status: status as
          | "submitted"
          | "under_review"
          | "resolved"
          | "rejected",
        resolution: resolution || undefined,
        updatedAt: new Date().toISOString(),
      });

      queueTemplatedMail(String(user.email), emailContent).catch(console.error);
    }

    emitToUser(String(claim.user), WS.DISPUTE.STATUS_UPDATED, {
      claimId: claim.claimId || claim._id,
      status: claim.status,
      resolution: claim.resolution,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(res, { claim }, "Dispute claim updated");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// REGULATORY FILINGS
// ============================================================================

export async function getRegulatoryFilings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.type) filter.filingType = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const [filings, total] = await Promise.all([
      RegulatoryFilings.find(filter)
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RegulatoryFilings.countDocuments(filter),
    ]);

    sendPaginated(res, filings, { page, limit, total });
  } catch (error) {
    next(error);
  }
}

export async function createRegulatoryFiling(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const {
      filingType,
      title,
      description,
      periodStart,
      periodEnd,
      data,
      attachments,
    } = req.body;

    const filing = new RegulatoryFilings({
      filingType,
      title,
      description,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      data: data || {},
      attachments: attachments || [],
      status: "draft",
      createdBy: req.user.userId,
    });

    await filing.save();

    sendCreated(res, { filing }, "Regulatory filing created");
  } catch (error) {
    next(error);
  }
}

export async function submitRegulatoryFiling(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { id } = req.params;

    const filing = await RegulatoryFilings.findById(id);
    if (!filing) throw new NotFoundError("Filing not found");

    if (filing.status !== "pending" && filing.status !== "in_progress") {
      throw new ValidationError("Filing has already been submitted");
    }

    filing.status = "submitted";
    filing.submittedAt = new Date();
    filing.submittedBy = req.user.userId;
    await filing.save();

    sendSuccess(res, { filing }, "Filing submitted");
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// POLICY VERSIONS
// ============================================================================

export async function getPolicyVersions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");

    const { type } = req.query;

    const filter: any = {};
    if (type) filter.documentType = type;

    const versions = await PolicyVersions.find(filter)
      .sort({ effectiveDate: -1 })
      .lean();

    sendSuccess(res, { versions });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ACCOUNT STATEMENTS & REPORTS (PDF / CSV / EXCEL)
// ============================================================================

async function buildUserStatementPayload(
  userId: string,
  opts: { accountId?: string; startDate?: string; endDate?: string; title?: string; type?: string },
): Promise<{ payload: StatementExportPayload; wallet: any; txIds: any[]; start: Date; end: Date }> {
  const user: any = await Users.findById(userId).select("firstName lastName email").lean();
  const accountHolder = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Account Holder";

  const wallet: any = opts.accountId && mongoose.Types.ObjectId.isValid(opts.accountId)
    ? await Wallets.findOne({ _id: opts.accountId, user: userId }).lean()
    : await Wallets.findOne({ user: userId }).sort({ isPrimary: -1 }).lean();

  const start = opts.startDate ? new Date(opts.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = opts.endDate ? new Date(opts.endDate) : new Date();
  if (opts.endDate && opts.endDate.length <= 10) {
    end.setHours(23, 59, 59, 999);
  }

  const txFilter: Record<string, any> = {
    initiatedBy: userId,
    createdAt: { $gte: start, $lte: end },
  };
  if (opts.accountId && wallet) txFilter.wallet = wallet._id;
  if (opts.type && opts.type !== "all") txFilter.type = opts.type;

  const txDocs: any[] = await Transactions.find(txFilter).sort({ createdAt: -1 }).limit(500).lean();

  let totalCredits = 0;
  let totalDebits = 0;
  const rows = txDocs.map((tx) => {
    const meta = tx.meta && typeof tx.meta === "object" ? tx.meta : {};
    const rawType = String(tx.type || "transfer").toLowerCase();
    const isCredit = rawType === "credit" || rawType === "deposit" || rawType === "refund";
    const amt = Math.abs(Number(tx.amount) || 0);
    if (isCredit) totalCredits += amt;
    else totalDebits += amt;

    return {
      date: tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 16).replace("T", " ") : "",
      reference: tx.referenceNumber || String(tx._id),
      senderBank: meta.senderBankName || meta.senderBank || tx.recipientBankName || meta.bankName || "Nordi Bank",
      type: tx.transferType ? `${tx.type} (${tx.transferType})` : String(tx.type || "transfer"),
      purpose: meta.purpose || tx.description || tx.category || "Transfer",
      amount: isCredit ? amt : -amt,
      currency: tx.currency || "USD",
      status: tx.status || "completed",
    };
  });

  // Fallback to ledger entries if wallet has ledger entries and no Transactions matched
  if (rows.length === 0 && wallet) {
    const ledgerDocs: any[] = await LedgerEntries.find({
      wallet: wallet._id,
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    for (const entry of ledgerDocs) {
      const isCredit = entry.entryType === "credit";
      const amt = Math.abs(Number(entry.amount) || 0);
      if (isCredit) totalCredits += amt;
      else totalDebits += amt;
      rows.push({
        date: entry.createdAt ? new Date(entry.createdAt).toISOString().slice(0, 16).replace("T", " ") : "",
        reference: String(entry.transaction || entry._id).slice(-10),
        senderBank: "Nordi Bank",
        type: entry.entryType || "entry",
        purpose: entry.description || "Account Entry",
        amount: isCredit ? amt : -amt,
        currency: entry.currency || "USD",
        status: "completed",
      });
    }
  }

  const walletBalances = wallet?.balances instanceof Map
    ? Object.fromEntries(wallet.balances)
    : (wallet?.balances || {});
  const primaryCurrency = Object.keys(walletBalances)[0] || "USD";
  const closingBalance = Number(walletBalances[primaryCurrency] || 0);
  const openingBalance = closingBalance - totalCredits + totalDebits;

  return {
    wallet,
    txIds: txDocs.map((t) => t._id),
    start,
    end,
    payload: {
      title: opts.title || "Official Account Statement",
      accountHolder,
      accountLabel: wallet?.walletType ? `${String(wallet.walletType).replace("_", " ").toUpperCase()} Account` : "Primary Account",
      accountNumber: wallet?.walletNumber || "All Accounts",
      currency: primaryCurrency,
      periodLabel: `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
      openingBalance,
      closingBalance,
      totalCredits,
      totalDebits,
      rows,
    },
  };
}

async function sendExportResponse(
  res: Response,
  format: string,
  filenameBase: string,
  payload: StatementExportPayload,
): Promise<void> {
  const fmt = (format || "pdf").toLowerCase();
  if (fmt === "csv") {
    const csv = buildStatementCsv(payload);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.csv"`);
    res.send(csv);
    return;
  }
  if (fmt === "excel" || fmt === "xlsx") {
    const xlsxBuf = await buildStatementExcelBuffer(payload);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.xlsx"`);
    res.send(xlsxBuf);
    return;
  }
  const pdfBuf = buildStatementPdfBuffer(payload);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.pdf"`);
  res.send(pdfBuf);
}

export async function getReports(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const docs = await Statements.find({ user: req.user.userId, isArchived: false })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    const reports = docs.map((d: any) => ({
      id: d.statementId || String(d._id),
      _id: d._id,
      type: d.statementType || "custom",
      format: d.fileFormat || "pdf",
      startDate: d.startDate,
      endDate: d.endDate,
      currency: d.currency,
      downloadCount: d.downloadCount || 0,
      createdAt: d.createdAt,
      downloadUrl: `/legal/reports/${d.statementId || d._id}/file`,
    }));

    sendPaginated(res, reports, { page: 1, limit: 25, total: reports.length });
  } catch (error) {
    next(error);
  }
}

export async function getReportById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { reportId } = req.params;
    const doc: any = await Statements.findOne({
      user: req.user.userId,
      $or: [
        { statementId: reportId },
        ...(mongoose.Types.ObjectId.isValid(String(reportId)) ? [{ _id: reportId }] : []),
      ],
    }).lean();
    if (!doc) throw new NotFoundError("Report not found");
    sendSuccess(res, { ...doc, id: doc.statementId || String(doc._id) });
  } catch (error) {
    next(error);
  }
}

export async function requestAccountStatement(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { accountId, startDate, endDate, format = "pdf" } = req.body;
    const normalizedFormat = format === "xlsx" ? "excel" : ["pdf", "csv", "excel"].includes(format) ? format : "pdf";

    const built = await buildUserStatementPayload(req.user.userId, {
      accountId,
      startDate,
      endDate,
      title: "Account Statement",
    });

    const walletId = built.wallet?._id || new mongoose.Types.ObjectId();
    const statement = await Statements.create({
      user: req.user.userId,
      wallet: walletId,
      statementType: "custom",
      startDate: built.start,
      endDate: built.end,
      currency: built.payload.currency,
      openingBalance: built.payload.openingBalance,
      closingBalance: built.payload.closingBalance,
      totalCredits: built.payload.totalCredits,
      totalDebits: built.payload.totalDebits,
      transactions: built.txIds,
      fileFormat: normalizedFormat,
    });

    sendCreated(res, {
      id: statement.statementId,
      statementId: statement.statementId,
      format: normalizedFormat,
      startDate: built.start,
      endDate: built.end,
      downloadUrl: `/legal/reports/${statement.statementId}/file`,
    }, "Statement generated successfully");
  } catch (error) {
    next(error);
  }
}

export async function requestTransactionHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { accountId, startDate, endDate, format = "pdf" } = req.body;
    const normalizedFormat = format === "xlsx" ? "excel" : ["pdf", "csv", "excel"].includes(format) ? format : "pdf";

    const built = await buildUserStatementPayload(req.user.userId, {
      accountId,
      startDate,
      endDate,
      title: "Transaction History Statement",
    });

    const walletId = built.wallet?._id || new mongoose.Types.ObjectId();
    const statement = await Statements.create({
      user: req.user.userId,
      wallet: walletId,
      statementType: "custom",
      startDate: built.start,
      endDate: built.end,
      currency: built.payload.currency,
      openingBalance: built.payload.openingBalance,
      closingBalance: built.payload.closingBalance,
      totalCredits: built.payload.totalCredits,
      totalDebits: built.payload.totalDebits,
      transactions: built.txIds,
      fileFormat: normalizedFormat,
    });

    sendCreated(res, {
      id: statement.statementId,
      statementId: statement.statementId,
      format: normalizedFormat,
      startDate: built.start,
      endDate: built.end,
      downloadUrl: `/legal/reports/${statement.statementId}/file`,
    }, "Transaction history report generated successfully");
  } catch (error) {
    next(error);
  }
}

export async function downloadReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { reportId } = req.params;
    const doc: any = await Statements.findOne({
      user: req.user.userId,
      $or: [
        { statementId: reportId },
        ...(mongoose.Types.ObjectId.isValid(String(reportId)) ? [{ _id: reportId }] : []),
      ],
    }).lean();
    if (!doc) throw new NotFoundError("Report not found");

    sendSuccess(res, {
      downloadUrl: `/legal/reports/${doc.statementId || doc._id}/file`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadStatementFile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { reportId } = req.params;
    const doc: any = await Statements.findOne({
      user: req.user.userId,
      $or: [
        { statementId: reportId },
        ...(mongoose.Types.ObjectId.isValid(String(reportId)) ? [{ _id: reportId }] : []),
      ],
    });
    if (!doc) throw new NotFoundError("Statement not found");

    doc.downloadCount = (doc.downloadCount || 0) + 1;
    doc.lastDownloadedAt = new Date();
    await doc.save();

    const built = await buildUserStatementPayload(req.user.userId, {
      accountId: doc.wallet ? String(doc.wallet) : undefined,
      startDate: doc.startDate?.toISOString(),
      endDate: doc.endDate?.toISOString(),
      title: "Official Account Statement",
    });

    await sendExportResponse(
      res,
      doc.fileFormat || "pdf",
      `Nordi-Statement-${new Date().toISOString().slice(0, 10)}`,
      built.payload,
    );
  } catch (error) {
    next(error);
  }
}

export async function exportStatementDirect(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Authentication required");
    const { accountId, startDate, endDate, format = "pdf", type } = req.query as Record<string, string>;

    const built = await buildUserStatementPayload(req.user.userId, {
      accountId,
      startDate,
      endDate,
      type,
      title: accountId ? "Official Account Statement" : "Transaction Statement",
    });

    // Save statement history record cleanly in background (when a wallet exists)
    if (built.wallet?._id) {
      const normalizedFormat = format === "xlsx" ? "excel" : ["pdf", "csv", "excel"].includes(format) ? format : "pdf";
      Statements.create({
        user: req.user.userId,
        wallet: built.wallet._id,
        statementType: "custom",
        startDate: built.start,
        endDate: built.end,
        currency: built.payload.currency,
        openingBalance: built.payload.openingBalance,
        closingBalance: built.payload.closingBalance,
        totalCredits: built.payload.totalCredits,
        totalDebits: built.payload.totalDebits,
        transactions: built.txIds,
        fileFormat: normalizedFormat,
        downloadCount: 1,
        lastDownloadedAt: new Date(),
      }).catch(() => {});
    }

    await sendExportResponse(
      res,
      format,
      `Nordi-Statement-${new Date().toISOString().slice(0, 10)}`,
      built.payload,
    );
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  getLegalDocuments,
  getLegalDocumentById,
  getLegalDocumentByType,
  getPrivacyPolicy,
  getTermsOfService,
  acceptTermsDocument,
  createLegalDocument,
  updateLegalDocument,
  getUserConsents,
  recordConsent,
  withdrawConsent,
  checkRequiredConsents,
  getDisputeClaims,
  createDisputeClaim,
  getDisputeClaimById,
  addDisputeComment,
  getAllDisputeClaims,
  updateDisputeClaim,
  getRegulatoryFilings,
  createRegulatoryFiling,
  submitRegulatoryFiling,
  getPolicyVersions,
  getReports,
  getReportById,
  requestAccountStatement,
  requestTransactionHistory,
  downloadReport,
  downloadStatementFile,
  exportStatementDirect,
};
