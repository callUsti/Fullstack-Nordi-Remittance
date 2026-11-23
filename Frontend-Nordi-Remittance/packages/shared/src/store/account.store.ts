// ============================================================================
// account.store.ts — UI & Form state for Accounts & Wallets
// Centralizes form states, tabs, and filters across mobile and web apps
// ============================================================================

import { create } from "zustand";

export const SHOW_APPLICATION_DEV_PREVIEW = true;

export type AccountAppTab = "apply" | "history";
export type AccountApplicationType = "savings" | "current" | "fixed_deposit";

export interface CreateWalletFormState {
  selectedCurrency: string;
  walletType: "personal" | "business";
  nickname: string;
}

export interface AccountApplicationFormState {
  tab: AccountAppTab;
  selectedType: AccountApplicationType;
  currency: string;
  nickname: string;
  // Savings
  initialDeposit: string;
  savingsGoal: string;
  autoSave: boolean;
  autoSaveAmount: string;
  // Current
  purpose: "personal" | "business";
  businessName: string;
  expectedVolume: string;
  overdraftRequested: boolean;
  // Fixed Deposit
  principal: string;
  termMonths: 3 | 6 | 12 | 24 | 36;
  autoRenew: boolean;
}

export interface StatementsFormState {
  selectedPeriod: string;
  selectedFormat: "PDF" | "CSV";
}

export interface WalletDetailsUIState {
  renameModalVisible: boolean;
  newWalletName: string;
}

interface AccountState {
  // Navigation tabs
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Wallet selection
  selectedWalletId: string | null;
  setSelectedWalletId: (id: string | null) => void;

  // Create Wallet Form
  createWalletForm: CreateWalletFormState;
  setCreateWalletField: <K extends keyof CreateWalletFormState>(key: K, value: CreateWalletFormState[K]) => void;
  resetCreateWalletForm: () => void;

  // Application Form
  applicationForm: AccountApplicationFormState;
  setApplicationField: <K extends keyof AccountApplicationFormState>(key: K, value: AccountApplicationFormState[K]) => void;
  resetApplicationForm: () => void;

  // Statements Form
  statementsForm: StatementsFormState;
  setStatementsField: <K extends keyof StatementsFormState>(key: K, value: StatementsFormState[K]) => void;

  // Wallet Details UI
  walletDetailsUI: WalletDetailsUIState;
  setWalletDetailsUI: (updates: Partial<WalletDetailsUIState>) => void;

  // Cache
  isApplicationModalOpen: boolean;
  setApplicationModalOpen: (isOpen: boolean) => void;
  cachedAccounts: Record<string, any>;
  cacheAccounts: (accounts: any[]) => void;
}

const defaultCreateWalletForm: CreateWalletFormState = {
  selectedCurrency: "EUR",
  walletType: "personal",
  nickname: "",
};

const defaultApplicationForm: AccountApplicationFormState = {
  tab: "apply",
  selectedType: "savings",
  currency: "USD",
  nickname: "",
  initialDeposit: "500",
  savingsGoal: "",
  autoSave: true,
  autoSaveAmount: "100",
  purpose: "personal",
  businessName: "",
  expectedVolume: "5000",
  overdraftRequested: false,
  principal: "2500",
  termMonths: 12,
  autoRenew: false,
};

const defaultStatementsForm: StatementsFormState = {
  selectedPeriod: "current",
  selectedFormat: "PDF",
};

const defaultWalletDetailsUI: WalletDetailsUIState = {
  renameModalVisible: false,
  newWalletName: "",
};

export const useAccountStore = create<AccountState>((set) => ({
  activeTab: "overview",
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedWalletId: null,
  setSelectedWalletId: (id) => set({ selectedWalletId: id }),

  // Create wallet
  createWalletForm: defaultCreateWalletForm,
  setCreateWalletField: (key, value) =>
    set((state) => ({
      createWalletForm: { ...state.createWalletForm, [key]: value },
    })),
  resetCreateWalletForm: () => set({ createWalletForm: defaultCreateWalletForm }),

  // Application form
  applicationForm: defaultApplicationForm,
  setApplicationField: (key, value) =>
    set((state) => ({
      applicationForm: { ...state.applicationForm, [key]: value },
    })),
  resetApplicationForm: () => set({ applicationForm: defaultApplicationForm }),

  // Statements form
  statementsForm: defaultStatementsForm,
  setStatementsField: (key, value) =>
    set((state) => ({
      statementsForm: { ...state.statementsForm, [key]: value },
    })),

  // Wallet details UI
  walletDetailsUI: defaultWalletDetailsUI,
  setWalletDetailsUI: (updates) =>
    set((state) => ({
      walletDetailsUI: { ...state.walletDetailsUI, ...updates },
    })),

  isApplicationModalOpen: false,
  setApplicationModalOpen: (isOpen) => set({ isApplicationModalOpen: isOpen }),

  cachedAccounts: {},
  cacheAccounts: (accounts) =>
    set((state) => {
      const newCache = { ...state.cachedAccounts };
      accounts.forEach((acc) => {
        newCache[acc.id] = acc;
      });
      return { cachedAccounts: newCache };
    }),
}));

/** Alias for backward compatibility */
export const useAccountsStore = useAccountStore;
