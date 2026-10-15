// ============================================================================
// NORDI REMITTANCE — PRIVACY POLICY DATA MODULE
// Exports typed privacy policy data loaded from structured JSON.
// The full legal text lives in privacy-policy.json — do NOT hardcode here.
// ============================================================================

import privacyJson from "./privacy-policy.json" with { type: "json" };
import type { LegalDocumentData } from "./terms.ts";

export const PRIVACY_POLICY: LegalDocumentData = privacyJson as LegalDocumentData;
export default PRIVACY_POLICY;