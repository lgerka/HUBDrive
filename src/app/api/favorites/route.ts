import { NextResponse } from 'next/server';
import { favoritesRepo } from '@/server/repo/favorites';
import { resolveWebUser } from '@/lib/server/webUser';

export async function GET(request: Request) {
    try {
        const user = await resolveWebUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
