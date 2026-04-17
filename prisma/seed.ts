import { PrismaClient, VehicleStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env['DATABASE_URL'] || process.env['DIRECT_URL'] || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding vehicles...');

    const vehicles = [
        {
            id: 'seed-zeekr-001-2024',
            brand: 'Zeekr',
            model: '001',
            year: 2024,
            bodyType: 'Liftback',
            engineType: 'Electric',
            powerHp: 544,
            transmission: 'Automatic',
            drivetrain: 'AWD',
            priceKeyTurnKZT: 18500000,
            status: VehicleStatus.in_stock,
            exteriorColor: 'White',
            interiorColor: 'Black',
            description: 'Fully electric premium liftback. High performance.',
            media: ['https://placehold.co/800x600/png?text=Zeekr+001'],
        },
        {
            id: 'seed-zeekr-x-2024',
            brand: 'Zeekr',
            model: 'X',
            year: 2024,
            bodyType: 'SUV',
            engineType: 'Electric',
            powerHp: 428,
            transmission: 'Automatic',
            drivetrain: 'AWD',
            priceKeyTurnKZT: 14200000,
            status: VehicleStatus.in_transit,
            exteriorColor: 'Grey',
            interiorColor: 'White',
            description: 'Compact urban premium SUV.',
            media: ['https://placehold.co/800x600/png?text=Zeekr+X'],
        },
        {
            id: 'seed-lixiang-l9-2024',
            brand: 'LiXiang',
            model: 'L9',
            year: 2024,
            bodyType: 'SUV',
            engineType: 'Hybrid',
            powerHp: 449,
            transmission: 'Automatic',
            drivetrain: 'AWD',
            priceKeyTurnKZT: 24500000,
            status: VehicleStatus.in_stock,
            exteriorColor: 'Black',
            interiorColor: 'Orange',
            description: 'Flagship family SUV with extended range.',
            media: ['https://placehold.co/800x600/png?text=LiXiang+L9'],
        },
        {
            id: 'seed-lixiang-l7-2024',
            brand: 'LiXiang',
            model: 'L7',
            year: 2024,
            bodyType: 'SUV',
            engineType: 'Hybrid',
            powerHp: 449,
            transmission: 'Automatic',
            drivetrain: 'AWD',
            priceKeyTurnKZT: 20500000,
            status: VehicleStatus.in_stock,
            exteriorColor: 'Silver',
            interiorColor: 'Black',
            description: 'Premium 5-seat family SUV.',
            media: ['https://placehold.co/800x600/png?text=LiXiang+L7'],
        },
        {
            id: 'seed-byd-song-plus-2024',
            brand: 'BYD',
            model: 'Song Plus',
            year: 2024,
            bodyType: 'SUV',
            engineType: 'Hybrid',
            powerHp: 197,
            transmission: 'Automatic',
            drivetrain: 'FWD',
            priceKeyTurnKZT: 12500000,
            status: VehicleStatus.in_stock,
            exteriorColor: 'Blue',
            interiorColor: 'Grey',
            description: 'Popular efficient hybrid SUV.',
            media: ['https://placehold.co/800x600/png?text=BYD+Song+Plus'],
        },
        {
            id: 'seed-byd-han-2024',
            brand: 'BYD',
            model: 'Han',
            year: 2024,
            bodyType: 'Sedan',
            engineType: 'Electric',
            powerHp: 517,
            transmission: 'Automatic',
            drivetrain: 'AWD',
            priceKeyTurnKZT: 16800000,
            status: VehicleStatus.reserved,
            exteriorColor: 'Red',
            interiorColor: 'Brown',
            description: 'Luxury electric sedan.',
            media: ['https://placehold.co/800x600/png?text=BYD+Han'],
        },
        {
            id: 'seed-toyota-camry-2024',
            brand: 'Toyota',
            model: 'Camry',
            generation: 'XV70',
            year: 2024,
            bodyType: 'Sedan',
            engineType: 'Gasoline',
            engineVolume: 2.5,
            powerHp: 206,
            transmission: 'Automatic',
            drivetrain: 'FWD',
            priceKeyTurnKZT: 15500000,
            status: VehicleStatus.in_stock,
            exteriorColor: 'White',
            interiorColor: 'Beige',
            description: 'Reliable and comfortable mid-size sedan.',
            media: ['https://placehold.co/800x600/png?text=Toyota+Camry'],
        },
        {
            id: 'seed-geely-monjaro-2024',
            brand: 'Geely',
            model: 'Monjaro',
            year: 2024,
            bodyType: 'SUV',
            engineType: 'Gasoline',
            engineVolume: 2.0,
            powerHp: 238,
            transmission: 'Automatic',
            drivetrain: 'AWD',
            priceKeyTurnKZT: 17200000,
            status: VehicleStatus.in_stock,
            exteriorColor: 'Emerald Green',
            interiorColor: 'Black',
            description: 'Premium mid-size crossover.',
            media: ['https://placehold.co/800x600/png?text=Geely+Monjaro'],
        },
        {
            id: 'seed-avatr-11-2024',
            brand: 'Avatr',
            model: '11',
            year: 2024,
            bodyType: 'SUV',
            engineType: 'Electric',
            powerHp: 578,
            transmission: 'Automatic',
            drivetrain: 'AWD',
            priceKeyTurnKZT: 19500000,
            status: VehicleStatus.in_transit,
            exteriorColor: 'Black',
            interiorColor: 'Red',
            description: 'High-tech emotional electric SUV.',
            media: ['https://placehold.co/800x600/png?text=Avatr+11'],
        },
        {
            id: 'seed-voyah-free-2024',
            brand: 'Voyah',
            model: 'Free',
            year: 2024,
            bodyType: 'SUV',
            engineType: 'Hybrid',
            powerHp: 490,
            transmission: 'Automatic',
            drivetrain: 'AWD',
            priceKeyTurnKZT: 16000000,
            status: VehicleStatus.in_stock,
            exteriorColor: 'Dark Blue',
            interiorColor: 'Beige',
            description: 'Luxury smart electric SUV.',
            media: ['https://placehold.co/800x600/png?text=Voyah+Free'],
        }
    ];

    for (const v of vehicles) {
        const created = await prisma.vehicle.upsert({
            where: { id: v.id },
            update: v,
            create: v,
        });
        console.log(`Upserted vehicle: ${created.brand} ${created.model}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
