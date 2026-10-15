// ============================================================================
// LEGAL DOCUMENTS SEEDER — Terms & Conditions and Privacy Policy
// ============================================================================
// Automatically seeds structured legal documents from JSON definitions into MongoDB.
// Idempotent: Only seeds or updates when the document does not exist or content/version has changed.
// ============================================================================

import crypto from "crypto";
import mongoose from "mongoose";
import { LegalDocuments, PolicyVersions } from "../modules/legal/legal-reports.model.js";
import termsData from "../core/data/terms.json" with { type: "json" };
import privacyData from "../core/data/privacy-policy.json" with { type: "json" };

interface RawLegalSection {
  id: string;
  sectionNumber?: string | null;
  title: string;
  content: string;
}

interface RawLegalDocument {
  documentId?: string;
  title: string;
  documentType: "terms" | "privacy";
  version: string;
  effectiveDate?: string;
  lastUpdated?: string;
  header?: Record<string, string>;
  summary?: string;
  sections?: RawLegalSection[];
  content?: string;
  requiresConsent?: boolean;
}

/**
 * Parses dates safely without throwing Mongo CastError on template placeholders like "[INSERT DATE]"
 */
function parseSafeDate(rawDate?: string, fallback: Date = new Date("2026-01-01T00:00:00.000Z")): Date {
  if (!rawDate || typeof rawDate !== "string" || rawDate.includes("[INSERT")) {
    return fallback;
  }
  const parsed = new Date(rawDate);
  return isNaN(parsed.getTime()) ? fallback : parsed;
}

/**
 * Generates a stable sha256 checksum of the legal document payload to detect content changes
 */
function computeChecksum(raw: RawLegalDocument): string {
  const normalized = {
    title: raw.title,
    documentType: raw.documentType,
    version: raw.version,
    summary: raw.summary || "",
    sections: (raw.sections || []).map((s) => ({
      id: s.id,
      sectionNumber: s.sectionNumber ?? null,
      title: s.title,
      content: s.content,
    })),
  };
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

/**
 * Seeds or updates a single legal document if changed
 */
async function seedSingleLegalDoc(raw: RawLegalDocument): Promise<void> {
  const docType = raw.documentType;
  const currentChecksum = computeChecksum(raw);
  const effectiveDate = parseSafeDate(raw.effectiveDate, new Date("2026-01-01T00:00:00.000Z"));
  const lastUpdated = parseSafeDate(raw.lastUpdated, new Date("2026-10-14T00:00:00.000Z"));

  // Build full plain-text content from structured sections if not explicitly provided
  const combinedContent =
    raw.content ||
    (raw.sections && raw.sections.length > 0
      ? raw.sections.map((s) => `${s.title}\n\n${s.content}`).join("\n\n")
      : raw.summary || "");

  // Check if active document exists in the database
  const existingDoc = await LegalDocuments.findOne({
    documentType: docType,
    status: "active",
  }).sort({ effectiveDate: -1 });

  if (existingDoc) {
    const isChecksumIdentical = existingDoc.checksum === currentChecksum;
    const isVersionIdentical = existingDoc.version === raw.version;

    if (isChecksumIdentical && isVersionIdentical) {
      console.log(`ℹ️  Legal document [${docType}] is up to date (version: ${existingDoc.version}). Skipping.`);
      return;
    }

    console.log(`🔄 Legal document [${docType}] has changed (db v${existingDoc.version} -> json v${raw.version}). Updating...`);

    // Archive the older version
    await LegalDocuments.updateMany(
      { documentType: docType, status: "active" },
      { $set: { status: "archived", updatedAt: new Date() } }
    );
  } else {
    console.log(`🌱 Seeding initial legal document [${docType}] (version: ${raw.version})...`);
  }

  // Create new active document
  const newDocument = new LegalDocuments({
    documentId: raw.documentId || `${docType}-nordi-v${raw.version.replace(/\./g, "-")}`,
    title: raw.title,
    documentType: docType,
    content: combinedContent,
    summary: raw.summary,
    header: raw.header,
    sections: raw.sections || [],
    version: raw.version,
    effectiveDate,
    lastUpdated,
    requiresConsent: raw.requiresConsent !== false,
    status: "active",
    checksum: currentChecksum,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const savedDoc = await newDocument.save();

  // Record in PolicyVersions history
  await PolicyVersions.create({
    documentType: docType,
    version: raw.version,
    documentId: savedDoc._id,
    changes: existingDoc
      ? `Updated from version ${existingDoc.version} to ${raw.version}`
      : `Initial seeding of version ${raw.version}`,
    effectiveDate,
    createdAt: new Date(),
  });

  console.log(`✅ Legal document [${docType}] successfully seeded & active (id: ${savedDoc.documentId})`);
}

/**
 * Seed all legal documents (Terms & Conditions, Privacy Policy)
 * Runs on server startup alongside seedAdmin
 */
export async function seedLegalDocuments(): Promise<void> {
  try {
    console.log("📜 Starting Legal Documents Seeding...");

    // Seed Terms and Conditions
    await seedSingleLegalDoc({
      ...(termsData as unknown as RawLegalDocument),
      documentType: "terms",
      version: termsData.version || "1.0",
    });

    // Seed Privacy Policy
    await seedSingleLegalDoc({
      ...(privacyData as unknown as RawLegalDocument),
      documentType: "privacy",
      version: privacyData.version || "1.0",
    });

    console.log("✅ Legal Documents Seeding completed.");
  } catch (error: any) {
    console.error("❌ Failed to seed legal documents:", error?.message || error);
    // Don't crash server startup if seeding has a transient error
  }
}

// Standalone execution support
if (process.argv[1]?.includes("seedLegal")) {
  const { connectDB, disconnectDB } = await import("../config/dbconfig.js");
  await connectDB();
  await seedLegalDocuments();
  await disconnectDB();
  process.exit(0);
}

export default {
  seedLegalDocuments,
};
