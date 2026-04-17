import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Using a singleton for the repository layer since API routes might instantiate it repeatedly
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

export const usersRepo = {
    /**
     * Gets or creates a development user.
     * Temporary workaround until Telegram initData auth is fully used to identify real users.
     */
    async getOrCreateDevUser() {
        return prisma.user.upsert({
            where: { telegramId: 'dev' },
            create: {
                telegramId: 'dev',
                firstName: 'Developer',
                lastName: 'Admin',
                username: 'dev_admin',
            },
            update: {
                lastActiveAt: new Date(),
            },
        });
    }
};
