// ============================================================================
// AI REPOSITORY - Client API for AI Agent Banking Assistant
// ============================================================================

import { apiClient, ApiEndpoints, ApiResponse } from "../../core/api";

export interface AiChatResponse {
  response: string;
  sessionId: string;
  status: string;
  provider: string;
}

export interface AiHealthResponse {
  enabled: boolean;
  providers: Record<string, boolean>;
  mlServiceUrl?: string;
}

export const AiRepository = {
  /**
   * Send a chat message to the AI Banking Assistant
   */
  chat: async (message: string, sessionId?: string): Promise<ApiResponse<AiChatResponse>> => {
    const response = await apiClient.post<ApiResponse<AiChatResponse>>(ApiEndpoints.aiChat, {
      message,
      sessionId,
    });
    return response.data;
  },

  /**
   * End and persist the active AI chat session
   */
  endSession: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(ApiEndpoints.aiEndSession, {
      sessionId,
    });
    return response.data;
  },

  /**
   * Check AI service and provider health
   */
  getHealth: async (): Promise<ApiResponse<AiHealthResponse>> => {
    const response = await apiClient.get<ApiResponse<AiHealthResponse>>(ApiEndpoints.aiHealth);
    return response.data;
  },
};

