import { ApiEndpoints } from "../../core/api/endpoint";
// ============================================================================
// LEGAL API - Disputes, reports, and legal compliance endpoints
// ============================================================================

import apiClient, { ApiResponse, PaginatedResponse } from "../../core/api/client";


// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface DisputeFilters {
  status?: DisputeStatus;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateDisputeRequest {
  transactionId: UUID;
  type: "unauthorized" | "not_received" | "wrong_amount" | "duplicate" | "other";
  description: string;
  amount?: number;
  documents?: UUID[];
}

export interface ReportFilters {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// LEGAL API FUNCTIONS
// ============================================================================

export const LegalRepository = {
  // ==========================================================================
  // DISPUTES
  // ==========================================================================

  /**
   * Get all disputes
   */
  getDisputes: async (params?: DisputeFilters): Promise<PaginatedResponse<Dispute>> => {
    const response = await apiClient.get<PaginatedResponse<Dispute>>(ApiEndpoints.legalDisputes, { params });
    return response.data;
  },

  /**
   * Get dispute by ID
   */
  getDisputeById: async (
    disputeId: UUID,
  ): Promise<
    ApiResponse<
      Dispute & {
        transaction: {
          id: UUID;
          reference: string;
          amount: number;
          currency: Currency;
          date: string;
        };
        timeline: Array<{
          status: string;
          message: string;
          timestamp: string;
          actor?: string;
        }>;
        documents: Array<{
          id: UUID;
          name: string;
          url: string;
          uploadedAt: string;
        }>;
      }
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Dispute & {
          transaction: {
            id: UUID;
            reference: string;
            amount: number;
            currency: Currency;
            date: string;
          };
          timeline: Array<{
            status: string;
            message: string;
            timestamp: string;
            actor?: string;
          }>;
          documents: Array<{
            id: UUID;
            name: string;
            url: string;
            uploadedAt: string;
          }>;
        }
      >
    >(ApiEndpoints.legalDispute(disputeId));
    return response.data;
  },

  /**
   * Create a new dispute
   */
  createDispute: async (data: CreateDisputeRequest): Promise<ApiResponse<Dispute>> => {
    const response = await apiClient.post<ApiResponse<Dispute>>(ApiEndpoints.legalDisputes, data);
    return response.data;
  },

  /**
   * Add document to dispute
   */
  addDisputeDocument: async (
    disputeId: UUID,
    file: File,
  ): Promise<
    ApiResponse<{
      id: UUID;
      url: string;
    }>
  > => {
    const formData = new FormData();
    formData.append("document", file);

    const response = await apiClient.post<
      ApiResponse<{
        id: UUID;
        url: string;
      }>
    >(ApiEndpoints.legalDisputeDocuments(disputeId), formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Add comment to dispute
   */
  addDisputeComment: async (
    disputeId: UUID,
    comment: string,
  ): Promise<
    ApiResponse<{
      id: UUID;
      comment: string;
      createdAt: string;
    }>
  > => {
    const response = await apiClient.post<
      ApiResponse<{
        id: UUID;
        comment: string;
        createdAt: string;
      }>
    >(ApiEndpoints.legalDisputeComments(disputeId), { comment });
    return response.data;
  },

  /**
   * Cancel dispute
   */
  cancelDispute: async (disputeId: UUID, reason?: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      ApiEndpoints.legalDisputeCancel(disputeId),
      { reason },
    );
    return response.data;
  },

  // ==========================================================================
  // REPORTS
  // ==========================================================================

  /**
   * Get all reports
   */
  getReports: async (params?: ReportFilters): Promise<PaginatedResponse<AppReport>> => {
    const response = await apiClient.get<PaginatedResponse<AppReport>>(ApiEndpoints.legalReports, { params });
    return response.data;
  },

  /**
   * Get report by ID
   */
  getReportById: async (reportId: UUID): Promise<ApiResponse<AppReport>> => {
    const response = await apiClient.get<ApiResponse<AppReport>>(ApiEndpoints.legalReport(reportId));
    return response.data;
  },

  /**
   * Request account statement
   */
  requestAccountStatement: async (data: {
    accountId: UUID;
    startDate: string;
    endDate: string;
    format: "pdf" | "csv";
  }): Promise<ApiResponse<AppReport>> => {
    const response = await apiClient.post<ApiResponse<AppReport>>(ApiEndpoints.legalReportsStatement, data);
    return response.data;
  },

  /**
   * Request transaction history report
   */
  requestTransactionHistory: async (data: {
    startDate: string;
    endDate: string;
    format: "pdf" | "csv";
    accountId?: UUID;
    type?: string;
  }): Promise<ApiResponse<AppReport>> => {
    const response = await apiClient.post<ApiResponse<AppReport>>(ApiEndpoints.legalReportsHistory, data);
    return response.data;
  },

  /**
   * Request tax report
   */
  requestTaxReport: async (data: { year: number; format: "pdf" | "csv" }): Promise<ApiResponse<AppReport>> => {
    const response = await apiClient.post<ApiResponse<AppReport>>(ApiEndpoints.legalReportsTax, data);
    return response.data;
  },

  /**
   * Download report
   */
  downloadReport: async (
    reportId: UUID,
  ): Promise<
    ApiResponse<{
      downloadUrl: string;
      expiresAt: string;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        downloadUrl: string;
        expiresAt: string;
      }>
    >(ApiEndpoints.legalReportDownload(reportId));
    return response.data;
  },

  // ==========================================================================
  // LEGAL DOCUMENTS
  // ==========================================================================

