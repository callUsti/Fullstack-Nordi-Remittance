// ============================================================================
// USE AI HOOKS - TanStack Query Hooks for AI Agent Assistant
// ============================================================================

import { useMutation, useQuery } from "@tanstack/react-query";
import { AiRepository } from "../../domain/repository/ai.repository";

export const aiQueryKeys = {
  all: ["ai"] as const,
  health: () => [...aiQueryKeys.all, "health"] as const,
};

export const useAiChat = () => {
  return useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId?: string }) => {
      const response = await AiRepository.chat(message, sessionId);
      return response.data;
    },
  });
};

export const useAiEndSession = () => {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await AiRepository.endSession(sessionId);
      return response.data;
    },
  });
};

export const useAiHealth = () => {
  return useQuery({
    queryKey: aiQueryKeys.health(),
    queryFn: async () => {
      const response = await AiRepository.getHealth();
      return response.data;
    },
    staleTime: 60 * 1000,
  });
};

