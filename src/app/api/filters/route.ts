import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { verifyInitData } from '@/lib/telegram/verifyInitData';
import { notifyManagerAboutHotLead } from '@/lib/server/telegram/notifier';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
    try {
        const initData = request.headers.get('x-telegram-init-data');
        if (!initData) {
            return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
        }

        const { isValid, user } = verifyInitData(initData);
        if (!isValid || !user) {
            return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
        }

        // Search for user
        const dbUser = await prisma.user.findUnique({
            where: { telegramId: user.id.toString() },
            include: { filters: { orderBy: { createdAt: 'desc' } } }
        });

        if (!dbUser) {
            return NextResponse.json([]); // User not in DB yet, hence 0 filters
        }

        return NextResponse.json(dbUser.filters);
    } catch (error) {
        console.error('Error fetching filters:', error);
        return NextResponse.json(
            { error: 'Failed to fetch filters' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const initData = request.headers.get('x-telegram-init-data');
        if (!initData) {
            return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
        }

        const { isValid, user } = verifyInitData(initData);
        if (!isValid || !user) {
            return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
        }

        const body = await request.json();

        // Ensure user exists
        const telegramId = user.id.toString();
        
        let dbUser = await prisma.user.findUnique({
            where: { telegramId }
        });

        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    telegramId,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                    name: `${user.first_name} ${user.last_name || ''}`.trim(),
                }
            });
        }

        const newFilter = await prisma.filter.create({
            data: {
                ...body,
                budgetMax: body.budgetMax ? Number(body.budgetMax) : 0, 
                brand: body.brand || 'Не выбрано',
                userId: dbUser.id,
                // Make sure id isn't part of body
                id: undefined, 
            }
        });

        // 📝 Log activity for Lead CRM tracking
        await prisma.event.create({
            data: {
                type: 'filter_created',
                userId: dbUser.id,
                filterId: newFilter.id,
                meta: {
                    title: newFilter.title || newFilter.brand,
                    purchasePlan: newFilter.purchasePlan,
                    budgetMax: newFilter.budgetMax
                }
            }
        });

        if (newFilter.purchasePlan === 'ready_now') {
            notifyManagerAboutHotLead(dbUser, newFilter.title || newFilter.brand).catch(console.error);
        }

        return NextResponse.json(newFilter);
    } catch (error: any) {
        console.error('Error creating filter:', error);
        return NextResponse.json(
            { error: 'Failed to create filter', details: error?.message || String(error) },
            { status: 500 }
        );
    }
}
