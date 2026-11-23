import { useState, useMemo, useCallback } from "react";
import {
  useAdminLoanApplications,
  useReviewLoanApplication,
  useDisburseAdminLoan,
} from "@hooks/api-queries/useLoans";
import { applyFilterPipeline, textSearchFilter, enumFilter } from "@core/algo/filter";
import { multiKeySort } from "@core/algo/sort";
import { paginate, getPageNumbers } from "@core/algo/pagination";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// useLoansManagement — Admin loan applications: list, filter, stats & actions
// ============================================================================

export type LoanStatusFilter = "all" | "submitted" | "under_review" | "approved" | "rejected" | "cancelled" | "active" | "overdue";
export type LoanTypeFilter = "all" | "personal" | "business" | "mortgage" | "education" | "auto";

const PAGE_SIZE = 20;

export function useLoansManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<LoanTypeFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Fetch all admin loan applications (large page to allow client-side filtering)
  const { data: applicationsRaw, isLoading, refetch } = useAdminLoanApplications({ limit: 500 });
  const reviewMutation = useReviewLoanApplication();
  const disburseMutation = useDisburseAdminLoan();

  // --- Normalize raw application data (backend populates user as { firstName, lastName, email }) ---
  const rawLoans = useMemo(() => {
    const outer: any = applicationsRaw || {};
    const raw: any[] = Array.isArray(outer)
      ? outer
      : Array.isArray(outer?.data?.data)
        ? outer.data.data
        : Array.isArray(outer?.data)
          ? outer.data
          : outer?.applications || [];

    return raw.map((a: any) => {
      const loanObj = a.loan && typeof a.loan === "object" ? a.loan : null;
      const loanId = loanObj?._id || loanObj?.loanId || (typeof a.loan === "string" ? a.loan : "");
      const loanStatus = loanObj?.status || "";
      const isDisbursed = loanStatus === "active" || loanStatus === "paid" || loanStatus === "defaulted";
      const loanConfig = a.loanConfig || a.user?.loanConfig || {
        loanSuspended: false,
        defaultFeePercentPerDefault: 2.5,
        customMaxLoanAmount: null,
      };
      return {
        id: a._id || a.applicationId || a.id || "",
        applicationId: a.applicationId || a._id || "",
        loanId,
        loanStatus,
        applicant:
          a.user?.firstName && a.user?.lastName
            ? `${a.user.firstName} ${a.user.lastName}`
            : a.borrowerName || a.userName || "Applicant",
        email: a.user?.email || a.email || "",
        userId: a.user?._id || a.user?.userId || a.user || "",
        kycStatus: a.user?.kycStatus || "approved",
        type: a.loanType || a.type || "personal",
        amount: a.requestedAmount || a.approvedAmount || a.principalAmount || a.amount || 0,
        approvedAmount: a.approvedAmount || loanObj?.principalAmount || 0,
        interestRate: loanObj?.interestRate ?? a.interestRate ?? 10,
        term: loanObj?.term ?? a.term ?? 12,
        monthlyPayment:
          loanObj?.monthlyPayment ??
          a.monthlyPayment ??
          Math.round(((a.approvedAmount || a.requestedAmount || 0) / Math.max(1, a.term || 12)) * 100) / 100,
        outstanding:
          loanObj?.outstandingBalance ??
          a.outstandingBalance ??
          a.approvedAmount ??
          a.requestedAmount ??
          0,
        defaultCount:
          (Number(loanObj?.defaultCount || 0) + Number(loanObj?.missedPayments || 0)) ||
          Number(a.defaultCount || 0),
        defaultFeePercentage:
          loanObj?.defaultFeePercentage ??
          loanConfig?.defaultFeePercentPerDefault ??
          a.defaultFeePercentage ??
          2.5,
        loanConfig,
        userWallets: Array.isArray(a.userWallets) ? a.userWallets : [],
        volumeMetrics: a.volumeMetrics || null,
        isThirdParty: Boolean(a.isThirdParty),
        applicantType: a.applicantType || (a.isThirdParty ? "third_party" : "self"),
        thirdPartyApplicant: a.thirdPartyApplicant || null,
        documents: Array.isArray(a.documents) ? a.documents : [],
        otpVerified: Boolean(a.otpVerified),
        status: a.status || "submitted",
        appliedDate: a.createdAt || a.submittedAt || "",
        reviewedAt: a.reviewedAt || "",
        purpose: a.purpose || "",
        rejectionReason: a.rejectionReason || a.reviewNotes || "",
        currency: a.currency || "USD",
        disbursed: isDisbursed,
        canDisburse: Boolean(loanId) && !isDisbursed,
      };
    });
  }, [applicationsRaw]);

  // --- Filter Pipeline ---
  const filtered = useMemo(() => {
    const predicates: ((item: any) => boolean)[] = [];
    if (search) {
      predicates.push(
        textSearchFilter(search, [
          (l) => l.applicant ?? "",
          (l) => l.email ?? "",
          (l) => l.id ?? "",
          (l) => l.applicationId ?? "",
          (l) => l.purpose ?? "",
        ]),
      );
    }
    if (statusFilter !== "all") {
      predicates.push(enumFilter((l) => l.status ?? "", [statusFilter]));
    }
    if (typeFilter !== "all") {
      predicates.push(enumFilter((l) => l.type ?? "", [typeFilter]));
    }
    const result = applyFilterPipeline(rawLoans, predicates);
    return multiKeySort(result, [{ getter: (l: any) => new Date(l.appliedDate || 0), direction: "desc" }]);
  }, [rawLoans, search, statusFilter, typeFilter]);

  // --- Pagination ---
  const paginatedResult = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);
  const pageNumbers = useMemo(
    () => getPageNumbers(paginatedResult.page, paginatedResult.totalPages),
    [paginatedResult.page, paginatedResult.totalPages],
  );

  // --- Stats ---
  const stats = useMemo(() => {
    const totalDisbursed = rawLoans
      .filter((l: any) => l.status === "approved" || l.disbursed)
      .reduce((sum: number, l: any) => sum + (l.approvedAmount || l.amount), 0);
    return {
      totalLoans: rawLoans.length,
      pendingApplications: rawLoans.filter((l: any) =>
        l.status === "submitted" || l.status === "under_review",
      ).length,
      activeLoans: rawLoans.filter((l: any) => l.disbursed).length,
      overdueLoans: 0,
      totalDisbursed,
      averageAmount:
        rawLoans.length > 0
          ? Math.round(rawLoans.reduce((s: number, l: any) => s + l.amount, 0) / rawLoans.length)
          : 0,
    };
  }, [rawLoans]);

  // --- Actions ---
  const approveLoan = useCallback(
    (
      applicationId: string,
      approvedAmount?: number,
      notes?: string,
      callbacks?: { onSuccess?: () => void; onError?: (err: any) => void },
    ) => {
      reviewMutation.mutate(
        { applicationId: applicationId as any, data: { decision: "approve", approvedAmount, notes } },
        {
          onSuccess: () => {
            refetch();
            callbacks?.onSuccess?.();
          },
          onError: (err) => callbacks?.onError?.(err),
        },
      );
    },
    [reviewMutation, refetch],
  );

  const rejectLoan = useCallback(
    (
      applicationId: string,
      reason?: string,
      callbacks?: { onSuccess?: () => void; onError?: (err: any) => void },
    ) => {
      reviewMutation.mutate(
        { applicationId: applicationId as any, data: { decision: "reject", reason } },
        {
          onSuccess: () => {
            refetch();
            callbacks?.onSuccess?.();
          },
          onError: (err) => callbacks?.onError?.(err),
        },
      );
    },
    [reviewMutation, refetch],
  );

  const disburseLoan = useCallback(
    (loanId: string, callbacks?: { onSuccess?: () => void; onError?: (err: any) => void }) => {
      disburseMutation.mutate(loanId as any, {
        onSuccess: () => {
          refetch();
          callbacks?.onSuccess?.();
        },
        onError: (err) => callbacks?.onError?.(err),
      });
    },
    [disburseMutation, refetch],
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return {
    loans: paginatedResult.items,
    allLoans: filtered,
    rawLoans,
    stats,
    search,
    statusFilter,
    typeFilter,
    page,
    selectedLoanId,
    isLoading,
    isMutating: reviewMutation.isPending || disburseMutation.isPending,
    pagination: paginatedResult,
    pageNumbers,
    setSearch: handleSearch,
    setStatusFilter: useCallback((v: LoanStatusFilter) => {
      setStatusFilter(v);
      setPage(1);
    }, []),
    setTypeFilter: useCallback((v: LoanTypeFilter) => {
      setTypeFilter(v);
      setPage(1);
    }, []),
    setPage,
    setSelectedLoanId,
    approveLoan,
    rejectLoan,
    disburseLoan,
    refetch,
  };
}
