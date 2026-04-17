import { NextResponse } from 'next/server';
import { usersRepo } from '@/server/repo/users';
import { favoritesRepo } from '@/server/repo/favorites';

export async function GET() {
    try {
        // Resolve dev user for MVP
        const user = await usersRepo.getOrCreateDevUser();

        // Fetch favorites
        const vehicleIds = await favoritesRepo.list(user.id);

        return NextResponse.json({ ok: true, vehicleIds });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json(
            { error: 'Failed to fetch favorites from database.' },
            { status: 500 }
        );
    }
}
