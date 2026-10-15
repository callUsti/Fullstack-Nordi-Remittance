// ============================================================================
// BILLING STORE — Local UI state for the Bills & Payments screens
// Server-side bill data is fetched via useClientBills (React Query).
// This store owns the Autopay setup form fields.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

interface BillingUIState {
  // Autopay form
  autopayBiller: string;
  autopayAmount: string;
  autopayFrequency: string;
  autopayStartDate: string;

  // Bill payment form
  selectedCategory: string | null;
  meterOrPhone: string;
  billAmount: string;

  // Actions
  setAutopayBiller: (biller: string) => void;
  setAutopayAmount: (amount: string) => void;
  setAutopayFrequency: (freq: string) => void;
  setAutopayStartDate: (date: string) => void;
  resetAutopay: () => void;

  setSelectedCategory: (cat: string | null) => void;
  setMeterOrPhone: (val: string) => void;
  setBillAmount: (amount: string) => void;
  resetBillForm: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useBillingStore = create<BillingUIState>()((set) => ({
  autopayBiller: '',
  autopayAmount: '',
  autopayFrequency: 'monthly',
  autopayStartDate: '',

  // Bill payment defaults
  selectedCategory: null,
  meterOrPhone: '',
  billAmount: '50',

  setAutopayBiller: (biller) => set({ autopayBiller: biller }),
  setAutopayAmount: (amount) => set({ autopayAmount: amount }),
  setAutopayFrequency: (freq) => set({ autopayFrequency: freq }),
  setAutopayStartDate: (date) => set({ autopayStartDate: date }),
  resetAutopay: () =>
    set({ autopayBiller: '', autopayAmount: '', autopayFrequency: 'monthly', autopayStartDate: '' }),

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setMeterOrPhone: (val) => set({ meterOrPhone: val }),
  setBillAmount: (amount) => set({ billAmount: amount }),
  resetBillForm: () => set({ selectedCategory: null, meterOrPhone: '', billAmount: '50' }),
}));
