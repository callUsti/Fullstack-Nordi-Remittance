// ============================================================================
// ACCOUNTS STORE — Local UI state for the Accounts & Wallets screen
// Global wallet data is fetched via useClientWallets (React Query).
// Global account state (balance visibility, etc.) is in shared ui.store.
// This store owns only the tab navigation state.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface AccountsUIState {
  /** Active tab: 'overview' | 'wallets' | 'fixed' | 'statements' */
  activeTab: string;

  // Actions
  setActiveTab: (tab: string) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useAccountsStore = create<AccountsUIState>()((set) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
