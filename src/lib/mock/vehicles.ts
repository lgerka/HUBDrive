export type VehicleStatus = 'in_stock' | 'in_transit' | 'reserved' | 'sold';

export interface Vehicle {
    id: string;
    title: string; // "Zeekr 001, 2024, Liftback"
    brand: string;
    model: string;
    year: number;
    bodyType: string;
    priceKeyTurnKZT: number;
    priceChinaCNY?: number;
    status: VehicleStatus;
    mainPhoto: string;
    photos: string[];
    specs: {
        engine: string; // "Electric"
        transmission: string; // "Automatic"
        drivetrain: string; // "AWD"
        range?: number; // km
        acceleration?: number; // 0-100
        power?: number; // hp
    };
    inStockCity?: string; // if in_stock
    transitEta?: string; // if in_transit
}

export const mockVehicles: Vehicle[] = [
    {
        id: 'v1',
        title: 'Zeekr 001 YOU Z-Sport',
        brand: 'Zeekr',
        model: '001',
        year: 2024,
        bodyType: 'Liftback',
        priceKeyTurnKZT: 18500000,
        status: 'in_stock',
        inStockCity: 'Almaty',
        mainPhoto: 'https://images.unsplash.com/photo-1698308385316-5c5e87aexd?q=80&w=2940&auto=format&fit=crop', // placeholder
        photos: [
            'https://images.unsplash.com/photo-1698308385316-5c5e87aexd?q=80&w=2940&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1678864708709-a7977465355a?q=80&w=2940&auto=format&fit=crop'
        ],
        specs: {
            engine: 'Electric',
            transmission: 'Automatic',
            drivetrain: 'AWD',
            range: 656,
            acceleration: 3.8,
            power: 544
        }
    },
    {
        id: 'v2',
        title: 'Lixiang L9 Max',
        brand: 'Lixiang',
        model: 'L9',
        year: 2024,
        bodyType: 'SUV',
        priceKeyTurnKZT: 26500000,
        status: 'in_transit',
        transitEta: '2024-03-15',
        mainPhoto: 'https://images.unsplash.com/photo-1678864708709-a7977465355a?q=80&w=2940&auto=format&fit=crop', // placeholder
        photos: [
            'https://images.unsplash.com/photo-1678864708709-a7977465355a?q=80&w=2940&auto=format&fit=crop'
        ],
        specs: {
            engine: 'Hybrid',
            transmission: 'Automatic',
            drivetrain: 'AWD',
            range: 1315,
            acceleration: 5.3,
            power: 449
        }
    },
    {
        id: 'v3',
        title: 'Avatr 11',
        brand: 'Avatr',
        model: '11',
        year: 2023,
        bodyType: 'SUV',
        priceKeyTurnKZT: 19200000,
        status: 'in_stock',
        inStockCity: 'Astana',
        mainPhoto: 'https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?q=80&w=2787&auto=format&fit=crop', // placeholder
        photos: [
            'https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?q=80&w=2787&auto=format&fit=crop'
        ],
        specs: {
            engine: 'Electric',
            transmission: 'Automatic',
            drivetrain: 'AWD',
            range: 680,
            acceleration: 3.9,
            power: 578
        }
    }
];
