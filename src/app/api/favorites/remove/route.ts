import { NextResponse } from 'next/server';
import { usersRepo } from '@/server/repo/users';
import { favoritesRepo } from '@/server/repo/favorites';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { vehicleId } = body;

        if (!vehicleId) {
            return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
        }

        // Resolve dev user for MVP
        const user = await usersRepo.getOrCreateDevUser();

        // Remove from DB favorites
        await favoritesRepo.remove(user.id, vehicleId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json(
            { error: 'Failed to remove favorite from database.' },
            { status: 500 }
        );
    }
}
