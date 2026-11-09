import { create } from 'zustand';
import { ActiveMarketplace, ThemeMode } from '../theme/tokens';
import { isLanguageRTL, SupportedLanguageCode } from '../i18n/languages';
import { changeAppLanguage } from '../i18n';
import { AppRole, MemberProfile } from '../types/database';

interface AppState {
  theme: ThemeMode;
  language: SupportedLanguageCode;
  isRTL: boolean;
  activeMarketplace: ActiveMarketplace;
  profile: MemberProfile | null;
  roles: AppRole[];
  isGuestMode: boolean;
  hasCompletedOnboarding: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (code: SupportedLanguageCode) => Promise<void>;
  setActiveMarketplace: (marketplace: ActiveMarketplace) => void;
  setProfile: (profile: MemberProfile | null) => void;
  setRoles: (roles: AppRole[]) => void;
  setGuestMode: (isGuest: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  canPublishOrTransact: () => boolean;
  isAdmin: () => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'dark',
  language: 'en',
  isRTL: false,
  activeMarketplace: 'tasks',
  profile: null,
  roles: ['member'],
  isGuestMode: false,
  hasCompletedOnboarding: false,

  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setLanguage: async (code) => {
    const rtl = await changeAppLanguage(code);
    set({ language: code, isRTL: rtl });
  },

  setActiveMarketplace: (activeMarketplace) => set({ activeMarketplace }),
  setProfile: (profile) => set({ profile }),
  setRoles: (roles) => set({ roles }),
  setGuestMode: (isGuestMode) => set({ isGuestMode }),
  setOnboardingCompleted: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),

  canPublishOrTransact: () => {
    const { profile } = get();
    return Boolean(
      profile &&
        profile.kyc_status === 'approved' &&
        !profile.is_suspended
    );
  },

  isAdmin: () => {
    const { roles } = get();
    return roles.includes('admin') || roles.includes('super_admin');
  },
}));
