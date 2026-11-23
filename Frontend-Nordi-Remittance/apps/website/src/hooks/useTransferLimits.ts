// ============================================================================
// TRANSFER LIMITS HOOKS (Client & Admin)
// Fetches effective domestic/international limits, submits client limit
// increase/decrease requests, and allows admins to adjust user limits.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@core/api/client";

export interface ScopeLimitInfo {
  perTransaction: number;
  daily: number;
  monthly: number;
  dailyUsed: number;
  monthlyUsed: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  isCustom?: boolean;
}

export interface LimitChangeRequestItem {
  _id: string;
  scope: "domestic" | "international";
  action: "increase" | "decrease";
  requestedLimits: {
    perTransaction?: number;
    daily?: number;
    monthly?: number;
  };
  currentLimits?: {
    perTransaction?: number;
    daily?: number;
    monthly?: number;
  };
  reason?: string;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string;
  createdAt: string;
}

export interface AccountLimitsResponse {
  kycStatus?: string;
  domestic?: ScopeLimitInfo;
  international?: ScopeLimitInfo;
  customLimits?: {
    domestic?: Partial<ScopeLimitInfo>;
    international?: Partial<ScopeLimitInfo>;
  };
  limitRequests?: LimitChangeRequestItem[];
}

export function useClientTransferLimits() {
  const query = useQuery<AccountLimitsResponse>({
    queryKey: ["client-transfer-limits"],
    queryFn: async () => {
      const res = await apiClient.get("/accounts/limits");
      return (res.data as any)?.data ?? res.data;
    },
    staleTime: 30_000,
  });

  return {
    data: query.data,
    domestic: query.data?.domestic,
    international: query.data?.international,
    limitRequests: query.data?.limitRequests || [],
    kycStatus: query.data?.kycStatus,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useRequestLimitChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      scope: "domestic" | "international";
      action: "increase" | "decrease";
      perTransaction?: number;
      daily?: number;
      monthly?: number;
      reason?: string;
    }) => {
      const res = await apiClient.post("/accounts/limits/request", payload);
      return (res.data as any)?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-transfer-limits"] });
    },
  });
}

export function useAdminUserLimits(userId: string) {
  return useQuery<AccountLimitsResponse>({
    queryKey: ["admin-user-limits", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${userId}/limits`);
      return (res.data as any)?.data ?? res.data;
    },
  });
}

export function useAdminUpdateUserLimits(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      domestic?: { perTransaction?: number; daily?: number; monthly?: number };
      international?: { perTransaction?: number; daily?: number; monthly?: number };
      limitRequestId?: string;
      requestStatus?: "approved" | "rejected";
      reviewNote?: string;
    }) => {
      const res = await apiClient.put(`/admin/users/${userId}/limits`, payload);
      return (res.data as any)?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-limits", userId] });
      qc.invalidateQueries({ queryKey: ["client-transfer-limits"] });
    },
  });
}

