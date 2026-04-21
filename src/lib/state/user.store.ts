import { create } from 'zustand';

export interface UserDBProfile {
    id?: string;
    telegramId?: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    phone?: string | null;
    city?: string | null;
}

interface UserState {
    profile: UserDBProfile | null;
    isLoading: boolean;
    fetchProfile: (initData: string) => Promise<void>;
    updateProfile: (updated: Partial<UserDBProfile>) => void;
}

export const useUserStore = create<UserState>((set) => ({
    profile: null,
    isLoading: false,
    fetchProfile: async (initData: string) => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/me', {
                headers: {
                    'x-telegram-init-data': initData,
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    set({ profile: data.user, isLoading: false });
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
        }
        set({ isLoading: false });
    },
    updateProfile: (updated) => set((state) => ({ 
        profile: state.profile ? { ...state.profile, ...updated } : updated as UserDBProfile 
    }))
}));
