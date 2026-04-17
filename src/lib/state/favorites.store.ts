import { create } from 'zustand';

interface FavoritesState {
    favoriteIds: string[];
    isLoading: boolean;
    error: string | null;
    fetchFavorites: (initData: string) => Promise<void>;
    addFavorite: (vehicleId: string, initData: string) => Promise<void>;
    removeFavorite: (vehicleId: string, initData: string) => Promise<void>;
    toggleFavorite: (vehicleId: string, initData: string) => Promise<boolean>;
    isFavorite: (vehicleId: string) => boolean;
    clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
    favoriteIds: [],
    isLoading: false,
    error: null,

    fetchFavorites: async (initData: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch('/api/favorites', {
                headers: { 'x-telegram-init-data': initData || '' }
            });
            const data = await res.json();
            if (data?.ok) {
                // Check if the new array is actually different to prevent unnecessary renders
                const currentIds = get().favoriteIds;
                if (JSON.stringify(currentIds) !== JSON.stringify(data.vehicleIds)) {
                    set({ favoriteIds: data.vehicleIds, isLoading: false });
                } else {
                    set({ isLoading: false });
                }
            } else {
                set({ error: 'Failed to load favorites', isLoading: false });
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            set({ error: 'Failed to load favorites', isLoading: false });
        }
    },

    addFavorite: async (vehicleId, initData) => {
        const { favoriteIds } = get();
        if (favoriteIds.includes(vehicleId)) return;

        // Optimistic update
        set({ favoriteIds: [...favoriteIds, vehicleId] });

        try {
            await fetch('/api/favorites/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' },
                body: JSON.stringify({ vehicleId })
            });
        } catch (error) {
            console.error('Error adding favorite:', error);
            // Rollback
            set({ favoriteIds: get().favoriteIds.filter(id => id !== vehicleId) });
        }
    },

    removeFavorite: async (vehicleId, initData) => {
        const { favoriteIds } = get();
        if (!favoriteIds.includes(vehicleId)) return;

        // Optimistic update
        set({ favoriteIds: favoriteIds.filter(id => id !== vehicleId) });

        try {
            await fetch('/api/favorites/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' },
                body: JSON.stringify({ vehicleId })
            });
        } catch (error) {
            console.error('Error removing favorite:', error);
            // Rollback
            set({ favoriteIds: [...get().favoriteIds, vehicleId] });
        }
    },

    toggleFavorite: async (vehicleId, initData) => {
        const { favoriteIds, addFavorite, removeFavorite } = get();
        const isFav = favoriteIds.includes(vehicleId);

        if (isFav) {
            await removeFavorite(vehicleId, initData);
            return false; // Removed
        } else {
            await addFavorite(vehicleId, initData);
            return true; // Added
        }
    },

    isFavorite: (vehicleId) => {
        return get().favoriteIds.includes(vehicleId);
    },

    clearFavorites: () => {
        set({ favoriteIds: [] });
    },
}));
