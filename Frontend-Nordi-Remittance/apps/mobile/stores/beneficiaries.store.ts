// ============================================================================
// BENEFICIARIES STORE — Local UI state for the Beneficiaries screen
// Global beneficiary data is fetched via useClientBeneficiaries (React Query).
// This store owns the search query used to filter beneficiaries locally.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface BeneficiariesUIState {
  search: string;
  setSearch: (query: string) => void;
  clearSearch: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useBeneficiariesStore = create<BeneficiariesUIState>()((set) => ({
  search: '',
  setSearch: (query) => set({ search: query }),
  clearSearch: () => set({ search: '' }),
}));
