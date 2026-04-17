export type PurchasePlan = 'browsing' | '3_months' | 'ready_now';

export interface Filter {
    id: string;
    title: string;
    brand: string;
    model?: string;
    budgetMax: number;
    yearFrom?: number;
    yearTo?: number;
    bodyTypes?: string[];
    purchasePlan: PurchasePlan;
    notificationsEnabled: boolean;
    createdAt: string;
}

export const mockFilters: Filter[] = [
    {
        id: '1',
        title: 'Для себя',
        brand: 'Zeekr',
        model: '001',
        budgetMax: 15000000,
        yearFrom: 2023,
        bodyTypes: ['liftback'],
        purchasePlan: 'ready_now',
        notificationsEnabled: true,
        createdAt: '2023-10-25T10:00:00Z',
    },
    {
        id: '2',
        title: 'Жене',
        brand: 'Lixiang',
        model: 'L7',
        budgetMax: 22000000,
        yearFrom: 2024,
        bodyTypes: ['suv'],
        purchasePlan: '3_months',
        notificationsEnabled: false,
        createdAt: '2023-10-26T14:30:00Z',
    },
];
