import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Using a singleton for the repository layer
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
} else {
    if (!(global as any).prisma) {
        const connectionString = `${process.env.DATABASE_URL}`;
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        (global as any).prisma = new PrismaClient({ adapter });
    }
    prisma = (global as any).prisma;
}

export const favoritesRepo = {
    /**
     * List favorable vehicle IDs for a user.
     */
    async list(userId: string) {
        const favorites = await prisma.favorite.findMany({
            where: { userId },
            select: { vehicleId: true }
        });
        return favorites.map(f => f.vehicleId);
    },

    /**
     * Add a favorite for a user.
     */
    async add(userId: string, vehicleId: string) {
        return prisma.favorite.upsert({
            where: {
                userId_vehicleId: {
                    userId,
                    vehicleId
                }
            },
            create: {
                userId,
                vehicleId
            },
            update: {} // Do nothing if it already exists
        });
    },

    /**
     * Remove a favorite for a user.
     */
    async remove(userId: string, vehicleId: string) {
        try {
            await prisma.favorite.delete({
                where: {
                    userId_vehicleId: {
                        userId,
                        vehicleId
                    }
                }
            });
            return true;
        } catch (e) {
            // Prisma throws if the record doesn't exist. Ignore for idempotency.
            return false;
        }
    }
};
