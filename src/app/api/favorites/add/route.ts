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

        // Add to Db favorites
        await favoritesRepo.add(user.id, vehicleId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json(
            { error: 'Failed to add favorite to database.' },
            { status: 500 }
        );
    }
}
