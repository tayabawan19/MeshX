import { create } from 'zustand';
import { UserProfile } from '../types';
import { apiClient, setAuthTokens, initSocket, disconnectSocket } from '../config/api';
import { e2eeService } from '../services/e2eeService';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  error: string | null;
  pendingEmail: string | null;

  signup: (payload: { name: string; email: string; phone: string; password: string }) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean | 'UNVERIFIED'>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<boolean>;
  updateUserProfile: (updated: Partial<UserProfile>) => void;
  setIsOnboarded: (status: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

const getErrorMessage = (err: any, defaultFallback: string): string => {
  if (err.response) {
    return err.response.data?.error || err.response.data?.message || defaultFallback;
  }
  return "Can't reach server — check your connection";
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isOnboarded: true,
  error: null,
  pendingEmail: null,

  checkAuthStatus: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get('/users/me');
      if (res.data?.user) {
        const u = res.data.user;
        set({ user: u, isAuthenticated: true, isLoading: false });
        e2eeService.initialize(u._id || u.id);
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  signup: async ({ name, email, phone, password }) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/signup', { name, email, phone, password });
      set({ isLoading: false, pendingEmail: email });
      return true;
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Signup failed. Please try again.');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  verifyOtp: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/auth/verify-otp', { email, otp });
      const { accessToken, refreshToken, user } = res.data;
      setAuthTokens(accessToken, refreshToken);
      initSocket(accessToken);
      e2eeService.initialize(user._id || user.id);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        pendingEmail: null,
      });
      return true;
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Invalid OTP code.');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  resendOtp: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/resend-otp', { email });
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Failed to resend OTP.');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data;
      setAuthTokens(accessToken, refreshToken);
      initSocket(accessToken);
      e2eeService.initialize(user._id || user.id);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      const isUnverified = err.response?.data?.isVerified === false;
      const msg = getErrorMessage(err, 'Invalid email or password.');
      set({ isLoading: false, error: msg });
      if (isUnverified) {
        return 'UNVERIFIED';
      }
      return false;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/forgot-password', { email });
      set({ isLoading: false, pendingEmail: email });
      return true;
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Failed to process request.');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      set({ isLoading: false, pendingEmail: null });
      return true;
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Failed to reset password.');
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  updateProfile: async (updated) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.put('/users/profile', updated);
      const updatedUser = res.data.user;
      set({ user: updatedUser, isLoading: false });
      return true;
    } catch (err: any) {
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, ...updated }, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return true;
    }
  },

  updateUserProfile: (updated) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updated } : null,
    })),
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    setAuthTokens(null, null);
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },
  clearError: () => set({ error: null }),
}));
