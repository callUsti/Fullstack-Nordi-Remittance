// ============================================================================
// CARDS STORE — Local UI state for the Cards Hub screen
// Global card data is fetched via useClientCards (React Query).
// This store manages purely ephemeral UI state: tab selection, selected card
// index, and per-channel security toggles that the user interacts with.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface CardsUIState {
  /** Which sub-tab is active: 'cards' | 'limits' | 'security' */
  activeTab: string;
  /** Index of the currently highlighted card in the carousel */
  selectedCardIndex: number;
  // Security channel toggles (stored locally until user saves to backend)
  onlinePurchases: boolean;
  intlUsage: boolean;
  contactless: boolean;
  atmWithdrawals: boolean;

  // Actions
  setActiveTab: (tab: string) => void;
  setSelectedCardIndex: (index: number) => void;
  setOnlinePurchases: (val: boolean) => void;
  setIntlUsage: (val: boolean) => void;
  setContactless: (val: boolean) => void;
  setAtmWithdrawals: (val: boolean) => void;
  resetToggles: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useCardsStore = create<CardsUIState>()((set) => ({
  activeTab: 'cards',
  selectedCardIndex: 0,
  onlinePurchases: true,
  intlUsage: false,
  contactless: true,
  atmWithdrawals: true,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedCardIndex: (index) => set({ selectedCardIndex: index }),
  setOnlinePurchases: (val) => set({ onlinePurchases: val }),
  setIntlUsage: (val) => set({ intlUsage: val }),
  setContactless: (val) => set({ contactless: val }),
  setAtmWithdrawals: (val) => set({ atmWithdrawals: val }),
  resetToggles: () =>
    set({ onlinePurchases: true, intlUsage: false, contactless: true, atmWithdrawals: true }),
}));
