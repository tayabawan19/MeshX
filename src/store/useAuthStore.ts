import { create } from 'zustand';
import { UserProfile } from '../types';
import { apiClient, setAuthTokens, initSocket, disconnectSocket } from '../config/api';

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
  login: (email: string, password: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<boolean>;
  setIsOnboarded: (status: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: 'usr_me',
    name: 'Alex Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: '⚡ Building the future of real-time communication @MeshX',
    email: 'alex.vance@meshx.app',

    phone: '+1 (555) 019-2834',
    isVerified: true,
    isOnline: true,
  },
  isAuthenticated: true,
  isLoading: false,
  isOnboarded: true,
  error: null,
  pendingEmail: null,

  signup: async ({ name, email, phone, password }) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/signup', { name, email, phone, password });
      set({ isLoading: false, pendingEmail: email });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Signup failed. Please try again.';
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

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        pendingEmail: null,
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid OTP code.';
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
      const msg = err.response?.data?.error || 'Failed to resend OTP.';
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

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid email or password.';
      set({ isLoading: false, error: msg });
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
      const msg = err.response?.data?.error || 'Failed to process request.';
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
      const msg = err.response?.data?.error || 'Failed to reset password.';
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

  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    setAuthTokens(null, null);
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },
  clearError: () => set({ error: null }),
}));