  /**
   * Get terms and conditions
   */
  getTermsAndConditions: async (): Promise<
    ApiResponse<{
      title?: string;
      summary?: string;
      version: string;
      content: string;
      effectiveDate: string;
      lastUpdated: string;
      header?: Record<string, string>;
      sections?: Array<{ id: string; sectionNumber: string | null; title: string; content: string }>;
      document?: any;
    }>
  > => {
    const response = await apiClient.get<any>(ApiEndpoints.legalTerms);
    const raw = response.data?.data || response.data;
    const doc = raw?.document || raw;
    return {
      success: response.data?.success ?? true,
      message: response.data?.message ?? "Terms retrieved successfully",
      data: {
        title: doc?.title || raw?.title || "Terms and Conditions",
        summary: doc?.summary || raw?.summary,
        version: doc?.version || raw?.version || "1.0",
        content: doc?.content || raw?.content || "",
        effectiveDate: doc?.effectiveDate || raw?.effectiveDate || new Date().toISOString(),
        lastUpdated: doc?.lastUpdated || doc?.updatedAt || raw?.lastUpdated || new Date().toISOString(),
        header: doc?.header || raw?.header,
        sections: doc?.sections || raw?.sections,
        document: doc,
      },
    };
  },

  /**
   * Get privacy policy
   */
  getPrivacyPolicy: async (): Promise<
    ApiResponse<{
      title?: string;
      summary?: string;
      version: string;
      content: string;
      effectiveDate: string;
      lastUpdated: string;
      header?: Record<string, string>;
      sections?: Array<{ id: string; sectionNumber: string | null; title: string; content: string }>;
      document?: any;
    }>
  > => {
    const response = await apiClient.get<any>(ApiEndpoints.legalPrivacy);
    const raw = response.data?.data || response.data;
    const doc = raw?.document || raw;
    return {
      success: response.data?.success ?? true,
      message: response.data?.message ?? "Privacy policy retrieved successfully",
      data: {
        title: doc?.title || raw?.title || "Privacy Policy",
        summary: doc?.summary || raw?.summary,
        version: doc?.version || raw?.version || "1.0",
        content: doc?.content || raw?.content || "",
        effectiveDate: doc?.effectiveDate || raw?.effectiveDate || new Date().toISOString(),
        lastUpdated: doc?.lastUpdated || doc?.updatedAt || raw?.lastUpdated || new Date().toISOString(),
        header: doc?.header || raw?.header,
        sections: doc?.sections || raw?.sections,
        document: doc,
      },
    };
  },

  /**
   * Accept terms
   */
  acceptTerms: async (
    version: string,
    documentType: string = "terms",
  ): Promise<
    ApiResponse<{
      accepted: boolean;
      acceptedAt: string;
    }>
  > => {
    const response = await apiClient.post<
      ApiResponse<{
        accepted: boolean;
        acceptedAt: string;
      }>
    >(ApiEndpoints.legalAcceptTerms, { version, documentType });
    return response.data;
  },

  /**
   * Get regulatory disclosures
   */
  getRegulatoryDisclosures: async (): Promise<
    ApiResponse<
      Array<{
        id: UUID;
        title: string;
        content: string;
        category: string;
        effectiveDate: string;
      }>
    >
  > => {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          id: UUID;
          title: string;
          content: string;
          category: string;
          effectiveDate: string;
        }>
      >
    >(ApiEndpoints.legalDisclosures);
    return response.data;
  },

  // ==========================================================================
  // CONSENT MANAGEMENT
  // ==========================================================================

  /**
   * Get consent status
   */
  getConsentStatus: async (): Promise<
    ApiResponse<{
      termsAccepted: boolean;
      termsVersion?: string;
      termsAcceptedAt?: string;
      privacyAccepted: boolean;
      privacyVersion?: string;
      privacyAcceptedAt?: string;
      marketingConsent: boolean;
      dataProcessingConsent: boolean;
    }>
  > => {
    const response = await apiClient.get<
      ApiResponse<{
        termsAccepted: boolean;
        termsVersion?: string;
        termsAcceptedAt?: string;
        privacyAccepted: boolean;
        privacyVersion?: string;
        privacyAcceptedAt?: string;
        marketingConsent: boolean;
        dataProcessingConsent: boolean;
      }>
    >(ApiEndpoints.legalConsent);
    return response.data;
  },

  /**
   * Update consent
   */
  updateConsent: async (data: {
    marketingConsent?: boolean;
    dataProcessingConsent?: boolean;
  }): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.patch<ApiResponse<{ message: string }>>(ApiEndpoints.legalConsent, data);
    return response.data;
  },

  // ==========================================================================
  // ADMIN DISPUTES & REGULATORY FILINGS (/legal/admin/*)
  // ==========================================================================

  getAdminDisputes: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.legalAdminDisputes, { params });
    return response.data;
  },

  updateAdminDispute: async (claimId: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put<ApiResponse<any>>(ApiEndpoints.legalAdminDispute(claimId), data);
    return response.data;
  },

  getAdminRegulatoryFilings: async (params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(ApiEndpoints.legalAdminRegulatory, { params });
    return response.data;
  },

  createAdminRegulatoryFiling: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(ApiEndpoints.legalAdminRegulatory, data);
    return response.data;
  },

  submitAdminRegulatoryFiling: async (filingId: string, data?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(ApiEndpoints.legalAdminRegulatorySubmit(filingId), data);
    return response.data;
  },
};

export default LegalRepository;
