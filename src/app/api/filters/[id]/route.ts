import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

import { verifyInitData } from '@/lib/telegram/verifyInitData';

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

        // PRD §21: логируем удаление фильтра
        prisma.event.create({
            data: { type: 'filter_deleted', userId: filter.userId, meta: { title: filter.title || filter.brand } },
        }).catch(err => console.error('Error logging filter_deleted:', err));

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

        // Явный whitelist полей — нельзя доверять сырому body
        const data: Record<string, unknown> = {};
        if (body.title !== undefined) data.title = body.title || null;
        if (body.brand !== undefined) data.brand = body.brand;
        if (body.model !== undefined) data.model = body.model || null;
        if (body.bodyTypes !== undefined) data.bodyTypes = body.bodyTypes;
        if (body.yearFrom !== undefined) data.yearFrom = body.yearFrom ? Number(body.yearFrom) : null;
        if (body.yearTo !== undefined) data.yearTo = body.yearTo ? Number(body.yearTo) : null;
        if (body.budgetMax !== undefined) data.budgetMax = Number(body.budgetMax) || 0;
        if (body.budgetMin !== undefined) data.budgetMin = body.budgetMin ? Number(body.budgetMin) : null;
        if (body.engineTypes !== undefined) data.engineTypes = body.engineTypes;
        if (body.engineVolumeFrom !== undefined) data.engineVolumeFrom = body.engineVolumeFrom ? Number(body.engineVolumeFrom) : null;
        if (body.engineVolumeTo !== undefined) data.engineVolumeTo = body.engineVolumeTo ? Number(body.engineVolumeTo) : null;
        if (body.drivetrain !== undefined) data.drivetrain = body.drivetrain;
        if (body.transmission !== undefined) data.transmission = body.transmission;
        if (body.exteriorColors !== undefined) data.exteriorColors = body.exteriorColors;
        if (body.interiorColors !== undefined) data.interiorColors = body.interiorColors;
        if (body.mileageMax !== undefined) data.mileageMax = body.mileageMax ? Number(body.mileageMax) : null;
        if (body.onlyNew !== undefined) data.onlyNew = body.onlyNew;
        if (body.purchasePlan !== undefined) data.purchasePlan = body.purchasePlan;
        if (body.notificationsEnabled !== undefined) data.notificationsEnabled = body.notificationsEnabled;

        const updatedFilter = await prisma.filter.update({
            where: { id: id },
            data
        });

        // PRD §21: логируем редактирование фильтра (вкл. смену степени готовности)
        prisma.event.create({
            data: {
                type: 'filter_updated',
                userId: filterToUpdate.userId,
                filterId: updatedFilter.id,
                meta: { purchasePlan: updatedFilter.purchasePlan },
            },
        }).catch(err => console.error('Error logging filter_updated:', err));

        return NextResponse.json(updatedFilter);
    } catch (error) {
        console.error('Error updating filter:', error);
        return NextResponse.json({ error: 'Failed to update filter' }, { status: 500 });
    }
}
