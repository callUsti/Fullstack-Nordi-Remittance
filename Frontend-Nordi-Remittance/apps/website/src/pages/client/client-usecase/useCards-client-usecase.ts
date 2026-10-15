// ============================================================================
// useCardsDomain — Domain use-case hook for Client Cards
// Re-exported from @nordi/shared/client-usecase with React Router support
// ============================================================================

import { useNavigate } from "react-router-dom";
import {
  useCardsOverviewDomain as useSharedCardsOverviewDomain,
  useApplyForCardDomain as useSharedApplyForCardDomain,
  CardNavigationOptions,
} from "@nordi/shared/client-usecase/useCards-client-usecase";

export * from "@nordi/shared/client-usecase/useCards-client-usecase";

/**
 * Website-compatible wrapper that automatically uses react-router's useNavigate
 */
export function useCardsOverviewDomain(options?: CardNavigationOptions) {
  const navigate = useNavigate();
  return useSharedCardsOverviewDomain({ onNavigate: options?.onNavigate || navigate });
}

export function useApplyForCardDomain(options?: CardNavigationOptions) {
  const navigate = useNavigate();
  return useSharedApplyForCardDomain({ onNavigate: options?.onNavigate || navigate });
}
