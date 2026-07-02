import { create } from "zustand";
import { User } from "firebase/auth";
import { UserRole, UserRoleProfile } from "@/lib/rbac";

interface AuthState {
  user: User | null;
  profile: UserRoleProfile | null;
  role: UserRole | null;
  loading: boolean;
  profileLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserRoleProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setProfileLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,
  profileLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile, role: profile?.role ?? null }),
  setLoading: (loading) => set({ loading }),
  setProfileLoading: (profileLoading) => set({ profileLoading }),
}));
