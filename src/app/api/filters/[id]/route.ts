import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { verifyInitData } from '@/lib/telegram/verifyInitData';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const initData = request.headers.get('x-telegram-init-data');
        if (!initData) {
            return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
        }

        const { isValid, user } = verifyInitData(initData);
        if (!isValid || !user) {
            return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
        }

        const telegramId = user.id.toString();

        const filter = await prisma.filter.findUnique({
            where: { id: id },
            include: { user: true }
        });

        if (!filter) {
            return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
        }

        if (filter.user.telegramId !== telegramId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.filter.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting filter:', error);
        return NextResponse.json({ error: 'Failed to delete filter' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const initData = request.headers.get('x-telegram-init-data');
        if (!initData) {
            return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
        }

        const { isValid, user } = verifyInitData(initData);
        if (!isValid || !user) {
            return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
        }

        const telegramId = user.id.toString();

        const filterToUpdate = await prisma.filter.findUnique({
            where: { id: id },
            include: { user: true }
        });

        if (!filterToUpdate || filterToUpdate.user.telegramId !== telegramId) {
            return NextResponse.json({ error: 'Filter not found or forbidden' }, { status: 403 });
        }

        const body = await request.json();

        const updatedFilter = await prisma.filter.update({
            where: { id: id },
            data: body
        });

        return NextResponse.json(updatedFilter);
    } catch (error) {
        console.error('Error updating filter:', error);
        return NextResponse.json({ error: 'Failed to update filter' }, { status: 500 });
    }
}
