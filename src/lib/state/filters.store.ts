import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type PurchasePlan = 'viewing' | 'three_months' | 'ready_now';

export interface Filter {
    id: string;
    title?: string;
    brand: string;
    model?: string;
    budgetMax: number;
    yearFrom?: number;
    yearTo?: number;
    bodyTypes?: string[];
    engineTypes?: string[];
    drivetrain?: string[];
    transmission?: string[];
    exteriorColors?: string[];
    interiorColors?: string[];
    purchasePlan: PurchasePlan;
    notificationsEnabled: boolean;
    createdAt: number | string;
}

interface FiltersState {
    filters: Filter[];
    isLoading: boolean;
    error: string | null;
    
    setFilters: (filters: Filter[]) => void;
    fetchFilters: (initData: string) => Promise<void>;
    addFilterAsync: (filter: Omit<Filter, 'id' | 'createdAt'>, initData: string) => Promise<void>;
    updateFilterAsync: (id: string, updates: Partial<Filter>, initData: string) => Promise<void>;
    removeFilterAsync: (id: string, initData: string) => Promise<void>;
    toggleNotificationsAsync: (id: string, initData: string) => Promise<void>;
    getFilter: (id: string) => Filter | undefined;

    // Keep original synchronous for local first, but they shouldn't be main methods
    addFilter: (filter: Omit<Filter, 'id' | 'createdAt'>) => void;
    removeFilter: (id: string) => void;
    toggleNotifications: (id: string) => void;
}

export const useFiltersStore = create<FiltersState>()((set, get) => ({
    filters: [],
    isLoading: false,
    error: null,

    setFilters: (filters) => set({ filters }),

    fetchFilters: async (initData: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch('/api/filters', {
                headers: { 'x-telegram-init-data': initData }
            });
            if (!res.ok) throw new Error('Failed to fetch filters');
            const data = await res.json();
            set({ filters: data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addFilterAsync: async (filterData, initData: string) => {
        try {
            const res = await fetch('/api/filters', {
                method: 'POST',
                headers: { 
                    'x-telegram-init-data': initData,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filterData)
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || 'Failed to create filter');
            }
            const data = await res.json();
            set((state) => ({ ...state, filters: [data, ...state.filters] }));
        } catch (error) {
            console.error('Filter Store Error:', error);
            throw error;
        }
    },

    updateFilterAsync: async (id, updates, initData: string) => {
        try {
            const res = await fetch(`/api/filters/${id}`, {
                method: 'PATCH',
                headers: { 
                    'x-telegram-init-data': initData,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error('Failed to update filter');
            const data = await res.json();
            set((state) => ({
                filters: state.filters.map((f) => (f.id === id ? { ...f, ...data } : f)),
            }));
        } catch (error) {
            console.error(error);
        }
    },

    removeFilterAsync: async (id, initData: string) => {
        // Optimistic UI
        const previousFilters = get().filters;
        set((state) => ({ filters: state.filters.filter((f) => f.id !== id) }));
        
        try {
            const res = await fetch(`/api/filters/${id}`, {
                method: 'DELETE',
                headers: { 'x-telegram-init-data': initData }
            });
            if (!res.ok) throw new Error('Failed to delete filter');
        } catch (error) {
            console.error(error);
            // Revert
            set({ filters: previousFilters });
        }
    },

    toggleNotificationsAsync: async (id, initData: string) => {
        const filter = get().filters.find(f => f.id === id);
        if (!filter) return;
        
        await get().updateFilterAsync(id, { notificationsEnabled: !filter.notificationsEnabled }, initData);
    },

    getFilter: (id) => {
        return get().filters.find((f) => f.id === id);
    },

    // Legacy sync
    addFilter: (filterData) => {
        const newFilter: Filter = {
            ...filterData,
            id: uuidv4(),
            createdAt: Date.now(),
        };
        set((state) => ({ filters: [newFilter, ...state.filters] }));
    },
    removeFilter: (id) => {
        set((state) => ({ filters: state.filters.filter((f) => f.id !== id) }));
    },
    toggleNotifications: (id) => {
        set((state) => ({
            filters: state.filters.map((f) =>
                f.id === id ? { ...f, notificationsEnabled: !f.notificationsEnabled } : f
            ),
        }));
    },
}));
