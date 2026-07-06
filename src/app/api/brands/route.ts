import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

export const revalidate = 60; // марки меняются редко — кэшируем на минуту

/**
 * Динамический справочник для фильтров: марки и модели из реального каталога.
 * Добавили авто новой марки в админке — она сразу доступна в фильтрах
 * (фронт мержит этот список со статическим справочником).
 */
export async function GET() {
    try {
        const rows = await prisma.vehicle.findMany({
            where: { status: { not: 'hidden' } },
            select: { brand: true, model: true },
            distinct: ['brand', 'model'],
        });

        const catalog: Record<string, string[]> = {};
        for (const { brand, model } of rows) {
            const b = brand.trim();
            const m = model.trim();
            if (!b) continue;
            if (!catalog[b]) catalog[b] = [];
            if (m && !catalog[b].includes(m)) catalog[b].push(m);
        }
        for (const b of Object.keys(catalog)) catalog[b].sort();

        return NextResponse.json(catalog);
    } catch (error) {
        console.error('Error building brands catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
