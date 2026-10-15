// ============================================================================
// FOREX STORE — Local UI state for the Currency Exchange screen
// Live FX rates are fetched via API queries (React Query).
// This store owns the currency pair selection, amount input, and converting flag.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface ForexUIState {
  fromCurr: string;
  toCurr: string;
  fromAmount: string;
  isConverting: boolean;

  // Actions
  setFromCurr: (currency: string) => void;
  setToCurr: (currency: string) => void;
  setFromAmount: (amount: string) => void;
  setIsConverting: (val: boolean) => void;
  swapCurrencies: () => void;
  reset: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useForexStore = create<ForexUIState>()((set) => ({
  fromCurr: 'USD',
  toCurr: 'EUR',
  fromAmount: '1000',
  isConverting: false,

  setFromCurr: (currency) => set({ fromCurr: currency }),
  setToCurr: (currency) => set({ toCurr: currency }),
  setFromAmount: (amount) => set({ fromAmount: amount }),
  setIsConverting: (val) => set({ isConverting: val }),
  swapCurrencies: () =>
    set((state) => ({ fromCurr: state.toCurr, toCurr: state.fromCurr })),
  reset: () => set({ fromCurr: 'USD', toCurr: 'EUR', fromAmount: '1000', isConverting: false }),
}));
