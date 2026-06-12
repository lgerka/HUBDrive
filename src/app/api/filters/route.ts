import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

import { verifyInitData } from '@/lib/telegram/verifyInitData';
import { notifyManagerAboutHotLead } from '@/lib/server/telegram/notifier';

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

        // PRD §8.1: у пользователя может быть не больше двух активных фильтров
        const existingCount = await prisma.filter.count({ where: { userId: dbUser.id } });
        if (existingCount >= 2) {
            return NextResponse.json(
                { error: 'Можно создать не больше 2 фильтров. Удалите или измените один из существующих.' },
                { status: 400 }
            );
        }

        const newFilter = await prisma.filter.create({
            data: {
                userId: dbUser.id,
                title: body.title || null,
                brand: body.brand || 'Не выбрано',
                model: body.model || null,
                bodyTypes: body.bodyTypes ?? undefined,
                yearFrom: body.yearFrom ? Number(body.yearFrom) : null,
                yearTo: body.yearTo ? Number(body.yearTo) : null,
                budgetMax: body.budgetMax ? Number(body.budgetMax) : 0,
                budgetMin: body.budgetMin ? Number(body.budgetMin) : null,
                engineTypes: body.engineTypes ?? undefined,
                engineVolumeFrom: body.engineVolumeFrom ? Number(body.engineVolumeFrom) : null,
                engineVolumeTo: body.engineVolumeTo ? Number(body.engineVolumeTo) : null,
                drivetrain: body.drivetrain ?? undefined,
                transmission: body.transmission ?? undefined,
                exteriorColors: body.exteriorColors ?? undefined,
                interiorColors: body.interiorColors ?? undefined,
                mileageMax: body.mileageMax ? Number(body.mileageMax) : null,
                onlyNew: body.onlyNew ?? null,
                purchasePlan: body.purchasePlan || 'viewing',
                notificationsEnabled: body.notificationsEnabled ?? true,
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
