// ============================================================================
// AUTH UI STORE — Local UI state for authentication screens
// Server auth state (user, tokens) lives in shared auth.store.
// This store owns form field state for Reset Password and other auth UI flows
// that are purely local and cleared on completion.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

type ResetStep = 'email' | 'otp' | 'password' | 'done';

interface AuthUIState {
  // Reset Password flow
  resetStep: ResetStep;
  resetEmail: string;
  resetOtp: string;
  resetPassword: string;
  resetConfirm: string;
  showPassword: boolean;
  resetLoading: boolean;
  resetError: string;

  // Actions — Reset Password
  setResetStep: (step: ResetStep) => void;
  setResetEmail: (email: string) => void;
  setResetOtp: (otp: string) => void;
  setResetPassword: (pwd: string) => void;
  setResetConfirm: (confirm: string) => void;
  setShowPassword: (val: boolean) => void;
  setResetLoading: (val: boolean) => void;
  setResetError: (msg: string) => void;
  resetFlow: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useAuthUIStore = create<AuthUIState>()((set) => ({
  resetStep: 'email',
  resetEmail: '',
  resetOtp: '',
  resetPassword: '',
  resetConfirm: '',
  showPassword: false,
  resetLoading: false,
  resetError: '',

  setResetStep: (step) => set({ resetStep: step }),
  setResetEmail: (email) => set({ resetEmail: email }),
  setResetOtp: (otp) => set({ resetOtp: otp }),
  setResetPassword: (pwd) => set({ resetPassword: pwd }),
  setResetConfirm: (confirm) => set({ resetConfirm: confirm }),
  setShowPassword: (val) => set({ showPassword: val }),
  setResetLoading: (val) => set({ resetLoading: val }),
  setResetError: (msg) => set({ resetError: msg }),
  resetFlow: () =>
    set({
      resetStep: 'email',
      resetEmail: '',
      resetOtp: '',
      resetPassword: '',
      resetConfirm: '',
      showPassword: false,
      resetLoading: false,
      resetError: '',
    }),
}));
