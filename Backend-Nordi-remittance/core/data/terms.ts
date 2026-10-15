// ============================================================================
// NORDI REMITTANCE — TERMS & CONDITIONS DATA MODULE
// Exports typed terms data loaded from structured JSON.
// The full legal text lives in terms.json — do NOT hardcode here.
// ============================================================================

import termsJson from "./terms.json" with { type: "json" };

export interface LegalSection {
  id: string;
  sectionNumber: string | null;
  title: string;
  content: string;
}

export interface LegalDocumentHeader {
  [key: string]: string;
}

export interface LegalDocumentData {
  documentId?: string;
  title?: string;
  documentType?: string;
  version?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  header?: LegalDocumentHeader;
  implementationNote?: string;
  summary?: string;
  sections: LegalSection[];
  content?: string;
}

export const TERMS_AND_CONDITIONS: LegalDocumentData = termsJson as LegalDocumentData;
export default TERMS_AND_CONDITIONS;