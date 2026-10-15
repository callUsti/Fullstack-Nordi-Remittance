// ============================================================================
// LOANS STORE — Local UI state for the Loans & Credit screen
// Global loan data is fetched via useClientLoans (React Query).
// This store owns the tab selection and the EMI calculator form fields.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface LoansUIState {
  /** Active tab: 'active' | 'calculator' | 'credit' */
  activeTab: string;
  /** Principal amount entered in the EMI calculator */
  calcAmount: string;
  /** Loan tenure in months */
  tenureMonths: number;

  // Actions
  setActiveTab: (tab: string) => void;
  setCalcAmount: (amount: string) => void;
  setTenureMonths: (months: number) => void;
  resetCalculator: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useLoansStore = create<LoansUIState>()((set) => ({
  activeTab: 'active',
  calcAmount: '10000',
  tenureMonths: 12,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCalcAmount: (amount) => set({ calcAmount: amount }),
  setTenureMonths: (months) => set({ tenureMonths: months }),
  resetCalculator: () => set({ calcAmount: '10000', tenureMonths: 12 }),
}));
