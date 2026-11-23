import { AttachmentsRepository } from '../../domain/repository/attachments.repository';
import { useToastStore } from '../../store/toast.store';
import { queryKeys } from '../../core/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// ============================================================================
// ATTACHMENTS HOOKS - TanStack Query hooks for file management
// ============================================================================


// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

interface AttachmentFilters {
  category?: "document" | "image" | "other";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all attachments
 */
export const useAttachments = (filters?: AttachmentFilters) => {
  return useQuery({
    queryKey: queryKeys.attachments.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const response = await AttachmentsRepository.getAll(filters);
      return response;
    },
  });
};

/**
 * Get attachment by ID
 */
export const useAttachment = (attachmentId: UUID) => {
  return useQuery({
    queryKey: queryKeys.attachments.detail(attachmentId),
    queryFn: async () => {
      const response = await AttachmentsRepository.getById(attachmentId);
      return response.data;
    },
    enabled: !!attachmentId,
  });
};

/**
 * Get download URL for attachment
 */
export const useAttachmentDownloadUrl = (attachmentId: UUID) => {
  return useQuery({
    queryKey: [...queryKeys.attachments.detail(attachmentId), "download"],
    queryFn: async () => {
      const response = await AttachmentsRepository.getDownloadUrl(attachmentId);
      return response.data;
    },
    enabled: !!attachmentId,
  });
};

/**
 * Get storage usage
 */
export const useStorageUsage = () => {
  return useQuery({
    queryKey: queryKeys.attachments.storage(),
    queryFn: async () => {
      const response = await AttachmentsRepository.getStorageUsage();
      return response.data;
    },
  });
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Upload attachment mutation
 */
export const useUploadAttachment = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      file,
      category,
      metadata,
    }: {
      file: File;
      category?: "document" | "image" | "other";
      metadata?: Record<string, unknown>;
    }) => {
      const response = await AttachmentsRepository.upload(file, category, metadata);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments.storage(),
      });
      showToast("File uploaded successfully", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to upload file", "error");
    },
  });
};

/**
 * Upload multiple attachments mutation
 */
export const useUploadMultipleAttachments = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      files,
      category,
    }: {
      files: File[];
      category?: "document" | "image" | "other";
    }) => {
      const response = await AttachmentsRepository.uploadMultiple(files, category);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments.storage(),
      });
      showToast(`${data.length} files uploaded successfully`, "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to upload files", "error");
    },
  });
};

/**
 * Update attachment metadata mutation
 */
export const useUpdateAttachment = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      attachmentId,
      data,
    }: {
      attachmentId: UUID;
      data: { metadata?: Record<string, unknown> };
    }) => {
      const response = await AttachmentsRepository.update(attachmentId, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments.detail(variables.attachmentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.list() });
      showToast("Attachment updated", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to update attachment", "error");
    },
  });
};

/**
 * Delete attachment mutation
 */
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: async (attachmentId: UUID) => {
      const response = await AttachmentsRepository.delete(attachmentId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments.storage(),
      });
      showToast("Attachment deleted", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to delete attachment", "error");
    },
  });
};

/**
 * Delete multiple attachments mutation
 */
export const useDeleteMultipleAttachments = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: async (attachmentIds: UUID[]) => {
      const response = await AttachmentsRepository.deleteMultiple(attachmentIds);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments.storage(),
      });
      showToast(`${data.deleted} attachments deleted`, "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to delete attachments", "error");
    },
  });
};

export const useAdminAllAttachments = (params?: any) => {
  return useQuery({
    queryKey: [...queryKeys.attachments.all, "admin-all", params],
    queryFn: async () => {
      const response = await AttachmentsRepository.getAdminAllAttachments(params);
      return response.data;
    },
  });
};

export const useAdminUserKycDocuments = (userId: string) => {
  return useQuery({
    queryKey: [...queryKeys.attachments.all, "admin-user-kyc", userId],
    queryFn: async () => {
      const response = await AttachmentsRepository.getAdminUserKycDocuments(userId);
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useReviewAdminKycDocument = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      documentId,
      data,
    }: {
      documentId: string;
      data: { status: "approved" | "rejected"; rejectionReason?: string; notes?: string };
    }) => {
      const response = await AttachmentsRepository.reviewAdminKycDocument(documentId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.kyc.all });
      showToast("KYC document reviewed", "success");
    },
    onError: (error: Error) => {
      showToast(error.message || "Failed to review KYC document", "error");
    },
  });
};
