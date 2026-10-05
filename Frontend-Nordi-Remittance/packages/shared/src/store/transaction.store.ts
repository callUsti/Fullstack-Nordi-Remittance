// ============================================================================
// TRANSACTION STORE - Zustand store for transaction list caching & filters
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getPersistStorage } from './persistStorage';

// ============================================================================
// TYPES
// ============================================================================

export interface TransactionFiltersState {
  search: string;
  status: string;
  type: string;
  timeRange: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

interface TransactionState {
  // Caching
  cachedTransactions: Record<string, any>;

  // Filter States (Persisted for seamless navigation)
  globalFilters: TransactionFiltersState;

  // Actions
  setCachedTransaction: (transactionId: string, data: any) => void;
  updateGlobalFilters: (filters: Partial<TransactionFiltersState>) => void;
  resetGlobalFilters: () => void;
  clearCache: () => void;
}

const DEFAULT_FILTERS: TransactionFiltersState = {
  search: '',
  status: 'all',
  type: 'all',
  timeRange: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc',
};

// ============================================================================
// STORE
// ============================================================================

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      cachedTransactions: {},
      globalFilters: DEFAULT_FILTERS,

      setCachedTransaction: (transactionId, data) =>
        set((state) => ({
          cachedTransactions: {
            ...state.cachedTransactions,
            [transactionId]: data,
          },
        })),

      updateGlobalFilters: (filters) =>
        set((state) => ({
          globalFilters: { ...state.globalFilters, ...filters },
        })),

      resetGlobalFilters: () =>
        set(() => ({
          globalFilters: DEFAULT_FILTERS,
        })),

      clearCache: () => set({ cachedTransactions: {} }),
    }),
    {
      name: 'nordi-transaction-store',
      storage: createJSONStorage(getPersistStorage),
      partialize: (state) => ({ globalFilters: state.globalFilters }), // Only persist filters across reloads
    }
  )
);
