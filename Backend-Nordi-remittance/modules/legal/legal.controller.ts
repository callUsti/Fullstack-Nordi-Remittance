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
} from "./legal-reports.model.js";
import Users from "../users/users.model.js";
import Transactions from "../transactions/transactions.model.js";
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
};
