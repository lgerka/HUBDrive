import { NextResponse } from 'next/server';
import { favoritesRepo } from '@/server/repo/favorites';
import { resolveWebUser } from '@/lib/server/webUser';
import { prisma } from '@/lib/server/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { vehicleId } = body;

        if (!vehicleId) {
            return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
        }

        const user = await resolveWebUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await favoritesRepo.remove(user.id, vehicleId);

        // PRD §11, §21: фиксируем и удаление из избранного
        prisma.event.create({
            data: { type: 'favorite_removed', userId: user.id, vehicleId },
        }).catch(err => console.error('Error logging favorite_removed:', err));

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json(
            { error: 'Failed to remove favorite from database.' },
            { status: 500 }
        );
    }
}
