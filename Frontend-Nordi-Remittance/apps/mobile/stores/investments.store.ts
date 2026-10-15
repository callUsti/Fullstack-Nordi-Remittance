// ============================================================================
// INVESTMENTS STORE — Local UI state for the Investments & Wealth screen
// Global investment data is fetched via useClientPortfolio / useClientInvestments.
// This store owns only the tab selection.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface InvestmentsUIState {
  /** Active tab: 'portfolio' | 'products' | 'activity' */
  activeTab: string;

  // Actions
  setActiveTab: (tab: string) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useInvestmentsStore = create<InvestmentsUIState>()((set) => ({
  activeTab: 'portfolio',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
